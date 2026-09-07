<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles: none
- Added principles: VI. Responsive PWA and Layout Integrity
- Added sections: none
- Removed sections: none
- Follow-up TODOs: confirm the original ratification date
-->

# Famstagram Constitution

## Core Principles

### I. Private-by-Default Family Sharing
Famstagram MUST remain invite-only. Authenticated route groups and mutation handlers MUST
enforce session authorization, and media MUST be served through authenticated application
routes rather than public upload paths. User data, posts, comments, likes, shares, and
notifications MUST be scoped to the family membership model. This protects the app's
central promise: private family sharing rather than an open social network.

### II. Validated Media and Input Boundaries
Every user-controlled value MUST be validated at the boundary where it enters the system,
using the shared validation rules where client and server behavior must agree. Uploads MUST
enforce declared file types, size and duration limits, caption limits, and storage-driver
contracts on the server; client checks are an accessibility and usability aid, not a security
boundary. This keeps large media uploads predictable and prevents malformed data from
crossing application boundaries.

### III. Explicit Authentication and Sensitive Operations
Authentication and authorization decisions MUST be centralized in the existing session and
auth helpers and MUST be applied to every page, action, and API route that handles private
data or mutations. Passwords MUST use the established password-hashing mechanism, passkeys
MUST use the WebAuthn configuration, and invite tokens MUST be single-use and time-limited.
Security-sensitive changes MUST preserve safe failure behavior and avoid leaking credentials,
tokens, or private media.

### IV. Tested User-Critical Behavior
Changes MUST include focused automated tests for new or changed validation, authentication,
authorization, data contracts, and other behavior that can silently expose data or block
family workflows. Integration coverage MUST be added when a change crosses route handlers,
server actions, Prisma models, storage, push delivery, or browser APIs. The production build
and the narrowest relevant test command MUST pass before a change is considered complete.

### V. Simple, Observable, and Compatible Evolution
Implementations MUST use the existing Next.js App Router, server-action, route-handler,
Prisma, storage, and shared-UI patterns unless a documented constraint requires a change.
New complexity MUST have a concrete user or operational benefit. User-visible workflows and
operationally important failures MUST remain diagnosable through structured errors or logs,
without exposing private data. Backward-incompatible changes MUST include a migration or
rollout path and update the relevant documentation.

### VI. Responsive PWA and Layout Integrity
User-facing workflows MUST work on supported desktop and mobile viewport sizes through the
installable progressive web app experience. Layouts MUST remain usable across touch and
pointer input, respect device safe areas, and keep controls and content within their intended
containers. Before release, changed UI MUST be checked at representative desktop and mobile
sizes for clipping, unintended scrolling, text overflow, and overlapping controls or content.
This protects the family workflow from device-specific layout failures and keeps the PWA
experience reliable in both browser and installed contexts.

## Security and Privacy Constraints

The application MUST keep uploads outside `public/` and MUST serve media through the
authenticated media route. Secrets and environment-specific credentials MUST remain outside
source control. Public route exceptions MUST be deliberate, documented, and independently
authorized when a request cannot carry the normal session redirect flow. Changes to entity
names, session behavior, storage keys, notification delivery, or WebAuthn settings MUST
identify and verify their consumers before release.

## Development Workflow and Quality Gates

Work MUST begin from a written feature specification when behavior or data contracts change.
Implementation plans MUST identify affected routes, actions, models, storage boundaries, and
tests. Reviews MUST check constitution compliance, authorization coverage, input validation,
media privacy, migration safety, and documentation impact. A change MUST NOT be released when
the relevant tests or production build fail, unless the failure is explicitly documented as
an unrelated pre-existing issue and the release owner accepts the risk.

## Governance

This constitution is the governing quality and security standard for Famstagram and takes
precedence over informal conventions. Amendments MUST be made through the constitution
workflow, include a Sync Impact Report, preserve the required heading structure, and state
any deferred decisions as explicit TODOs. The amendment MUST explain its version bump and
update the Last Amended date.

The version follows semantic versioning: MAJOR for incompatible removals or redefinitions of
governance; MINOR for new principles or materially expanded requirements; PATCH for
clarifications and non-semantic wording changes. Every feature plan and review MUST include a
compliance check against the principles and quality gates. The project owner MUST review this
constitution at each major release and whenever authentication, privacy, storage, or
deployment architecture changes.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-09-07
