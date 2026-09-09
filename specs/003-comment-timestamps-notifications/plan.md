# Implementation Plan: Comment Timestamps and Post-Owner Notifications

**Branch**: `003-comment-timestamps-notifications` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-comment-timestamps-notifications/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Display each comment's existing creation date and time beneath its text in the shared post card, using the repository's existing secondary timestamp styling. Extend comment notification creation so the post owner receives an in-app notification, and an optional push notification, when another authorized family member comments. Add comment identity to comment notifications so multiple comments on one post remain distinct and duplicate delivery is prevented.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7, React 19, Next.js 15 App Router

**Primary Dependencies**: Prisma 6 with SQLite, Tailwind CSS, `web-push`, existing iron-session auth helpers

**Storage**: Prisma-managed SQLite database; existing `Comment` and `Notification` records, plus a migration for comment notification identity

**Testing**: Focused TypeScript/runtime tests under `tests/`, Prisma migration validation, `npm run build`, and manual responsive browser checks

**Target Platform**: Authenticated desktop and mobile web/PWA browsers supported by the existing application

**Project Type**: Full-stack web application with server actions, server-rendered pages, and push notifications

**Performance Goals**: Comment acceptance and in-app owner notification creation complete within 5 seconds under normal development-scale load; timestamp rendering adds no extra per-comment data request

**Constraints**: Preserve feed membership authorization, comment validation, existing mention notifications, notification mute semantics, authenticated media access, and graceful push failure behavior

**Scale/Scope**: One shared comment display path, one comment server action, notification helper/push contract, notification center rendering, one Prisma migration, and focused regression coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Private-by-Default Family Sharing**: PASS. Owner notifications are limited to the post's authorized feed, and notification links continue to target authenticated post routes.
- **II. Validated Media and Input Boundaries**: PASS. The feature reuses the existing comment validation boundary and introduces no new user-controlled input.
- **III. Explicit Authentication and Sensitive Operations**: PASS. Comment creation remains behind the existing authenticated action and feed-membership check; notification recipients are authorized before creation.
- **IV. Tested User-Critical Behavior**: PASS with planned focused tests for comment timestamp rendering data, owner notification recipient/duplicate behavior, mention regression, and authorization.
- **V. Simple, Observable, and Compatible Evolution**: PASS. The design extends existing Prisma, server-action, notification, and shared UI patterns; push failures remain observable and do not roll back saved comments.
- **VI. Responsive PWA and Layout Integrity**: PASS. Timestamp presentation is a compact secondary line in the existing responsive comment layout and is included in desktop/mobile validation.
- **Gate status**: PASS. No constitution violations or unresolved design clarifications remain.

### Post-Design Re-check

- **I. Private-by-Default Family Sharing**: PASS. The data model keeps notifications tied to the authorized feed and exact post/comment.
- **II. Validated Media and Input Boundaries**: PASS. No new upload or free-form input boundary is introduced; existing comment validation remains authoritative.
- **III. Explicit Authentication and Sensitive Operations**: PASS. Recipient resolution occurs after authenticated comment authorization, and push subscriptions are never treated as authorization.
- **IV. Tested User-Critical Behavior**: PASS. `quickstart.md` defines focused automated and manual checks for persistence, deduplication, authorization, mention regression, delivery fallback, and responsive layout.
- **V. Simple, Observable, and Compatible Evolution**: PASS. Nullable comment linkage preserves existing notification rows and the existing push helper remains the delivery boundary.
- **VI. Responsive PWA and Layout Integrity**: PASS. The shared comment layout is checked at representative desktop and mobile sizes.
- **Post-design gate status**: PASS. No new violations were introduced by the design.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
app/actions/comments.ts       # Authenticated comment mutation and notification orchestration
app/(app)/notifications/page.tsx # In-app notification labels and links
components/PostCard.tsx       # Shared comment rendering and timestamp placement
lib/notifications.ts           # Recipient selection and notification creation
lib/push.ts                    # Push payload type/title/body handling
lib/types.ts                   # Shared post include shape, if notification-linked data is needed
prisma/schema.prisma           # Comment notification relation/identity
prisma/migrations/             # Database migration for notification identity
tests/                         # Focused notification and authorization regression tests
```

**Structure Decision**: Use the existing single Next.js application structure. Keep comment mutation logic in `app/actions`, shared rendering in `components`, notification policy in `lib`, persistence in Prisma, and focused behavior tests in `tests`. No new application boundary or external service is introduced.

**Contract Decision**: No `contracts/` artifact is generated. The feature changes authenticated in-app behavior and internal persistence; it exposes no standalone external API contract.

## Complexity Tracking

No constitution violations require complexity justification.
