---

description: "Task list for Multi-Feed Access implementation"
---

# Tasks: Multi-Feed Access (Private Feeds)

**Input**: Design documents from `/specs/002-multi-feed-access/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/feed-context.md, quickstart.md

**Tests**: The spec and constitution require focused automated tests for authorization/validation boundaries (Constitution IV). Test tasks are included for those boundaries only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js App Router project at repo root: `app/`, `lib/`, `components/`, `prisma/`, `tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema and shared foundations every story depends on

- [x] T001 Add `Feed` and `FeedMembership` models to prisma/schema.prisma with fields, relations, `@@unique([userId, feedId])` and indexes per data-model.md
- [x] T002 Add nullable `feedId` (FK → Feed) to `Post`, `Invite`, and `Notification` models plus the new relations on `User` in prisma/schema.prisma; replace `Post`'s `@@index([createdAt])` with `@@index([feedId, createdAt])`
- [x] T003 Create Prisma migration with ordered backfill per data-model.md: create default "Family" feed, add all existing users as members (existing admins as managers), set all `feedId`s to the default feed, then enforce NOT NULL; run `npm run db:migrate`
- [x] T004 [P] Add feed validation rules to lib/validation.ts: `FEED_NAME_MIN`/`FEED_NAME_MAX` constants and `validateFeedName` (trim, non-empty, ≤50 chars)
- [x] T005 [P] Extend `SessionData` in lib/session.ts with `activeFeedId?: string` and `feedViewMode?: "feed" | "all"` (additive, backward-compatible)

**Checkpoint**: Schema migrated, existing app behavior unchanged (default feed only)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The central feed-context authorization layer that ALL user stories use (contracts/feed-context.md §1). MUST complete before any story phase.

- [x] T006 Create lib/feed-context.ts: `getFeedContext()` (user + memberships + activeFeedId + viewMode, with session repair when active feed is no longer a membership), `requireFeedContext()` (redirects to /login, handles zero-membership state), and `canManageFeed(user, feedId)` (global admin or manager of that feed)
- [x] T007 [P] Add feed switch server action `switchFeed(target: string)` to new app/actions/feeds.ts: validates target ∈ memberships or `"all"`, writes session, revalidates layout
- [x] T008 Create tests/feed-context.test.ts covering: context resolution with 0/1/many memberships, fallback when active membership removed, `canManageFeed` for admin/manager/member, and switchFeed target validation
- [x] T009 Update lib/types.ts: extend `postInclude` with `feed: { select: { id: true, name: true } }` and update `PostWithRelations`; verify existing consumers still compile

**Checkpoint**: `node --test tests/feed-context.test.ts` passes; feed context available to all routes

## Phase 3: User Story 1 — Switch Between Multiple Private Feeds (Priority: P1) 🎯 MVP

**Goal**: A multi-feed member sees only the active feed's content everywhere and can switch feeds with the choice remembered across sessions; non-members cannot discover other feeds.

**Independent Test**: Seed two feeds with distinct content and one dual-member + one single-member user; verify toggle behavior, scoping of timeline/detail/notifications, non-discovery for the single-member, and persistence across reopen (spec US1 scenarios 1–5).

- [x] T010 [US1] Scope the timeline in app/(app)/page.tsx: resolve feed context; `viewMode="feed"` filters `Post.feedId = activeFeedId`; render zero-feed empty state when no memberships
- [x] T011 [P] [US1] Scope post detail app/(app)/post/[id]/page.tsx: 404 when post's feed ∉ viewer memberships
- [x] T012 [P] [US1] Scope media route app/api/media/[key]/route.ts: resolve owning feed from key prefix (`feeds/<feedId>/...`, legacy keys → default feed) and 404 for non-members
- [x] T013 [P] [US1] Scope profile app/(app)/profile/[username]/page.tsx: show only posts in feeds shared with viewer
- [x] T014 [P] [US1] Scope search app/(app)/search/page.tsx and app/api/users/suggest/route.ts: restrict to users/posts sharing ≥1 feed with the searcher
- [x] T015 [US1] Create components/FeedSwitcher.tsx: dropdown listing memberships with per-feed unread badges; static label when exactly 1 membership (FR-016); "All feeds" option hidden until US3 (render only when enabled prop passed)
- [x] T016 [US1] Mount FeedSwitcher in components/Navbar.tsx (desktop) and components/MobileTabBar.tsx (mobile), passing memberships + unread counts from app/(app)/layout.tsx
- [x] T017 [US1] Scope notifications page app/(app)/notifications/page.tsx to viewer's feeds and add per-feed unread count queries (grouped by feedId) for switcher badges
- [ ] T018 [US1] Run quickstart Scenario 1 (migration behavior unchanged), Scenario 3 switching half, and Scenario 5 (privacy boundary: cross-feed post/media URLs 404)

**Checkpoint**: US1 independently testable — feed toggle works, hard privacy boundary verified

## Phase 4: User Story 4 — Feed Administration and Membership (Priority: P2a)

**Goal**: Global admin creates feeds and appoints managers; managers invite/add/remove members within their own feeds; removals take effect immediately. (Phased before US2/US3 because later stories need real multi-feed data.)

**Independent Test**: Create feed, invite brand-new user into it, add/remove existing users, verify immediate access changes and manager-scope denial (spec US4 scenarios 1–6).

