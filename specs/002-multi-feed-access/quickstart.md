# Quickstart Validation: Multi-Feed Access

**Date**: 2026-09-08 | **Feature**: [spec.md](spec.md)

Runnable end-to-end validation scenarios proving the feature works. Prerequisites: repo checked out on branch `002-multi-feed-access`, Node 20+, `npm install` done.

## Setup

```bash
npm run db:migrate    # applies feed migration + backfills default "Family" feed
npm run db:seed       # ensures admin user exists
npm run dev           # http://localhost:3000
```

Automated checks:

```bash
node --test tests/feed-context.test.ts   # membership/authorization unit tests
npm run build                            # release gate
```

## Scenario 1 — Migration preserves existing behavior (FR-015, SC-005)

1. Before migrating, note the existing timeline as admin.
2. Run `npm run db:migrate`, restart dev server, log in as admin.
3. **Expect**: timeline identical to before; feed selector shows static label "Family" (single membership → no dropdown per FR-016); posting works unchanged.

## Scenario 2 — Feed creation and scoped invite (FR-001, FR-009, FR-012)

1. As admin, open the new Feeds management page → create feed "Friends". **Expect**: feed exists, empty timeline.
2. Create an invite scoped to "Friends"; open the invite link in a private window; register user `sam`.
3. **Expect**: `sam`'s account is a member of exactly "Friends"; `sam` sees only the empty "Friends" feed and no trace of "Family" (FR-010).

## Scenario 3 — Multi-feed switching and post targeting (FR-004–FR-007)

1. As admin, add `sam` to "Family" as member.
2. As `sam`: create post A with destination "Friends"; switch feed to "Family"; create post B (defaults to "Family").
3. **Expect**: post A visible only in "Friends" context; post B only in "Family"; selector switches in ≤2 taps/clicks and timeline loads < 2s (SC-002); reopening the browser restores the last-active feed (FR-005).

## Scenario 4 — Amalgamated view (FR-008, Q4)

1. As `sam`, select "All feeds".
2. **Expect**: posts A and B merged newest-first; each shows an always-visible feed label chip; opening either post shows its own feed's comments/likes.

## Scenario 5 — Privacy boundary (FR-003, FR-010, FR-011, SC-001)

1. Copy the direct URL of post A (a "Friends" post) and one of its media URLs.
2. In a session as a "Family"-only user (e.g., admin before being added to "Friends"), open both URLs.
3. **Expect**: 404/not-found for both, identical to a nonexistent post; search and user-suggest never surface "Friends"-only users to non-shared-feed users.

## Scenario 6 — Manager authority (FR-009)

1. As admin, appoint `sam` manager of "Friends".
2. As `sam`: invite a new user `pat` into "Friends"; attempt to add anyone to "Family".
3. **Expect**: invite works for "Friends" only; "Family" management controls absent/denied for `sam`.

## Scenario 7 — Removal and notifications (FR-013, FR-014, FR-014a/b)

1. With `sam` active on "Family", have admin comment on a "Friends" post; check `sam`'s notification center.
2. **Expect**: combined list shows the "Friends" notification with its feed label; selector badge shows the "Friends" unread count; tapping it switches to "Friends".
3. As admin, remove `sam` from "Friends".
4. **Expect**: "Friends" immediately disappears from `sam`'s selector, notifications from it stop, and its direct links 404.

## Scenario 8 — Responsive/PWA check (Constitution VI)

1. Repeat Scenarios 3–4 at a mobile viewport (e.g., 390×844) and in the installed PWA.
2. **Expect**: feed selector reachable from the mobile tab bar without overlap/clipping; feed labels don't overflow post cards; safe areas respected.
