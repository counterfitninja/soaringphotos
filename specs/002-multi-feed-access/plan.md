# Implementation Plan: Multi-Feed Access (Private Feeds)

**Branch**: `002-multi-feed-access` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-multi-feed-access/spec.md`

## Summary

Add multi-feed support to Famstagram: one deployment hosts many named private feeds; each post/media/comment/like/notification is scoped to exactly one feed; users hold memberships in zero-to-many feeds and switch between them (or view an amalgamated, feed-labeled timeline) via a persistent feed selector. The global admin creates feeds and appoints per-feed managers who run their own feed's membership via feed-scoped invites. Approach: extend the Prisma schema with `Feed` + `FeedMembership` models and a `feedId` on all content models; resolve the active feed from the iron-session cookie through a new `lib/feed-context.ts`; enforce membership at every query boundary; migrate all existing data into a default "Family" feed.

## Technical Context

**Language/Version**: TypeScript 5, Node 20+, Next.js 15 (App Router)

**Primary Dependencies**: Next.js App Router server actions + route handlers, Prisma ORM, iron-session, Tailwind CSS, bcryptjs, WebAuthn (existing)

**Storage**: Prisma + SQLite (`prisma/dev.db`); media via `lib/storage.ts` abstraction (local disk default, S3/MinIO optional) — storage keys will be namespaced per feed to keep feed boundaries splittable

**Testing**: Node test runner (`node --test`) for unit-level validation/auth tests (existing pattern in `tests/`), plus quickstart manual validation scenarios; production build (`npm run build`) as the release gate

**Target Platform**: Installable PWA on desktop + mobile browsers (existing)

**Project Type**: Web application (Next.js App Router, server-rendered)

**Performance Goals**: Feed switch + timeline render < 2s (SC-002); all feed-scoped queries use indexed `feedId` columns; amalgamated view is a single `feedId IN (...)` query with the existing pagination pattern

**Constraints**: Zero cross-feed data leakage (SC-001); media access requires feed membership; single-feed users see no workflow change (FR-016); feed boundaries kept self-contained for future per-feed compute split (FR-001)

**Scale/Scope**: Family-scale — tens of users, low thousands of posts, up to ~10 feeds per user (SC-004 test range 1–10 memberships)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Private-by-Default Family Sharing | Feeds harden privacy: content scoped per feed, cross-feed access denied as "not found", non-members cannot discover feed existence | ✅ PASS |
| II. Validated Media and Input Boundaries | Feed name/invite/membership inputs validated in shared `lib/validation.ts`; upload validation unchanged, plus feed-destination membership check server-side | ✅ PASS |
| III. Explicit Authentication and Sensitive Operations | Feed context resolved from iron-session via new `lib/feed-context.ts` helper applied to every guarded route/action; feed-scoped invites remain single-use and time-limited | ✅ PASS |
| IV. Tested User-Critical Behavior | Authorization boundary tests for feed scoping (queries, media route, invites, notifications) required before release; build + focused tests must pass | ✅ PASS |
| V. Simple, Observable, and Compatible Evolution | Reuses existing Prisma, server-action, route-handler, shared-UI patterns; default-feed migration preserves current behavior; docs updated | ✅ PASS |
| VI. Responsive PWA and Layout Integrity | Feed selector designed for mobile tab bar + desktop navbar; verified at representative viewports | ✅ PASS |

**Post-design re-check**: see end of this file — all gates still pass; media key prefixing strengthens Principle I.

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-feed-access/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── feed-context.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                    # + Feed, FeedMembership, feedId on Post/Notification/Invite
├── migrations/                      # new migration + data backfill to default feed
lib/
├── feed-context.ts                  # NEW: resolve active feed, membership checks, feed switch
├── validation.ts                    # + feed name rules
├── types.ts                         # + feed in post include
app/
├── (app)/layout.tsx                 # feed selector data
├── (app)/page.tsx                   # timeline: feed-scoped + amalgamated mode
├── (app)/feeds/                     # NEW: feed management pages (admin + managers)
├── actions/
│   ├── feeds.ts                     # NEW: create feed, manage members/managers, switch feed
│   ├── invites.ts                   # feed-scoped invites
│   ├── posts.ts, comments.ts, likes.ts, shares.ts, notifications.ts  # feed scoping
├── api/
│   ├── posts/route.ts               # feed destination on create
│   └── media/[key]/route.ts         # feed membership check before streaming
components/
├── FeedSwitcher.tsx                 # NEW: selector + per-feed unread badges
├── FeedLabel.tsx                    # NEW: post feed chip (amalgamated view)
├── Navbar.tsx, MobileTabBar.tsx     # host FeedSwitcher
tests/
├── feed-context.test.ts             # NEW: membership/authorization unit tests
```

**Structure Decision**: Existing single Next.js App Router project; all changes follow the established route-group (`(app)` guarded, `(public)` invite), server-action, and `lib/` helper conventions. No new top-level projects.

## Complexity Tracking

No constitution violations requiring justification.

---

## Post-Design Constitution Re-Check

| Principle | Result |
|-----------|--------|
| I. Private-by-Default | ✅ Media keys namespaced `feeds/<feedId>/...`; media route checks membership of owning feed; search/suggest/profile filtered by shared feeds |
| II. Validated Boundaries | ✅ Feed name + membership ops validated in `lib/validation.ts`; post-destination membership re-checked server-side in `app/api/posts/route.ts` |
| III. Explicit Auth | ✅ `requireFeedContext()` central helper; no route bypasses it; invites still single-use/TTL, now feed-scoped |
| IV. Tested | ✅ `tests/feed-context.test.ts` + media-route authorization tests + quickstart scenarios |
| V. Simple Evolution | ✅ Single new helper + 2 new models; backfill migration keeps existing behavior identical |
| VI. Responsive PWA | ✅ FeedSwitcher placed in Navbar (desktop) and MobileTabBar (mobile); layout checks in quickstart |

**Gate result: PASS — proceed to `/speckit-tasks`.**
