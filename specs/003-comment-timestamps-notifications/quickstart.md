# Quickstart: Comment Timestamps and Post-Owner Notifications

## Prerequisites

- Node.js and npm dependencies installed.
- A migrated and seeded local database.
- Two invite-created family users who share a feed.
- Optional: push environment configured and a subscribed browser for push verification.

## Automated Checks

Run the focused tests for comment notification policy and timestamp data behavior:

```powershell
npm test -- --runInBand
```

If the repository test runner is not configured yet, run the project checks below and use the manual scenarios as the acceptance test until focused tests are added.

Validate the production build:

```powershell
npm run build
```

## Manual Acceptance Scenarios

1. Sign in as the owner, create a picture, and add a comment as the owner. Confirm the comment shows a smaller date/time line beneath its text and no owner notification is created.
2. Add a comment to the owner's picture from the second family account. Confirm the owner sees one unread notification naming the commenter, describing the comment, and linking to the correct picture.
3. Open the notification and confirm the related picture displays the new comment and its timestamp.
4. Add several comments to the same picture. Confirm each comment has its own timestamp and the owner receives distinct activity entries rather than one overwritten entry.
5. Mention a third authorized family member in a comment. Confirm the mentioned member still receives a mention notification. If the owner is also mentioned, confirm the UI does not show duplicate indistinguishable events for the same comment.
6. Attempt the comment flow with a user who cannot access the picture's feed. Confirm the request is rejected and no comment or notification is created.
7. With push enabled, add a comment as the second user and confirm the owner receives a push event that links to the picture. Disable or invalidate the push subscription and confirm the in-app notification still appears and the comment remains saved.
8. Check the picture feed card and the full post page at desktop and mobile viewport sizes. Confirm timestamp text stays beneath each comment without clipping, overlap, or unintended horizontal scrolling.

## Expected Outcomes

- Every visible comment has a readable compact date/time beneath it.
- Valid cross-user comments create one owner activity event tied to the exact comment.
- Self-comments do not notify the owner.
- Existing mention notifications continue to work.
- Unauthorized users cannot create comments or receive private comment activity.
- Push delivery is additive and best-effort; in-app activity remains authoritative.

See [data-model.md](data-model.md) for persistence and uniqueness rules.