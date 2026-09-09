---

description: "Task list for comment timestamps and post-owner notifications"
---

# Tasks: Comment Timestamps and Post-Owner Notifications

**Input**: Design documents from `/specs/003-comment-timestamps-notifications/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an independent increment after foundational work.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project commands and test shape before changing feature code.

- [x] T001 Confirm the active Prisma schema, migration, and test commands in `package.json`, `prisma/schema.prisma`, and `tests/` before implementation
- [x] T002 [P] Add a focused test harness/module-mocking approach for notification policy in `tests/comment-notifications.test.ts` without changing production behavior

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the persistence contract and shared notification vocabulary required by all user stories.

**⚠️ CRITICAL**: Complete this phase before user-story implementation.

- [x] T003 Update `prisma/schema.prisma` to relate comment notifications to `Comment` through a nullable `commentId` while preserving existing post and mention notification records
- [x] T004 Create the Prisma migration under `prisma/migrations/` for comment notification identity and uniqueness, preserving existing notification rows and allowing multiple comment notifications on one post
- [x] T005 Update `lib/notifications.ts` notification types and recipient contracts to represent `comment` activity separately from `post` and `mention` activity
- [x] T006 Update `lib/push.ts` push recipient typing and payload wording so `comment` events identify the commenter and link to the related post while retaining best-effort failure handling
- [x] T007 [P] Add persistence/authorization fixtures and reusable test helpers in `tests/comment-notifications.test.ts` for an owner, commenter, shared feed, unrelated user, post, and comment

**Checkpoint**: The schema migration, notification vocabulary, and push contract are ready; user stories can now proceed in priority order.

## Phase 3: User Story 1 - See When Comments Were Made (Priority: P1) 🎯 MVP

**Goal**: Show every visible comment's date and time in smaller secondary text directly beneath the comment.

**Independent Test**: Open a feed card and full post page containing comments created at different times; each comment shows a readable timestamp below its text, with no overlap or horizontal overflow.

### Tests for User Story 1

- [x] T008 [P] [US1] Add a rendering/data-shape regression assertion in `tests/comment-notifications.test.ts` that comments retain ordered `createdAt` values needed by the shared post include

### Implementation for User Story 1

- [x] T009 [US1] Add a compact localized date-and-time formatter or extend the existing time utility in `lib/utils.ts` for an unambiguous comment timestamp presentation
- [x] T010 [US1] Render the formatted `comment.createdAt` directly beneath each comment text in `components/PostCard.tsx` using smaller secondary styling and preserving the existing author/comment layout
- [x] T011 [US1] Verify the shared `postInclude` contract in `lib/types.ts` continues to load comments in creation order with `createdAt` and update it only if the timestamp field is not already available

**Checkpoint**: User Story 1 is independently usable and testable without owner notification changes.

## Phase 4: User Story 2 - Notify the Picture Owner of a Comment (Priority: P1)

**Goal**: Create one unread in-app owner notification for each valid cross-user comment and attempt matching push delivery without weakening authorization or comment persistence.

**Independent Test**: Have a second authorized family member comment on an owner's post; verify one unread owner notification links to the post, self-comments do not notify, multiple comments remain distinct, and push failure leaves the in-app notification intact.

### Tests for User Story 2

- [x] T012 [P] [US2] Add notification-policy tests in `tests/comment-notifications.test.ts` for cross-user owner recipient selection, self-comment suppression, exact post link data, unread state, and feed-membership authorization
- [x] T013 [P] [US2] Add duplicate/multiple-comment tests in `tests/comment-notifications.test.ts` proving retries do not duplicate one comment notification and separate comments on one post create separate owner activity entries
- [x] T014 [P] [US2] Add push contract tests in `tests/comment-notifications.test.ts` or a focused push test module for `comment` title/body/url data and push failure fallback

### Implementation for User Story 2

- [x] T015 [US2] Extend `createCommentNotifications` in `lib/notifications.ts` to load the post owner and authorized feed membership, create a deduplicated `comment` notification tied to the newly created comment, and skip self-notification
- [x] T016 [US2] Update `addComment` in `app/actions/comments.ts` to pass the created comment identity into owner/mention notification orchestration only after validation, post lookup, and membership authorization succeed
- [x] T017 [US2] Update `app/(app)/notifications/page.tsx` to render a clear comment-specific action label and continue linking the notification to `/post/[id]` with the correct feed scope
- [x] T018 [US2] Ensure notification and push failures in `lib/notifications.ts` and `lib/push.ts` do not roll back the saved comment or suppress the in-app owner notification

**Checkpoint**: User Stories 1 and 2 are independently functional; a cross-user comment displays its timestamp and notifies the authorized owner.

## Phase 5: User Story 3 - Preserve Existing Comment Mentions (Priority: P2)

**Goal**: Keep existing mention notifications working while avoiding duplicate indistinguishable owner/mention events when the owner is mentioned in the same comment.

**Independent Test**: Submit a comment mentioning an authorized family member and verify the mention notification remains; when the mentioned member is also the post owner, verify the same comment does not produce duplicate owner activity for that recipient.

### Tests for User Story 3

- [x] T019 [P] [US3] Add mention regression tests in `tests/comment-notifications.test.ts` for authorized mentions, muted-author bypass for mentions, and preservation of existing mention notification fields
- [x] T020 [P] [US3] Add combined-recipient tests in `tests/comment-notifications.test.ts` proving an owner who is mentioned receives one understandable event for the comment while a different mentioned user still receives a mention event

### Implementation for User Story 3

- [x] T021 [US3] Refine recipient merging in `lib/notifications.ts` so owner and mention notifications for the same recipient/comment are deduplicated without suppressing mentions to other authorized members
- [x] T022 [US3] Update notification labels and icon/type handling in `app/(app)/notifications/page.tsx` so `comment` and `mention` events remain understandable and existing post notifications are unchanged

**Checkpoint**: All specified comment activity paths work independently and existing mention behavior remains compatible.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature against privacy, responsive layout, migration, and build quality gates.

- [x] T023 [P] Add focused authorization and migration regression coverage in `tests/comment-notifications.test.ts` for unrelated-feed users, invalid comments, missing posts, and existing notification rows
- [x] T024 [P] Review `components/PostCard.tsx` at representative desktop and mobile widths for timestamp clipping, overlap, wrapping, and unintended horizontal scrolling
- [x] T025 Run the feature scenarios in `specs/003-comment-timestamps-notifications/quickstart.md`, recording any environment-dependent push result without weakening in-app notification assertions
- [x] T026 Run the focused test command and `npm run build`, then fix only feature-related failures in `tests/`, Prisma migration output, or the touched application files
- [x] T027 Update `specs/003-comment-timestamps-notifications/quickstart.md` if the final notification wording, test command, or validation steps differ from the implemented behavior

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms the repository's existing validation surface.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because schema and shared notification contracts must exist first.
- **User Story 1 (Phase 3)**: Depends on Foundational; independently delivers the timestamp MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational; can run alongside US1 if separate files are assigned, but its UI and notification work should be validated after the schema migration.
- **User Story 3 (Phase 5)**: Depends on Foundational and the notification orchestration from US2; it preserves and refines the shared recipient path.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2; no dependency on US2 or US3.
- **User Story 2 (P1)**: Can start after Phase 2; shares `lib/notifications.ts` with US3 but is independently testable.
- **User Story 3 (P2)**: Starts after US2's notification type and owner-recipient path are established; it must not regress existing mention behavior.

### Parallel Opportunities

- T002 and T007 can run in parallel after T001.
- T009 and T011 can run in parallel before T010; T008 can be written in parallel with the implementation tasks.
- T012, T013, and T014 can be written in parallel before US2 implementation.
- T019 and T020 can be written in parallel before US3 implementation.
- T023 and T024 can run in parallel after the story checkpoints; T025 and T026 follow the completed implementation.
- US1's component/utility work can proceed in parallel with US2's Prisma/notification work after Phase 2, provided shared files are coordinated.

## Parallel Example: User Story 1

```text
Task T008: Add the comment timestamp regression assertion in tests/comment-notifications.test.ts
Task T009: Add the compact date/time formatter in lib/utils.ts
Task T011: Verify the post include timestamp contract in lib/types.ts
After T009 and T011: Task T010 renders the timestamp in components/PostCard.tsx
```

## Parallel Example: User Story 2

```text
Task T012: Test owner recipient and authorization behavior in tests/comment-notifications.test.ts
Task T013: Test duplicate and multiple-comment behavior in tests/comment-notifications.test.ts
Task T014: Test comment push payload and fallback behavior in tests/comment-notifications.test.ts
After T003-T006: Task T015 implements notification orchestration in lib/notifications.ts
After T015: Tasks T016-T018 integrate the action, notification page, and failure behavior
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup and Phase 2 foundational schema/contracts work.
2. Complete Phase 3 User Story 1.
3. Run the focused timestamp check and responsive manual scenario from `quickstart.md`.
4. Stop and validate the timestamp-only increment before enabling owner notifications.

### Incremental Delivery

1. Deliver US1 as the timestamp MVP.
2. Deliver US2 with owner in-app and best-effort push notifications.
3. Deliver US3 with mention compatibility and recipient deduplication.
4. Complete Phase 6 migration, privacy, responsive, test, and build validation.

## Notes

- Every implementation task includes an exact repository path and follows the required checklist format.
- No `contracts/` tasks are included because the approved plan identifies no standalone external interface.
- Notification persistence must be migration-safe for existing `post` and `mention` rows while permitting distinct comment activity on the same post.