- [x] T019 [US4] Add feed management server actions to app/actions/feeds.ts: `createFeed(name, description?)` (admin only, case-insensitive unique name), `addMember(feedId, userId)`, `removeMember(feedId, userId)` (blocks removing last manager; blocks removing global admin from default feed), `setMemberRole(feedId, userId, role)` (admin only)
- [x] T020 [P] [US4] Scope invites in app/actions/invites.ts: `createInvite(feedId)` requiring admin-or-manager of that feed and binding `Invite.feedId`; update delete/list similarly
- [x] T021 [US4] Update registration flow app/(public)/invite/[token]/page.tsx and the register action to create the account and its `FeedMembership(invite.feedId)` in one transaction
- [x] T022 [US4] Create feed management UI app/(app)/feeds/page.tsx (feed list visible to admin/managers) and app/(app)/feeds/[id]/page.tsx (member roster, invite creation, add/remove, role toggle) with manager-scoped controls only
- [x] T023 [US4] Add management links to app/(app)/admin/page.tsx and CopyInviteLink.tsx reuse for feed-scoped invite URLs
- [ ] T024 [US4] Run quickstart Scenario 2 (scoped invite) and Scenario 6 (manager authority denied outside managed feed)

**Checkpoint**: US4 independently testable — full feed lifecycle works

## Phase 5: User Story 2 — Post to a Chosen Feed (Priority: P2b)

**Goal**: Multi-feed members explicitly pick the destination feed when posting (defaulted to active feed); posts land only in the chosen feed.

**Independent Test**: Dual-feed member posts with default and overridden destinations; verify per-feed visibility (spec US2 scenarios 1–4).

- [x] T025 [US2] Update post creation route app/api/posts/route.ts: accept `feedId`, verify destination ∈ author's memberships (server-side), write media keys under `feeds/<feedId>/` prefix via lib/storage.ts
- [x] T026 [US2] Add feed-prefixed key support to lib/storage.ts local and s3 drivers (new keys `feeds/<feedId>/<uuid>.<ext>`; legacy keys still readable)
- [x] T027 [US2] Update components/UploadForm.tsx: destination feed picker defaulted to active feed, hidden for single-feed members; show friendly error listing only the author's feeds on validation failure
- [x] T028 [P] [US2] Scope post mutations in app/actions/posts.ts (delete), app/actions/likes.ts, app/actions/comments.ts, app/actions/shares.ts: verify the post's feed ∈ actor's memberships before mutating
- [ ] T029 [US2] Run quickstart Scenario 3 in full (post targeting + defaults + removed-feed publish blocked)

**Checkpoint**: US2 independently testable — posts publish to exactly the chosen feed

## Phase 6: User Story 3 — Amalgamated "All My Feeds" View (Priority: P3)

**Goal**: Multi-feed members can browse one merged, newest-first timeline of all their feeds with an always-visible feed label on every post.

**Independent Test**: Dual-feed member's "All feeds" view equals the union of both feeds with correct order/labels; single-feed member's view matches their one feed (spec US3 scenarios 1–4).

- [x] T030 [US3] Add `viewMode="all"` handling to app/(app)/page.tsx timeline: `feedId IN memberships`, same pagination pattern
- [x] T031 [P] [US3] Create components/FeedLabel.tsx (small feed-name chip/badge) and render it on PostCard in amalgamated mode (and harmlessly in single-feed mode per design)
- [x] T032 [US3] Enable the "All feeds" option in components/FeedSwitcher.tsx (pass enabled from layout once US3 lands)
- [x] T033 [US3] Include `feedId` in push notification payloads in lib/push.ts and lib/notifications.ts so tapping routes into the post's feed context (switching active feed if needed)
- [x] T034 [US3] Scope share-target route app/api/share-target/route.ts to the user's active feed after membership verification
- [ ] T035 [US3] Run quickstart Scenario 4 (amalgamated correctness/labels) and Scenario 7 (combined notification center + badges)

**Checkpoint**: US3 independently testable — combined browsing works

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, docs, and release gates

- [x] T036 [P] Update docs/user-stories.md and README.md with the feed model (feeds, managers, amalgamated view) per Constitution V documentation requirement
- [ ] T037 [P] Verify FeedSwitcher/FeedLabel at desktop + mobile viewports and installed PWA per quickstart Scenario 8 (no clipping/overlap, safe areas)
- [ ] T038 Run full quickstart.md Scenarios 1–8 end-to-end on a clean database; confirm SC-001 (zero cross-feed leakage) via Scenario 5
- [ ] T039 Run `node --test tests/` and `npm run build`; both must pass before release (Constitution IV)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → all story phases
- **US1 (Phase 3)** is the MVP and the privacy backbone — must land first
- **US4 (Phase 4)** next: creates the multi-feed data that US2/US3 exercises (priority tie broken by data dependency)
- **US2 (Phase 5)** and **US3 (Phase 6)** are independent of each other — either order or parallel
- **Polish (Phase 7)** last

### Within Each Story

- Models/schema (Setup) → context helpers (Foundational) → read-path scoping [P] → UI mounting → story validation scenario

### Parallel Opportunities

- T004 + T005 (Setup) in parallel
- T008 can start once T006/T007 land; T009 parallel with T006–T008
- US1: T011–T014 (read-path scoping) all parallel after T010
- US4: T020 parallel with T019
- US2: T028 parallel with T025–T027
- US3: T031 parallel with T030
- Polish: T036 + T037 parallel

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T009)
3. Complete Phase 3: US1 (T010–T018)
4. **STOP and VALIDATE**: quickstart Scenarios 1, 3 (switching half), 5 — privacy boundary proven
5. Deploy/demo: existing users see zero change (single-feed degradation), multi-feed capability proven with seeded data

### Incremental Delivery

1. Setup + Foundational + US1 → feed switching with hard privacy (MVP)
2. + US4 → feeds can be created and populated through the UI (real usage)
3. + US2 → members publish to chosen feeds
4. + US3 → amalgamated browsing and feed-aware notifications
5. Polish → docs, responsive verification, release gates
