# Research: Comment Timestamps and Post-Owner Notifications

## Decision: Reuse the persisted comment creation timestamp

- **Decision**: Render each comment's existing creation date and time from the comment record already loaded by the shared post include.
- **Rationale**: The `Comment` entity already stores `createdAt`, and `lib/types.ts` loads comments ordered by that value. This adds no query per comment, preserves the event's original time, and works for both feed cards and post detail.
- **Alternatives considered**: Adding a second display timestamp or calculating time at render would risk inconsistency and would not improve the source data.

## Decision: Add a comment-specific notification identity

- **Decision**: Extend notification persistence so comment notifications identify the specific comment and are unique per recipient/comment/type. Use a dedicated `comment` notification type while retaining existing `post` and `mention` types.
- **Rationale**: The current notification uniqueness key is recipient/post/type, which would collapse multiple comments on the same post into one row. A comment-specific identity preserves every owner event and makes duplicate creation retry-safe.
- **Alternatives considered**: Reusing the existing post notification row would lose activity history; changing all notification uniqueness semantics without a comment identity would permit duplicates or require fragile time-based deduplication.

## Decision: Notify the post owner and preserve mention behavior

- **Decision**: After the comment is persisted, resolve the post owner and create an owner notification only when the commenter is a different authorized user. Continue creating mention notifications for explicitly mentioned authorized members, deduplicating the owner when the owner is also mentioned.
- **Rationale**: This directly satisfies the owner workflow while preserving the existing mention contract. Recipient checks remain bounded by the post's feed membership.
- **Alternatives considered**: Replacing mentions with owner notifications would regress existing user-directed notifications; notifying every feed member would exceed the requested scope and create unwanted noise.

## Decision: Keep push delivery best-effort

- **Decision**: Extend the existing push notification type and payload wording for `comment` events. Create the in-app notification first; push delivery remains best-effort and must not cause comment creation to fail.
- **Rationale**: The current push helper already isolates delivery failures and removes invalid subscriptions. Reusing it avoids a second delivery pipeline and preserves the existing offline/in-app fallback.
- **Alternatives considered**: Making push delivery transactional would make comments unreliable when a browser subscription or push provider is unavailable.

## Decision: Use the viewer's local date/time presentation

- **Decision**: Present the timestamp using the existing application date/time convention, with a compact secondary text style directly below the comment.
- **Rationale**: The user requested a smaller timestamp below the comment, and local presentation is the most understandable default for family members in different time zones.
- **Alternatives considered**: A relative-only value such as "2h ago" does not always provide the requested date and time context; a server-timezone label can be confusing for distributed family members.