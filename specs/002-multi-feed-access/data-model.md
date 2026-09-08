# Data Model: Multi-Feed Access

**Date**: 2026-09-08 | **Feature**: [spec.md](spec.md)

## New Entities

### Feed

A named private space. Existence visible only to members (FR-010).

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (cuid) | PK |
| name | String | unique, required; 1–50 chars (validation) |
| description | String | default "" |
| createdAt | DateTime | default now() |

Relations: `memberships FeedMembership[]`, `posts Post[]`, `invites Invite[]`, `notifications Notification[]`.

### FeedMembership

User ↔ feed association with per-feed role (Q2 clarification).

| Field | Type | Constraints |
|-------|------|-------------|
| id | String (cuid) | PK |
| userId | String | FK → User, cascade delete |
| feedId | String | FK → Feed, cascade delete |
| role | String | `"manager" \| "member"`, default `"member"` |
| createdAt | DateTime | default now() |

Constraints: `@@unique([userId, feedId])`, `@@index([feedId])`, `@@index([userId])`.

## Modified Entities

### User (additions)

| Field | Type | Notes |
|-------|------|-------|
| feedMemberships | FeedMembership[] | new relation |

`activeFeedId` intentionally **not** stored here — it lives in the iron-session cookie (see research.md Decision 1).

### Post (additions)

| Field | Type | Constraints |
|-------|------|-------------|
| feedId | String | FK → Feed, required after backfill; `@@index([feedId, createdAt])` replaces `@@index([createdAt])` for feed-scoped timelines |

All child collections (`media`, `likes`, `comments`, `shares`, `notifications`) inherit feed visibility through the post — no separate `feedId` on them (single source of truth, avoids inconsistent scoping).

### Invite (additions)

| Field | Type | Constraints |
|-------|------|-------------|
| feedId | String | FK → Feed, required after backfill; `@@index([feedId])` |

Registration consumes the invite and creates the `FeedMembership` in the same transaction.

### Notification (additions)

| Field | Type | Constraints |
|-------|------|-------------|
| feedId | String | FK → Feed, required after backfill; supports combined center + per-feed unread `groupBy` counts |

Denormalized from `post.feedId` so badge counts and the combined center don't need a post join.

### Media (no schema change)

Feed ownership derived from `Post.feedId`; storage keys prefixed `feeds/<feedId>/...` for new uploads so objects are feed-self-contained (research.md Decision 3). Legacy unprefixed keys resolve to the default feed in the media route.

## Validation Rules (additions to `lib/validation.ts`)

- `FEED_NAME_MIN = 1`, `FEED_NAME_MAX = 50`; trimmed, must not be empty; uniqueness enforced case-insensitively at the server action.
- Feed switch: target must be one of the user's membership ids, or the special value `"all"` (amalgamated view).
- Post creation: destination feed must be one of the author's memberships (server-side re-check in `app/api/posts/route.ts`).
- Membership ops: caller must be global admin or manager of the target feed; cannot remove the last manager of a feed; cannot demote/remove the global admin's membership in the default feed.

## State Transitions

- **Feed**: created → active. No delete/archive in this iteration (spec assumption).
- **Membership**: none → member (invite accept or manager add) → removed (immediate access loss, FR-013). Role: member ↔ manager (admin only).
- **Active feed**: set on switch; if the active membership is removed, session context falls back to another membership or the zero-feed empty state (edge case).

## Migration Plan (FR-015)

Single migration, ordered:

1. Create `Feed`, `FeedMembership` tables.
2. Add nullable `feedId` to `Post`, `Invite`, `Notification`.
3. Backfill: insert default feed "Family"; add every existing user as a member (existing `role = "admin"` users become `manager`); set all `feedId`s to the default feed.
4. Alter columns to `NOT NULL`, add indexes/foreign keys.
5. Session cookies carry no feed yet → first request after deploy resolves to the default feed (only membership for existing users) — behavior unchanged.
