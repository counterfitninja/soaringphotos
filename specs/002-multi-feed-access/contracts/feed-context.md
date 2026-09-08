# Contract: Feed Context & Feed-Aware Interfaces

**Date**: 2026-09-08 | **Feature**: [spec.md](spec.md)

Famstagram's external interfaces are its authenticated pages, server actions, and API routes. This contract defines the feed-context guarantees every one of them must honor.

## 1. Feed Context Resolution (`lib/feed-context.ts`)

Every guarded page/action/route resolves:

```text
FeedContext = {
  user: User
  memberships: [{ feedId, feedName, role }]   // may be empty
  activeFeedId: string | null                  // null only when memberships empty
  viewMode: "feed" | "all"                     // "all" = amalgamated view
  canManage: (feedId) => boolean               // admin, or manager of that feed
}
```

Rules:
- If `viewMode = "feed"`, `activeFeedId` MUST be one of the user's memberships; otherwise fall back to the first membership (and repair the session value).
- If memberships are empty, pages render the zero-feed empty state; mutations are rejected.
- Switching feed is a server action (`app/actions/feeds.ts`) writing `activeFeedId` + `viewMode` into the iron-session cookie.

## 2. Read Paths — Feed Filtering

| Surface | Rule |
|---------|------|
| Timeline `app/(app)/page.tsx` | `viewMode="feed"`: `Post.feedId = activeFeedId`. `viewMode="all"`: `feedId IN memberships`, include `feed { id, name }` for labels |
| Post detail `app/(app)/post/[id]` | Post's `feedId` must be in requester's memberships, else 404 (no existence leak, FR-010) |
| Media `app/api/media/[key]/route.ts` | Extract feed from key prefix (`feeds/<feedId>/...`; legacy keys → default feed); requester must be a member, else 404 |
| Profile `app/(app)/profile/[username]` | Show only posts whose feed the viewer shares with the profile owner |
| Search / suggest `app/(app)/search`, `app/api/users/suggest` | Results restricted to users sharing ≥1 feed with the searcher; post results restricted to searcher's feeds |
| Notifications `app/(app)/notifications` | Combined across all the user's feeds (FR-014a), each labeled; per-feed unread counts for switcher badges (FR-014b) |

## 3. Mutation Paths — Feed Authority

| Action | Authorization |
|--------|---------------|
| Create post (`app/api/posts/route.ts`) | Destination feed ∈ author's memberships; defaults to active feed; media keys written under `feeds/<feedId>/` |
| Like / comment / share / delete post (`app/actions/*`) | Post's feed ∈ actor's memberships |
| Switch feed (`app/actions/feeds.ts switchFeed`) | Target ∈ memberships or `"all"` |
| Create feed (`createFeed`) | Global admin only; name unique (case-insensitive) |
| Add member / create invite / remove member / set manager (`feeds.ts`, `invites.ts`) | Global admin, or manager of that feed; invite creation binds `Invite.feedId`; removal is immediate |
| Register via invite (`app/(public)/invite/[token]`, register action) | Creates account + `FeedMembership(invite.feedId)` atomically; invite remains single-use, 7-day TTL |

## 4. Error & Non-Discovery Contract

- Cross-feed or non-member access to any content/media/management endpoint returns the same 404/"not found" response as nonexistent content — no feed names, member lists, or metadata in errors (FR-010).
- Unauthorized management attempts (FR-009) return 403-equivalent redirect to `/` without revealing feed existence.
- Feed-destination validation failure on post creation returns a user-friendly message listing only the author's own feeds.

## 5. Session & PWA Contract

- Session cookie adds `activeFeedId?: string`, `feedViewMode?: "feed" | "all"` — additive, backward-compatible with existing cookies (absent → resolve from memberships).
- Push notification payloads include `feedId`; tapping routes to the post within its feed context (switching active feed if needed).
- Share-target route attributes inbound shared media to the user's active feed only, after membership verification.
