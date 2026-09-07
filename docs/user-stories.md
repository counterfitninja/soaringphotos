# Famstagram User Stories and Acceptance Criteria

**Review date**: 2026-09-07
**Source**: Current repository behavior and `docs/features.md`

Acceptance criteria describe observable behavior. `Implemented` stories reflect current behavior;
`Specified` stories are defined in the storage-cleanup specification but are not yet implemented.

## Epic 1: Family Identity and Access

### F-1.1 Invite-only membership

**US-1.1.1** As an administrator, I want to create a single-use invite link so only approved
family members can register.

- **Given** I am an administrator, **when** I create an invite, **then** the system creates a
  unique link with a seven-day expiry.
- **Given** an invite has been used or expired, **when** someone opens it, **then** registration
  is rejected.

**US-1.1.2** As an administrator, I want to view invite status and delete unused invites so I can
manage membership access.

- **Given** invites exist, **when** I open invite management, **then** active, used, and expired
  status is shown.
- **Given** an invite is unused, **when** I delete it, **then** it can no longer be redeemed.

**US-1.1.3** As an invited family member, I want to register through my invite so I can join the
family space.

- **Given** a valid invite, **when** I submit a valid username, email, and password, **then** my
  account is created and I can sign in.
- **Given** the username or email is already used, **when** I submit registration, **then** the
  account is not created and a validation error is shown.

### F-1.2 Password authentication and sessions

**US-1.2.1** As a family member, I want to sign in with my username or email and password so I can
access private content.

- **Given** valid credentials, **when** I submit login, **then** an authenticated session is created.
- **Given** invalid credentials, **when** I submit login, **then** access is denied without exposing
  whether the username or email exists.

**US-1.2.2** As a family member, I want my session to persist so I do not sign in repeatedly.

- **Given** a valid session, **when** I navigate between authenticated pages, **then** I remain
  signed in.
- **Given** no valid session, **when** I request an authenticated page, **then** I am sent to login.

**US-1.2.3** As a family member, I want to sign out so shared devices no longer have access.

- **Given** I am signed in, **when** I sign out, **then** the session is invalidated and authenticated
  pages require login again.

### F-1.3 Passkey authentication

**US-1.3.1** As a family member, I want to register a passkey so I can use a supported device
credential.

- **Given** I am signed in and my device supports WebAuthn, **when** I complete registration,
  **then** the credential is stored for my account.
- **Given** registration verification fails, **when** I submit the credential, **then** no usable
  credential is stored.

**US-1.3.2** As a family member, I want to sign in with my passkey so access is fast and secure.

- **Given** a registered passkey, **when** I complete a valid assertion, **then** an authenticated
  session is created.
- **Given** the assertion is invalid or replayed, **when** I submit it, **then** login is rejected.

### F-1.4 Profile identity

**US-1.4.1** As a family member, I want to view a member profile so I can recognize their activity.

- **Given** a member exists, **when** I open their profile, **then** username, join date, post count,
  avatar or initials, and posts are shown.
- **Given** the username does not exist, **when** I open the profile, **then** a not-found result is
  shown.

**US-1.4.2** As a family member, I want to upload a profile photo so my account has a visual identity.

- **Given** I select a supported image within the size limit, **when** I submit it, **then** it is
  shown on my profile.
- **Given** the image is invalid, **when** I submit it, **then** the existing profile photo remains.

## Epic 2: Family Media Publishing

### F-2.1 Family feed

**US-2.1.1** As a family member, I want to see family posts newest first so I can catch up.

- **Given** posts exist, **when** I open the feed, **then** posts are ordered newest first.
- **Given** I am not authenticated, **when** I open the feed, **then** I cannot view family posts.

**US-2.1.2** As a family member, I want posts to load in pages so browsing remains usable.

- **Given** more posts exist than one page, **when** I request another page, **then** the next set
  is shown without duplicating the prior page.

### F-2.2 Photo and video posting

**US-2.2.1** As a family member, I want to publish photos or one short video with a caption.

- **Given** I select one to ten supported images or one supported video, **when** I submit a valid
  caption and upload, **then** a post is created with the media and caption.
- **Given** I select more than ten images or mix image and video media, **when** I submit, **then**
  validation rejects the upload.

**US-2.2.2** As a family member, I want invalid media and captions identified before upload.

