# Research: Multi-Feed Access

**Date**: 2026-09-08 | **Feature**: [spec.md](spec.md)

All Technical Context items were known from the existing codebase (Next.js 15 + Prisma + SQLite + iron-session); no external unknowns required web research. The following design decisions were resolved against the codebase and the clarified spec.

## Decision 1: Where the active feed lives

- **Decision**: Store `activeFeedId` in the existing iron-session cookie (`lib/session.ts` `SessionData`), not in the database.
- **Rationale**: The session is already the per-device, per-browser context — two devices of the same user can legitimately be viewing different feeds. Cookie storage avoids a DB write on every switch and matches FR-005 ("remember last-active feed") naturally since the session cookie persists.
- **Alternatives considered**: (a) `User.activeFeedId` DB column — syncs across devices, but forces a write per switch and conflates per-device browsing state with account state; rejected. (b) URL query param (`?feed=`) — shareable, but leaks feed identifiers into copied links and conflicts with FR-010 non-discovery on mistyped links; rejected as the source of truth (may be accepted as an explicit override later).

## Decision 2: Feed scoping enforcement point

- **Decision**: A single `lib/feed-context.ts` module exposing `getFeedContext()` (user + memberships + active feed) and `requireFeedMembership(feedId)`; every timeline/detail/action/media path resolves context through it. Feed-scoped queries filter on the indexed `Post.feedId`; the amalgamated view uses `feedId IN (membershipIds)`.
- **Rationale**: Centralizing keeps the authorization decision auditable (Constitution III) and prevents divergent scoping logic across the six action modules and two route handlers that touch content.
- **Alternatives considered**: (a) Prisma middleware/extensions auto-injecting `feedId` — magical, hard to audit, breaks the deliberate "amalgamated" multi-feed query; rejected. (b) Per-page ad-hoc filters — high leak risk; rejected.

## Decision 3: Media authorization with feeds

- **Decision**: Prefix storage keys with the feed (`feeds/<feedId>/<uuid>.<ext>`) in both `local` and `s3` drivers, and have `app/api/media/[key]/route.ts` extract the feed from the key, verify the requester's membership, then stream. Existing keys (no prefix) resolve to the default feed after migration.
- **Rationale**: Key-prefixing makes each feed's media self-contained — directly supporting FR-001's future "split a feed onto separate compute" (a feed's objects can be migrated as one prefix) — and makes the auth check a pure function of the key plus membership, with no extra DB lookup to find the owning post.
- **Alternatives considered**: (a) Look up owning post by key suffix — extra query, fragile on key collisions; rejected. (b) Signed per-feed URLs — unnecessary complexity at family scale; rejected.

## Decision 4: Invite scoping

- **Decision**: `Invite` gains a required `feedId`; registration via an invite creates the account and a `FeedMembership` for that feed in one transaction. Managers create invites only for feeds they manage; the global admin for any feed. Invites stay single-use with the existing 7-day TTL.
- **Rationale**: FR-012 requires invites to land the new user in exactly the specified feed; keeping TTL/single-use satisfies Constitution III unchanged.
- **Alternatives considered**: Multi-feed invites (one token → many feeds) — deferred; single-feed invites compose fine (send two links) and keep the model simple.

## Decision 5: Amalgamated view and notifications

- **Decision**: Amalgamated timeline is the same `postInclude` query with `feedId IN (...)` plus `feed: { select: { id, name } }` added to the include so `FeedLabel` can render. Notification center lists all of the user's feeds' notifications with feed name; per-feed unread counts computed as grouped `count` queries for the switcher badges.
- **Rationale**: Reuses the existing include-shape pattern (`lib/types.ts`) and notification query patterns; per-feed badge counts are cheap at family scale.
- **Alternatives considered**: Client-side merge of per-feed fetches — N queries, worse pagination; rejected.

## Decision 6: Default-feed migration

- **Decision**: One Prisma migration creates `Feed`/`FeedMembership`, adds nullable `feedId` columns, backfills: create "Family" feed → set all posts/notifications/invites to it → add all existing users as members (role: existing admins become managers of the default feed) → enforce `NOT NULL`.
- **Rationale**: FR-015 requires zero behavior change on day one; nullable-then-backfill-then-constrain is the safe SQLite-compatible migration path (SQLite can't add a NOT NULL column with a non-constant default in one step).
- **Alternatives considered**: Separate seed script — risks running un-backfilled in production; rejected.

## Decision 7: Single-feed UX degradation (FR-016)

- **Decision**: When a user has exactly one membership, the `FeedSwitcher` renders as a static feed-name label (no dropdown); the composer hides the destination picker (fixed to the only feed); zero memberships render the empty state.
- **Rationale**: Keeps today's UI pixel-identical for existing users, satisfying FR-016/SC-005, with one conditional branch instead of a parallel layout.
