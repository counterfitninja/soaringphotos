# Famstagram Business Capability Map

**Review date**: 2026-09-07
**Scope**: Repository implementation, routes, actions, APIs, components, Prisma schema,
validation, storage, notifications, PWA behavior, and existing tests.

This document describes the capabilities currently represented by the codebase. User stories
are written as outcome-oriented slices for future planning. Items in **Missing requirements**
are not implemented; they are requirements implied by current behavior, operational risk, or
explicit product boundaries that should be made deliberate before expanding the product.

## Epic 1: Family Identity and Access

### Feature 1.1: Invite-only membership
- As an administrator, I want to create single-use invite links so only approved family members
  can register.
- As an administrator, I want to see invite status and remove unused invites so membership
  access remains manageable.
- As an invited family member, I want to register through my invite before it expires so I can
  join the family space.

### Feature 1.2: Password authentication and sessions
- As a family member, I want to sign in with my username or email and password so I can access
  private family content.
- As a family member, I want my authenticated session to persist so I do not sign in repeatedly.
- As a family member, I want to sign out so shared devices no longer have access to my account.

### Feature 1.3: Passkey authentication
- As a family member, I want to register a passkey so I can sign in with Face ID, Touch ID, or
  Windows Hello.
- As a family member, I want to sign in with my passkey so access is fast and secure.

### Feature 1.4: Profile identity
- As a family member, I want to view a member profile with username, join date, post count, and
  posts so I can recognize their contribution to the family archive.
- As a family member, I want to upload a profile photo so my account has a visual identity.

## Epic 2: Family Media Publishing

### Feature 2.1: Family feed
- As a family member, I want to see family posts newest first so I can catch up on recent moments.
- As a family member, I want posts to load in pages so browsing remains usable as the archive grows.

### Feature 2.2: Photo and video posting
- As a family member, I want to publish up to ten images or one short video with a caption so I
  can share moments in the formats I use.
- As a family member, I want invalid file types, sizes, counts, durations, and captions identified
  before upload so I do not waste time on a doomed transfer.
- As a family member, I want a failed upload to leave no incomplete post behind so the feed stays
  trustworthy.

### Feature 2.3: Post viewing and media carousel
- As a family member, I want to open a post and read its full discussion so I can follow the
  conversation.
- As a family member, I want to browse all images in a multi-image post so no shared image is
  hidden.
- As a family member, I want to play supported short videos from the post so video sharing is
  useful.

### Feature 2.4: Post deletion
- As a post author, I want to delete my post so I can remove content I no longer want to share.
- As an administrator, I want to remove any post so I can protect the family space.

## Epic 3: Conversation and Appreciation

### Feature 3.1: Likes
- As a family member, I want to like a post so I can show appreciation without writing a comment.
- As a family member, I want to unlike a post so I can correct my reaction.
- As a family member, I want to see the like count so I can understand engagement.

### Feature 3.2: Comments
- As a family member, I want to comment on a post so I can participate in the conversation.
- As a family member, I want to read recent comments in the feed and all comments on the detail
  page so I can follow discussions at the right depth.

### Feature 3.3: Mentions
- As a family member, I want username suggestions while typing a mention so I can address the
  right person.
- As a family member, I want to mention another family member so they receive a direct alert.

## Epic 4: Direct Sharing Between Family Members

### Feature 4.1: Forward a post
- As a family member, I want to send a post to another family member with an optional message so
  I can draw their attention to a particular moment.
- As a family member, I want the system to prevent sending a post to myself so sharing remains
  meaningful.

### Feature 4.2: Shared inbox
- As a family member, I want to see posts shared with me newest first so I can find direct forwards.
- As a family member, I want unread shares clearly indicated so I know what needs attention.
- As a family member, I want to mark shares as read so I can clear the inbox indicator.

## Epic 5: Notifications and Attention Management

### Feature 5.1: In-app notifications
- As a family member, I want to be notified when another member publishes so I can return to the
  family feed.
- As a family member, I want to be notified when I am mentioned so direct requests are not missed.
- As a family member, I want to mark notifications as read so the unread indicator stays useful.