- **Given** a file exceeds its type, size, count, or duration rule, **when** I select it, **then** a
  validation message identifies the invalid input.
- **Given** a caption exceeds its limit, **when** I submit, **then** the post is not created.

**US-2.2.3** As a family member, I want a failed upload to leave no incomplete post.

- **Given** media storage fails during creation, **when** the upload finishes unsuccessfully, **then**
  the incomplete post record is rolled back and the failure is reported.

### F-2.3 Post viewing and media carousel

**US-2.3.1** As a family member, I want to open a post and read its full discussion.

- **Given** a post exists, **when** I open its detail page, **then** its media, caption, author,
  reactions, and all comments are shown.

**US-2.3.2** As a family member, I want to browse all images in a multi-image post.

- **Given** a post has multiple images, **when** I navigate the carousel, **then** each image can be
  viewed without leaving the post.

**US-2.3.3** As a family member, I want to play supported short videos.

- **Given** a post contains a supported video, **when** I open it, **then** the video player can load
  the authenticated media.

### F-2.4 Post deletion

**US-2.4.1** As a post author, I want to delete my post.

- **Given** I authored a post, **when** I confirm deletion, **then** the post is no longer visible and
  its associated media is removed.
- **Given** I did not author the post, **when** I attempt author deletion, **then** the action is
  rejected.

**US-2.4.2** As an administrator, I want to delete any post.

- **Given** I am an administrator, **when** I delete a post, **then** it is removed regardless of
  author.
- **Given** I am a member, **when** I attempt administrative deletion, **then** the action is
  rejected.

## Epic 3: Conversation and Appreciation

### F-3.1 Likes

**US-3.1.1** As a family member, I want to like and unlike a post.

- **Given** I have not liked a post, **when** I select like, **then** my like is stored and the count
  increases once.
- **Given** I have liked a post, **when** I select like again, **then** my like is removed and the
  count decreases once.

**US-3.1.2** As a family member, I want to see the like count.

- **Given** a post has likes, **when** it is displayed, **then** the current count is shown.
- **Given** multiple requests attempt the same user's like, **then** the data remains unique per user
  and post.

### F-3.2 Comments

**US-3.2.1** As a family member, I want to comment on a post.

- **Given** my comment is between one and 500 characters, **when** I submit it, **then** it is stored
  with my identity and timestamp.
- **Given** my comment is empty or too long, **when** I submit it, **then** validation rejects it.

**US-3.2.2** As a family member, I want to read comments at the right depth.

- **Given** I view the feed, **then** recent comments are shown.
- **Given** I view post detail, **then** all comments are shown in chronological context.

### F-3.3 Mentions

**US-3.3.1** As a family member, I want username suggestions while typing a mention.

- **Given** I type a valid mention prefix, **when** suggestions are requested, **then** matching
  family usernames are returned.
- **Given** no members match, **then** no unrelated users are suggested.

**US-3.3.2** As a family member, I want to mention another member.

- **Given** a comment or caption contains a valid existing username mention, **when** it is saved,
  **then** the mentioned member receives a mention notification.
- **Given** the mentioned member muted ordinary post notifications, **then** the mention still
  notifies them.

## Epic 4: Direct Sharing Between Family Members

### F-4.1 Forward a post

**US-4.1.1** As a family member, I want to forward a post with an optional message.

- **Given** the post and recipient exist, **when** I submit a share, **then** the recipient receives
  the post reference and message.
- **Given** the message exceeds its limit, **then** it is constrained according to the server rule.

**US-4.1.2** As a family member, I want self-sharing prevented.

- **Given** I select myself as recipient, **when** I submit the share, **then** the share is rejected.

### F-4.2 Shared inbox

**US-4.2.1** As a family member, I want to see posts shared with me.

- **Given** shares exist, **when** I open the shared inbox, **then** received shares are listed newest
  first with sender and post context.

**US-4.2.2** As a family member, I want unread shares indicated and clearable.

- **Given** unread shares exist, **then** the navigation badge shows the unread count.
- **When** I mark shares as read, **then** the badge and share state update accordingly.

## Epic 5: Notifications and Attention Management

### F-5.1 In-app notifications

**US-5.1.1** As a family member, I want notifications for new posts and mentions.

