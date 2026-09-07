# Famstagram Epics

**Review date**: 2026-09-07
**Source**: Repository implementation and `docs/business-capability-map.md`

These epics group the major business capabilities currently represented in Famstagram.

## Epic 1: Family Identity and Access

**Outcome**: Control membership and provide secure access to private family content.

**Primary actors**: Administrator, invited family member, registered family member.

**Business boundary**: Invite-only registration, password sessions, passkeys, and member profile
identity. Self-service password recovery and email verification are not currently implemented.

## Epic 2: Family Media Publishing

**Outcome**: Let family members publish and browse private photo and video memories.

**Primary actors**: Family member, post author, administrator.

**Business boundary**: Feed browsing, constrained photo/video uploads, post details, carousels,
and post deletion. Post editing and drafts are not currently implemented.

## Epic 3: Conversation and Appreciation

**Outcome**: Let family members react to and discuss shared memories.

**Primary actors**: Family member, mentioned family member.

**Business boundary**: Likes, comments, mention suggestions, and mention notifications. Comment
editing and author-driven comment deletion are not currently implemented.

## Epic 4: Direct Sharing Between Family Members

**Outcome**: Let one family member intentionally draw another member's attention to a post.

**Primary actors**: Sending family member, receiving family member.

**Business boundary**: Direct forwarding, optional message, unread shared inbox, and read state.
Share expiry, revocation, and external/public sharing are not currently implemented.

## Epic 5: Notifications and Attention Management

**Outcome**: Keep members aware of relevant activity without forcing them to monitor the feed.

**Primary actors**: Family member, administrator, notification service operator.

**Business boundary**: In-app notifications, per-member post muting, mention bypass, device push
subscriptions, and admin test delivery. Email notifications and notification expiry are not
currently implemented.

## Epic 6: Member Discovery and Navigation

**Outcome**: Help family members find people and move between related content.

**Primary actors**: Family member.

**Business boundary**: Username-prefix search, profile discovery, and links between feed,
profiles, notifications, shares, and posts. Caption search, hashtags, and recommendations are
not currently implemented.

## Epic 7: Administration and Community Operations

**Outcome**: Give administrators the controls needed to operate membership, content, and service
configuration.

**Primary actors**: Administrator.

**Business boundary**: Dashboard visibility, password reset, role management, user deletion,
post deletion, invite management, push diagnostics, and operational statistics. Fine-grained
moderator roles and member reporting are not currently implemented.

## Epic 8: Installable and Share-Enabled App Experience

**Outcome**: Make Famstagram convenient on supported devices and interoperable with the operating
system share sheet.

**Primary actors**: Family member, supported browser/operating system.

**Business boundary**: Web app manifest, service worker, push handling, installability, and Web
Share Target ingestion. Browser-specific support varies and must be documented.

## Epic 9: Private Media Storage

**Outcome**: Store and deliver family media privately while allowing deployment-specific storage
choices and controlled capacity management.

**Primary actors**: Family member, administrator, operator.

**Business boundary**: Local or S3-compatible storage, authenticated media delivery, validation,
and the specified manual cleanup/quarantine workflow. Backup, quotas, optimization, and complete
retention lifecycle are not yet implemented.

## Epic 10: Reliability, Safety, and Operational Readiness

**Outcome**: Keep destructive operations, deployment configuration, and failure handling
predictable as usage grows.

**Primary actors**: Operator, administrator.

**Business boundary**: Safe failure reporting, consistency checks, concurrency protection,
environment configuration, migrations, and seeding. Health checks, centralized error monitoring,
rate limiting, and formal disaster recovery are not yet implemented.

## Cross-Epic Business Rules

- Famstagram is private and invite-only; media is not served from public upload paths.
- Authenticated members can see family content according to the current shared-family model.
- Administrators retain elevated controls but the system must preserve at least one administrator.
- User-controlled values and media must respect the shared validation rules at server boundaries.
- Destructive operations must protect referenced content and report failures rather than silently
  discarding state.