### Feature 5.2: Per-member notification muting
- As a family member, I want to mute ordinary post notifications from a member so I can control
  notification volume.
- As a family member, I want mentions to continue through a mute so direct communication is not
  lost.

### Feature 5.3: Device push notifications
- As a family member, I want to opt into push notifications on a device so I can receive alerts
  while the app is closed.
- As a family member, I want to opt out on one device without affecting another device.
- As an administrator, I want to send a test push so I can verify deployment configuration.

## Epic 6: Member Discovery and Navigation

### Feature 6.1: Member search
- As a family member, I want to search by username prefix so I can find another member quickly.
- As a family member, I want search results to show post counts so I can understand who I found.

### Feature 6.2: Cross-feature navigation
- As a family member, I want profiles, notifications, shared posts, and search results to link to
  the relevant post or member so I can move through the archive without losing context.

## Epic 7: Administration and Community Operations

### Feature 7.1: Admin dashboard
- As an administrator, I want to see members, activity counts, recent posts, invites, storage
  information, and push subscriptions so I can operate the family service.

### Feature 7.2: Member account administration
- As an administrator, I want to reset a member password so I can restore access after lockout.
- As an administrator, I want to promote or demote administrators so responsibility can be shared.
- As an administrator, I want to delete a member and their associated content so I can remove an
  account completely when required.

### Feature 7.3: Administrative content moderation
- As an administrator, I want to delete any post so I can remove content that violates family
  expectations.
- As an administrator, I want destructive actions to preserve system invariants, including at
  least one remaining administrator.

## Epic 8: Installable and Share-Enabled App Experience

### Feature 8.1: Installable progressive web app
- As a family member, I want to install Famstagram on a supported device so it feels like a
  standalone family app.
- As a family member, I want push handling to work when the browser is not open so notifications
  remain useful.

### Feature 8.2: Operating-system share target
- As a family member, I want to send photos or videos from another app into Famstagram so I can
  publish without manually downloading and re-uploading media.
- As a family member, I want shared media to use the same validation and private-access rules as
  normal uploads so the shortcut does not weaken safety.

## Epic 9: Private Media Storage

### Feature 9.1: Storage provider abstraction
- As an operator, I want to choose local disk or S3-compatible storage so deployment and capacity
  choices can evolve without changing user workflows.
- As an operator, I want local deployments to avoid loading cloud-only dependencies unnecessarily
  so the default setup stays lightweight.

### Feature 9.2: Authenticated media delivery
- As a family member, I want private media to load for authenticated users so family content is
  usable without making uploads public.
- As an operator, I want media keys validated before lookup so path traversal cannot escape the
  storage boundary.

### Feature 9.3: Storage cleanup and recovery
- As an administrator, I want to inspect total and reclaimable storage so I can plan maintenance.
- As an administrator, I want to preview eligible files before cleanup so I can verify the scope.
- As an administrator, I want cleanup to require manual confirmation and protect active post media
  so the archive is not damaged by unattended deletion.
- As an administrator, I want eligible files moved to recoverable quarantine for 30 days so an
  accidental cleanup can be reversed.
- As an administrator, I want to restore a quarantined file to its original post so recovery is
  practical.
- As an administrator, I want cleanup results and exceptions recorded so repeated maintenance is
  understandable and auditable.

## Epic 10: Reliability, Safety, and Operational Readiness

### Feature 10.1: Safe failure and consistency
- As an operator, I want failed media operations to report partial work clearly so I can retry
  without guessing what happened.
- As an operator, I want missing references and storage inconsistencies surfaced so data repair is
  deliberate rather than silent.
- As an administrator, I want concurrent destructive operations prevented from acting on the same
  item twice.

### Feature 10.2: Deployment configuration
- As an operator, I want required environment settings documented and validated so authentication,
  storage, WebAuthn, and push features fail predictably.
- As an operator, I want database migration and seed procedures documented so a new environment can
  be brought up consistently.

## Missing Requirements Implied by the Implementation