- **Given** another member publishes, **then** eligible members receive a post notification.
- **Given** I am mentioned, **then** I receive a mention notification linked to the relevant post.

**US-5.1.2** As a family member, I want to mark notifications as read.

- **Given** unread notifications exist, **when** I mark all as read, **then** the unread state is cleared.

### F-5.2 Per-member notification muting

**US-5.2.1** As a family member, I want to mute ordinary posts from a member.

- **Given** I mute a member, **when** that member publishes, **then** I do not receive an ordinary
  post notification.
- **Given** the member mentions me, **then** I still receive the mention notification.

### F-5.3 Device push notifications

**US-5.3.1** As a family member, I want to opt into push notifications on a device.

- **Given** push is supported and configured, **when** I subscribe, **then** the device subscription
  is stored for my account.
- **Given** push is disabled or unavailable, **then** the UI reports that state without breaking the
  rest of the app.

**US-5.3.2** As a family member, I want to opt out on one device.

- **Given** multiple devices are subscribed, **when** I remove one subscription, **then** other device
  subscriptions remain.

**US-5.3.3** As an administrator, I want to send a test push.

- **Given** I am an administrator and a target has a subscription, **when** I send a test, **then** a
  test notification is attempted.
- **Given** a subscription is stale, **then** the system removes the stale subscription after the
  provider rejects it with a known stale status.

## Epic 6: Member Discovery and Navigation

### F-6.1 Member search

**US-6.1.1** As a family member, I want to search by username prefix.

- **Given** members exist, **when** I enter a username prefix, **then** matching members are shown.
- **Given** no members match, **then** an empty result is shown without an error.

**US-6.1.2** As a family member, I want post counts in search results.

- **Given** a member appears in results, **then** their post count is shown.

### F-6.2 Cross-feature navigation

**US-6.2.1** As a family member, I want related content to link together.

- **Given** I open a notification, share, profile, or search result, **when** I select its link,
  **then** I reach the relevant post or profile.

## Epic 7: Administration and Community Operations

### F-7.1 Admin dashboard

**US-7.1.1** As an administrator, I want operational visibility.

- **Given** I am an administrator, **when** I open the dashboard, **then** I can see members,
  activity counts, recent posts, invite status, storage information, and push subscriptions.
- **Given** I am a member, **when** I request the dashboard, **then** access is denied.

### F-7.2 Member account administration

**US-7.2.1** As an administrator, I want to reset a member password.

- **Given** a target member exists, **when** I submit a valid replacement password, **then** the
  member can use it to sign in.
- **Given** the replacement is invalid, **then** the password remains unchanged.

**US-7.2.2** As an administrator, I want to manage admin roles.

- **Given** I am an administrator, **when** I promote or demote another member, **then** the role is
  updated.
- **Given** the change would remove the last administrator or demote myself, **then** it is rejected.

**US-7.2.3** As an administrator, I want to delete a member and associated content.

- **Given** I delete a member, **then** their posts, media, comments, shares, notifications, invites,
  and subscriptions are removed according to the deletion policy.
- **Given** I attempt to delete myself or the last administrator, **then** the action is rejected.

### F-7.3 Administrative content moderation

**US-7.3.1** As an administrator, I want to delete any post.

- **Given** a post exists, **when** I perform administrative deletion, **then** the post is no longer
  visible and associated media cleanup is attempted.

**US-7.3.2** As an administrator, I want destructive actions to preserve invariants.

- **Given** an action would violate authorization or last-admin protection, **then** it is rejected
  without partial account-role corruption.

## Epic 8: Installable and Share-Enabled App Experience

### F-8.1 Installable progressive web app

**US-8.1.1** As a family member, I want to install Famstagram as a standalone app.

- **Given** a supported browser receives the manifest and service worker over an eligible origin,
  **then** the app exposes installability.
- **Given** the browser does not support installation, **then** normal web use remains available.

**US-8.1.2** As a family member, I want push handling when the browser is closed.

- **Given** I have a valid subscription and supported service worker, **when** a push arrives,
  **then** a notification is displayed with its destination link.

### F-8.2 Operating-system share target

**US-8.2.1** As a family member, I want to share media from another app into Famstagram.

- **Given** I am authenticated and the browser supports Web Share Target, **when** I share valid
  media to Famstagram, **then** a post is created and I am redirected to it.
