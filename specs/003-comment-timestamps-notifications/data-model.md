# Data Model: Comment Timestamps and Post-Owner Notifications

## Existing Comment

The existing `Comment` entity remains the source of truth for comment activity.

| Field | Type | Rules | Notes |
|---|---|---|---|
| `id` | identifier | required, unique | Identifies the comment and supports notification deduplication |
| `postId` | identifier | required, related post must exist | The picture or video receiving the comment |
| `authorId` | identifier | required, authenticated family member | The commenter |
| `text` | text | 1-500 characters after existing validation | Existing input boundary is unchanged |
| `createdAt` | date/time | required, assigned on creation | Displayed beneath the comment text |

## Comment Notification

Extend the existing `Notification` entity with a nullable relation to `Comment` for comment activity. The relation is nullable so existing post and mention notifications remain compatible during migration.

| Field | Type | Rules | Notes |
|---|---|---|---|
| `id` | identifier | required, unique | Existing notification identity |
| `userId` | identifier | required, authorized recipient | Post owner for owner notifications; mentioned member for mentions |
| `actorId` | identifier | required, authenticated commenter | User who performed the action |
| `postId` | identifier | required, related post | Keeps notification navigation and feed scoping intact |
| `commentId` | identifier, nullable | required for `comment` type; null for legacy `post` notifications | Points to the exact comment that caused the event |
| `type` | text | `comment`, `mention`, or existing types | `comment` identifies owner activity |
| `feedId` | identifier | required, related feed | Authorization and feed label scope |
| `readAt` | date/time, nullable | null until read | Existing unread/read behavior |
| `createdAt` | date/time | assigned on creation | Notification ordering |

### Constraints and Relationships

- A comment belongs to exactly one post and author and is deleted with its post under existing cascade behavior.
- A comment notification references exactly one comment, post, actor, recipient, and feed when its type is `comment`.
- Comment owner notifications are unique by `(userId, commentId, type)` so retries cannot duplicate delivery while separate comments on one post remain visible.
- Existing notification rows remain valid during migration; any uniqueness/index transition must preserve existing `post` and `mention` records.
- Recipient creation requires authenticated access to the post's feed. Push subscriptions are delivery targets only and do not change authorization.

### State Transitions

1. Valid comment submission: validate and authorize -> create `Comment` -> create owner/mention notification rows -> attempt push delivery.
2. Invalid or unauthorized submission: reject before persistence -> no comment and no notification.
3. Notification read: existing notification center marks the notification read; the comment remains unchanged.
4. Push failure: retain the in-app notification and saved comment; log or handle delivery failure through the existing push helper.