These are the highest-value requirements that the implementation or documented behavior implies,
but that are absent, incomplete, or not yet formalized as product requirements.

### Security and account recovery

- The system needs a documented account-recovery policy. Password resets are administrator-only;
  there is no self-service reset or verified-email recovery flow.
- The system needs rate limits or abuse controls for login, registration, invite redemption,
  uploads, comments, search, and push endpoints.
- The system needs an explicit CSRF and same-site request policy for state-changing actions and
  public route exceptions.
- The system needs a documented session-secret requirement and startup validation, rather than
  relying only on deployment notes.
- The system needs a policy for email verification, or an explicit decision that stored email is
  not verified and is not used for recovery.
- The system needs audit records for administrator password resets, role changes, user deletion,
  post deletion, invite actions, push tests, and storage cleanup.
- The system needs a moderation/reporting policy if family members must be able to flag content;
  currently only administrators can remove it.

### Media integrity and lifecycle

- Server-side video duration validation is needed if the 60-second limit is a hard requirement;
  the current duration check is client-side.
- The product needs an explicit policy for post editing, comment editing, and comment deletion;
  current content is effectively immutable except through post or account deletion.
- The product needs an image optimization and video compatibility policy if storage growth and
  cross-device playback are important; original media is currently retained.
- The storage cleanup policy needs a permanent-deletion mechanism after the 30-day quarantine,
  including authorization, audit records, failure handling, and whether deletion is manual or
  scheduled.
- The product needs a backup/export and disaster-recovery requirement. Quarantine is not a backup.
- The product needs retention rules for orphaned media, deleted-user media, deleted-post media,
  profile photos, notifications, and push subscriptions.
- The product needs a storage quota or capacity-alert policy to prevent the service from filling
  the underlying disk or bucket.

### Notification behavior

- The product needs explicit notification retention and cleanup rules; notifications currently
  have no stated expiry.
- The product needs to define whether likes, replies, shares, and activity on previously commented
  posts generate notifications; current behavior only covers posts and mentions.
- The product needs stale push-subscription observability and retry expectations, including how an
  operator knows delivery is failing beyond per-request logs.
- The public push-receipt endpoint needs a documented threat model, payload limits, and abuse
  protection because it intentionally bypasses normal session gating.

### Sharing and privacy

- The product needs a policy for share lifetime, revocation, and behavior after the sender's post
  or recipient's account is deleted.
- The product needs a policy for whether recipients can download, reshare, or otherwise retain
  media outside the application.
- The product needs explicit semantics for marking a shared post read: opening it, opening the
  inbox, or using a dedicated action.

### Administration and scale

- The admin dashboard needs pagination or bounded loading requirements for users, posts, invites,
  subscriptions, and storage records as the family grows.
- The system needs an explicit maximum supported family size and media inventory size; current
  client-side search and broad admin queries assume a small installation.
- The product needs a deactivation/suspension policy distinct from irreversible account deletion.
- The product needs a policy for the last administrator and emergency recovery if all admin access
  is lost.
- The product needs a health-check and error-monitoring requirement for deployment operations.
- The product needs a retry and reconciliation policy for failed push sends and interrupted media
  cleanup.

### Accessibility and experience

- The product needs accessibility acceptance criteria for labels, keyboard navigation, focus
  management, media controls, and destructive-action confirmation.
- The product needs localization and timezone conventions if the family is multilingual or spread
  across regions.
- The product needs browser and operating-system support boundaries for passkeys, push, PWA install,
  and Web Share Target because those capabilities vary significantly by platform.

## Current Implementation Boundary

The repository currently implements a private family-sharing MVP. The strongest next planning
candidates are:

1. Storage cleanup and recovery, already specified in `specs/001-storage-cleanup/spec.md`.
2. Security hardening: rate limiting, startup configuration validation, audit logging, and
   account-recovery policy.
3. Media lifecycle: server-side video validation, optimization, quotas, retention, and backup.
4. Operational readiness: health checks, error monitoring, bounded admin queries, and push/media
   reconciliation.