- **Given** I am not authenticated, **then** the share is not accepted as an anonymous post.

**US-8.2.2** As a family member, I want share-target uploads to use normal safety rules.

- **Given** shared media violates upload validation, **then** no post is created and an actionable
  error is returned.

## Epic 9: Private Media Storage

### F-9.1 Storage provider abstraction

**US-9.1.1** As an operator, I want to choose local disk or S3-compatible storage.

- **Given** a supported storage configuration, **when** media is saved and read, **then** the same
  application workflow works through that configured provider.
- **Given** the provider fails, **then** the application reports the failure without creating a
  misleading completed post.

### F-9.2 Authenticated media delivery

**US-9.2.1** As a family member, I want private media to load for authenticated users.

- **Given** I am authenticated and the media key exists, **when** I request it, **then** the media
  is returned with its stored content type.
- **Given** I am unauthenticated or the key is invalid, **then** access is denied.

### F-9.3 Storage cleanup and recovery (Specified)

**US-9.3.1** As an administrator, I want to review storage usage and cleanup candidates.

- **Given** stored media exists, **when** I open maintenance, **then** total usage, file count, and
  reclaimable size are shown.
- **Given** no candidates exist, **then** the system clearly reports that state.

**US-9.3.2** As an administrator, I want to preview and manually confirm cleanup.

- **Given** candidates exist, **when** I preview cleanup, **then** each candidate has size, reason,
  and reclaimable total, with no deletion or quarantine yet.
- **Given** I confirm the preview, **then** execution re-checks authorization, references, and
  eligibility before acting.
- **Given** a file is referenced by an active post, **then** it remains protected.

**US-9.3.3** As an administrator, I want eligible files quarantined for 30 days.

- **Given** cleanup is confirmed, **then** eligible files move to recoverable quarantine rather than
  being permanently deleted immediately.
- **Given** a file is quarantined, **then** it is not served as active media and its original
  restoration information is retained.

**US-9.3.4** As an administrator, I want to restore a quarantined file.

- **Given** the original post still exists and the file is within 30 days, **when** I restore it,
  **then** it returns to active authenticated media access.
- **Given** restoration fails or the original post is gone, **then** the item remains quarantined and
  the failure is reported.

**US-9.3.5** As an administrator, I want cleanup operations to be explainable and repeatable.

- **Given** a cleanup runs, **then** removed/quarantined, skipped, and failed items have counts and
  reasons.
- **Given** two administrators start overlapping cleanup, **then** the same candidate is not acted on
  twice.

## Epic 10: Reliability, Safety, and Operational Readiness

### F-10.1 Safe failure and consistency

**US-10.1.1** As an operator, I want failed media operations to report partial work.

- **Given** a storage provider fails during a multi-file operation, **then** processed and unprocessed
  items are distinguishable and retryable.

**US-10.1.2** As an operator, I want storage inconsistencies surfaced.

- **Given** a database reference points to missing media, **then** the inconsistency is reported and
  content is not silently deleted or rewritten.

**US-10.1.3** As an administrator, I want concurrent destructive operations protected.

- **Given** overlapping cleanup or deletion requests target the same item, **then** only one operation
  can act and the other receives a safe result.

### F-10.2 Deployment configuration

**US-10.2.1** As an operator, I want required environment settings documented and validated.

- **Given** required authentication, database, storage, WebAuthn, or push configuration is missing,
  **then** startup or the affected capability reports a clear configuration error.

**US-10.2.2** As an operator, I want repeatable database setup.

- **Given** a new environment, **when** I run the documented migration and seed process, **then** the
  database schema and initial administrator are created consistently.

## Requirements Requiring Separate Product Decisions

These acceptance areas are implied by the repository but are not fully implemented or specified:

- Self-service password recovery, email verification, rate limiting, CSRF policy, and audit logs.
- Server-side video duration validation, image/video optimization, media quotas, backups, and
  permanent post/media retention policy.
- Comment editing/deletion, post editing, moderation reports, member suspension, and account export.
- Notification retention, like/reply/share notification semantics, share revocation, and download
  policy.
- Admin dashboard scale limits, health checks, centralized error monitoring, retries, and recovery
  from loss of all administrator access.
- Accessibility, localization, timezone, and supported browser/OS matrices.
