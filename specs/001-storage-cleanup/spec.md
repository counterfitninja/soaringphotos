# Feature Specification: Storage Cleanup Tools

**Feature Branch**: `001-storage-cleanup`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "add server side tools to reduce storage over time"

## Clarifications

### Session 2026-09-07

- Q: Should storage cleanup run only when an administrator starts it, or should it also support scheduled automatic runs? → A: Manual administrator-triggered cleanup only; every run requires preview and confirmation.
- Q: Should confirmed cleanup permanently delete eligible files, or place them in a recoverable quarantine first? → A: Move eligible files to a recoverable quarantine before permanent deletion.
- Q: How long should quarantined files remain recoverable before permanent deletion? → A: 30 days.
- Q: Should administrators be able to restore a quarantined file to its original post before the 30-day retention period ends? → A: Include administrator-initiated restoration to the original post.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Storage Usage (Priority: P1)

As an administrator, I want to see where storage is being used so that I can make informed
cleanup decisions without inspecting the server manually.

**Why this priority**: Visibility is required before deletion can be trusted and provides
immediate operational value even when no files are removed.

**Independent Test**: With representative stored media and records, an administrator can open
the maintenance view, see total usage and categorized candidates, and verify the displayed
counts and sizes against the known fixture data.

**Acceptance Scenarios**:

1. **Given** stored media exists, **When** an administrator opens storage maintenance,
   **Then** the system shows total usage, file counts, and the amount eligible for cleanup.
2. **Given** no media is eligible for cleanup, **When** the administrator reviews storage,
   **Then** the system clearly reports that no cleanup candidates are available.

---

### User Story 2 - Preview and Remove Eligible Files (Priority: P1)

As an administrator, I want to preview and remove files that are no longer needed so that
storage decreases without accidentally removing active family content.

**Why this priority**: Controlled cleanup is the primary user and operational outcome of the
feature.

**Independent Test**: Given a fixture containing eligible and protected files, an
administrator can generate a preview, confirm the candidate list, execute cleanup, and verify
that only eligible files are removed and linked family content remains available.

**Acceptance Scenarios**:

1. **Given** orphaned or explicitly eligible files exist, **When** the administrator requests
   a preview, **Then** the system lists each candidate with its size, reason, and total reclaimable
   space without deleting anything.
2. **Given** the administrator confirms a preview, **When** cleanup runs, **Then** only the
  listed eligible files are moved to quarantine and the result reports quarantined files,
  skipped files, and failures.
3. **Given** a file is still referenced by an active post, **When** cleanup evaluates it,
   **Then** the file is protected even if it is old or otherwise large.
4. **Given** a quarantined file remains within its retention period, **When** an administrator
  restores it, **Then** it returns to its original post and becomes available through normal
  authenticated viewing.

---

### User Story 3 - Operate Cleanup Safely Over Time (Priority: P2)

As an administrator, I want cleanup rules and results to be understandable and repeatable so
that I can start maintenance regularly without losing confidence in the family archive.

**Why this priority**: Repeatable operations prevent storage growth from returning while keeping
irreversible actions deliberate.

**Independent Test**: An administrator can run the same cleanup operation twice, inspect the
recorded outcomes, and verify that the second run does not remove already-cleaned or protected
content.

**Acceptance Scenarios**:

1. **Given** a cleanup operation is in progress, **When** the administrator requests its
   status, **Then** the system reports progress or completion and does not start a duplicate
   operation for the same scope.
2. **Given** cleanup completes with skipped or failed files, **When** the administrator views
   the result, **Then** each exception has a reason and can be investigated without guessing.
3. **Given** cleanup has already removed a candidate, **When** the same rules run again,
   **Then** the candidate is not reported as removable a second time.

### Edge Cases

- A file is missing from storage but its post record still references it; cleanup MUST report
  the inconsistency and MUST NOT delete the post or silently treat the record as repaired.
- A file becomes referenced after preview but before execution; execution MUST re-check eligibility
  and skip the file if it is no longer safe to remove.
- A cleanup run encounters a permission, availability, or storage-provider failure; the run MUST
  preserve the remaining candidates and report the failure separately.
- A very large candidate set exceeds one operation's practical limit; the system MUST process it
  in bounded batches and expose progress.
- Two administrators start cleanup at the same time; the system MUST prevent overlapping work
  from deleting the same file twice.
- A candidate has no reliable age or ownership metadata; the system MUST exclude it from automatic
  eligibility and identify it for manual investigation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST restrict storage maintenance tools to authorized administrators.
- **FR-002**: The system MUST report total stored media size, file count, and reclaimable size using
  values that can be reconciled with the stored media inventory.
