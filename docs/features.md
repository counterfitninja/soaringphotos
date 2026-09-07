# Famstagram Features

**Review date**: 2026-09-07

Feature status reflects the current repository implementation. **Implemented** means there is a
route, action, API, component, model, or documented workflow supporting the capability. **Partial**
means the capability exists but has an important boundary or missing operational requirement.

## Epic 1: Family Identity and Access

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-1.1 | Invite-only membership | Implemented | Admin-created, single-use invites with seven-day expiry, registration, invite status, and unused-invite deletion. |
| F-1.2 | Password authentication and sessions | Implemented | Username/email login, hashed passwords, session cookies, route guards, and logout. |
| F-1.3 | Passkey authentication | Implemented | WebAuthn registration, verification, login, and stored credentials with counters. |
| F-1.4 | Profile identity | Implemented | Username, join date, post count, post grid, and optional profile photo. |

## Epic 2: Family Media Publishing

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-2.1 | Family feed | Implemented | Authenticated newest-first feed with pagination and post summaries. |
| F-2.2 | Photo and video posting | Implemented / Partial | Up to ten images or one video, captions, client/server validation, upload rollback; video duration is client-checked only. |
| F-2.3 | Post viewing and media carousel | Implemented | Post detail, full comments, multi-image navigation, and supported video playback. |
| F-2.4 | Post deletion | Implemented | Authors and administrators can delete posts and associated media. |

## Epic 3: Conversation and Appreciation

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-3.1 | Likes | Implemented | Like/unlike with per-post count and composite uniqueness. |
| F-3.2 | Comments | Implemented / Partial | Add and display comments; no comment editing or author-driven deletion. |
| F-3.3 | Mentions | Implemented | Username suggestions and case-insensitive `@username` mention notifications. |

## Epic 4: Direct Sharing Between Family Members

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-4.1 | Forward a post | Implemented | Send a post to another member with optional message; self-sharing is blocked. |
| F-4.2 | Shared inbox | Implemented | Received shares, unread state, unread badge, and mark-all-read action. |

## Epic 5: Notifications and Attention Management

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-5.1 | In-app notifications | Implemented | New-post and mention notifications, unread-first listing, and mark-all-read. |
| F-5.2 | Per-member notification muting | Implemented | Mute ordinary post notifications from a member; mentions bypass mute. |
| F-5.3 | Device push notifications | Implemented / Partial | Per-device opt-in/out, VAPID delivery, stale-subscription cleanup, and admin test push. |

## Epic 6: Member Discovery and Navigation

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-6.1 | Member search | Implemented / Partial | Client-side username-prefix search over the loaded member list; no large-directory pagination. |
| F-6.2 | Cross-feature navigation | Implemented | Links from profiles, search, shares, notifications, feed, and post detail. |

## Epic 7: Administration and Community Operations

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-7.1 | Admin dashboard | Implemented / Partial | Users, activity counts, recent posts, invites, storage metadata, and push subscriptions; broad queries are not paginated. |
| F-7.2 | Member account administration | Implemented | Admin password reset, admin/member role changes, and cascading user deletion with safety guards. |
| F-7.3 | Administrative content moderation | Implemented / Partial | Admin post deletion exists; no member reporting, moderation queue, or audit log. |

## Epic 8: Installable and Share-Enabled App Experience

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-8.1 | Installable progressive web app | Implemented / Partial | Manifest, icons, service-worker registration, and push handling; offline content caching is limited. |
| F-8.2 | Operating-system share target | Implemented | Authenticated multipart share-target ingestion with upload validation and redirect to the post. |

## Epic 9: Private Media Storage

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-9.1 | Storage provider abstraction | Implemented | Local disk and S3-compatible drivers with common save/get/metadata/remove behavior. |
| F-9.2 | Authenticated media delivery | Implemented | Session-protected media route with safe key validation and cache headers. |
| F-9.3 | Storage cleanup and recovery | Specified / Not implemented | Manual admin preview, quarantine for 30 days, restore, permanent-deletion lifecycle, and auditability are specified in `specs/001-storage-cleanup/spec.md`. |

## Epic 10: Reliability, Safety, and Operational Readiness

| ID | Feature | Status | Current scope |
|---|---|---|---|
| F-10.1 | Safe failure and consistency | Partial | Upload rollback, storage errors, missing-reference handling, and destructive-operation guards exist; centralized reconciliation and audit are absent. |
| F-10.2 | Deployment configuration | Implemented / Partial | Environment documentation, migrations, seed, and admin bootstrap exist; startup validation and health checks are absent. |

## Cross-Cutting Requirements Implied by These Features

- Rate limiting is needed for authentication, registration, uploads, comments, and public push
  receipt traffic.
- Server-side video duration validation is needed if the duration limit is a hard product rule.
- Admin actions and destructive changes need audit records.
- Media retention, backup/export, quotas, and capacity alerts need explicit policy.
- Account recovery, email verification, deactivation, and last-admin emergency recovery need
  product decisions.
- Push delivery needs durable observability, retry expectations, and a policy for stale devices.
- Accessibility, browser support, localization, and timezone conventions need acceptance criteria.