- **FR-003**: The system MUST identify cleanup candidates by explicit, documented eligibility
  rules, including unreferenced files and any configured age threshold.
- **FR-004**: The system MUST protect every file referenced by an active post, regardless of age,
  size, or cleanup rule.
- **FR-005**: The system MUST provide a non-destructive preview before an administrator confirms
  a cleanup operation.
- **FR-006**: The preview MUST identify each candidate, its reason for eligibility, its size, and
  the total expected storage reduction.
- **FR-007**: The system MUST re-check authorization, references, and eligibility at execution
  time rather than relying only on the earlier preview.
- **FR-008**: The system MUST report per-operation counts for removed, skipped, and failed files,
  along with total reclaimed size and reasons for exceptions.
- **FR-009**: The system MUST process large cleanup sets in bounded work units and expose enough
  progress information for an administrator to determine whether the operation is active.
- **FR-010**: The system MUST prevent overlapping cleanup operations from acting on the same
  candidate more than once.
- **FR-011**: The system MUST record who initiated each cleanup operation, when it ran, which
  eligibility rules applied, and its outcome.
- **FR-012**: The system MUST never delete a post, comment, like, share, or user account as a
  side effect of storage cleanup.
- **FR-013**: The system MUST treat missing, ambiguous, or inconsistent metadata as a reported
  exception rather than silently deleting the associated content.
- **FR-014**: The system MUST provide a clear failure result when storage is unavailable and MUST
  leave unprocessed candidates available for a later run.
- **FR-015**: The system MUST document the default eligibility rules, protected content rules,
  and the recovery and permanent-deletion rules before the tool is used in production.
- **FR-016**: The system MUST require an authorized administrator to manually start each cleanup
  operation and MUST NOT delete files through an unattended scheduled run.
- **FR-017**: The system MUST move confirmed eligible files to a recoverable quarantine instead
  of permanently deleting them immediately.
- **FR-018**: Quarantined files MUST not be served as active media, and the system MUST retain
  enough information to identify the original file, cleanup operation, and restoration target.
- **FR-019**: The system MUST retain quarantined files for 30 days before they become eligible
  for permanent deletion.
- **FR-020**: The system MUST allow an authorized administrator to restore a quarantined file
  to its original post during the 30-day retention period after verifying that the post still
  exists and the file can be restored safely.
- **FR-021**: A restored file MUST be removed from quarantine, become available through normal
  authenticated media access, and retain an audit record of the restoration.

### Key Entities *(include if feature involves data)*

- **Storage Inventory Item**: A stored media file with its size, reference state, metadata, and
  cleanup eligibility.
- **Cleanup Preview**: A non-destructive snapshot of candidates, reasons, rule settings, and
  expected reclaimed size awaiting administrator confirmation.
- **Cleanup Operation**: An initiated execution with administrator, timestamps, progress,
  per-item results, and final outcome.
- **Cleanup Policy**: The documented rules that determine which inventory items are eligible or
  protected.
- **Quarantine Item**: A cleanup candidate moved out of active storage with its original
  reference information, quarantine timestamp, and restoration or permanent-deletion state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can determine total storage usage and reclaimable storage within
  60 seconds for an inventory of up to 10,000 media files.
- **SC-002**: 100% of cleanup executions provide a preview and re-check eligibility before removal.
- **SC-003**: 0 active post media files are removed by a successful cleanup operation in acceptance
  testing.
- **SC-004**: At least 95% of eligible files in a representative cleanup run are removed or given
  a specific, actionable skip or failure reason.
- **SC-005**: A cleanup operation can reclaim at least 90% of the size represented by its confirmed
  eligible candidates when the storage provider is available.
- **SC-006**: Administrators can explain why every removed, skipped, or failed candidate was handled
  that way using the operation result and audit record.
- **SC-007**: Repeating a completed cleanup with unchanged rules produces no duplicate deletions and
  does not reduce availability of protected family content.

## Assumptions

- The feature is intended for administrators and maintenance workflows, not ordinary family
  members.
- Version one focuses on server-side inspection and cleanup of stored media; it does not include
  media compression, format conversion, user-facing bulk deletion, or archive export.
- Unreferenced files are the default cleanup target because they can be identified without
  changing the retention of family posts.
- A configurable age threshold may be used only for files that are independently confirmed safe
  to remove; active post media remains protected regardless of age.
- Cleanup is initiated manually by an administrator in version one; unattended scheduling is out
  of scope.
- Confirmed cleanup first moves files to recoverable quarantine; permanent deletion happens only
  after the 30-day quarantine retention period and is not part of the initial confirmation action.
- Restoration is an administrator action available during quarantine when the original post
  still exists; automatic restoration is out of scope.
- Existing authentication, family membership, media storage, and post ownership rules remain in
  force.
