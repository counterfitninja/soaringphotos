# Feature Specification: Comment Timestamps and Post-Owner Notifications

**Feature Branch**: `003-comment-timestamps-notifications`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "when commenting on a picture can you add the time and date the comment was made. make it smaller and underneath the comment. Can you also notificy the owner of the post with the comment"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See When Comments Were Made (Priority: P1)

As a family member viewing a picture, I want each comment to show when it was made so that I can understand the conversation in context.

**Why this priority**: The timestamp is the direct usability request and applies to every displayed comment.

**Independent Test**: Open a picture with comments made at different times and verify that each comment has a readable date and time beneath its text.

**Acceptance Scenarios**:

1. **Given** a picture has one or more comments, **When** an authorized family member views the comments, **Then** each comment displays its creation date and time directly below the comment text.
2. **Given** a comment timestamp is displayed, **When** the viewer compares it with the comment text, **Then** the timestamp uses smaller, visually secondary text and does not compete with or overlap the comment.
3. **Given** a picture has no comments, **When** an authorized family member views it, **Then** the page remains unchanged apart from the existing empty-comment state.

### User Story 2 - Notify the Picture Owner of a Comment (Priority: P1)

As the owner of a picture, I want to be notified when another family member comments on it so that I can see and respond to the conversation.

**Why this priority**: Without notification, the owner may miss new discussion on their picture.

**Independent Test**: Have one authorized family member comment on another family member's picture, then verify that the picture owner receives an in-app notification identifying the commenter and linking to the picture.

**Acceptance Scenarios**:

1. **Given** an authorized family member comments on a picture owned by another family member, **When** the comment is accepted, **Then** the picture owner receives one unread notification naming the commenter and indicating that they commented on the picture.
2. **Given** the picture owner opens the comment notification, **When** the notification is selected, **Then** the owner is taken to the related picture and can see the new comment.
3. **Given** the commenter is also the picture owner, **When** the owner comments on their own picture, **Then** the owner does not receive a notification for their own action.
4. **Given** the picture owner has enabled available push notifications, **When** a new comment notification is created, **Then** the owner receives the same event through the enabled push channel without exposing the picture outside the family.

### User Story 3 - Preserve Existing Comment Mentions (Priority: P2)

As a family member mentioned in a comment, I want the existing mention notification behavior to continue while the picture owner is notified separately when appropriate.

**Why this priority**: Existing mention workflows must not regress when comment notifications are expanded.

**Independent Test**: Comment on a picture while mentioning another authorized family member, then verify that the mentioned member still receives a mention notification and the picture owner receives the owner notification when they are different people.

**Acceptance Scenarios**:

1. **Given** a comment mentions an authorized family member, **When** the comment is accepted, **Then** the mentioned member continues to receive a mention notification according to existing behavior.
2. **Given** the mentioned member is also the picture owner, **When** the comment is accepted, **Then** the owner receives one understandable notification event rather than duplicate indistinguishable notifications for the same comment.

### Edge Cases

- A comment is rejected by validation or authorization; no timestamped comment or owner notification is created.
- The picture no longer exists when a comment is submitted; the user receives the existing not-found behavior and no notification is created.
- The picture owner is no longer an authorized member of the picture's family feed; no private notification is delivered to that account.
- A notification delivery channel is unavailable; the in-app notification remains available and the comment itself is still saved successfully.
- Several comments are added in quick succession; each comment retains its own creation date and time, and the owner can distinguish the resulting notifications.
- A timestamp crosses a daylight-saving or timezone boundary; the displayed value remains an unambiguous local date and time for the viewer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the creation date and time for every comment visible to an authorized viewer.
- **FR-002**: The timestamp MUST appear directly beneath its comment text and use a smaller, visually secondary presentation than the comment text.
- **FR-003**: The timestamp MUST remain readable on supported desktop and mobile layouts without overlapping the comment, author, or adjacent controls.
- **FR-004**: When an authorized user creates a comment on another user's picture, the system MUST create an unread notification for the picture owner.
- **FR-005**: The owner notification MUST identify the commenter, indicate that a comment was added, and link to the related picture.
- **FR-006**: The system MUST NOT create an owner notification when a user comments on their own picture.
- **FR-007**: The system MUST prevent owner notifications from crossing family-feed authorization boundaries.
- **FR-008**: The system MUST preserve existing comment validation, authorization, mention notification, and notification-mute behavior unless this feature explicitly requires a different outcome.
- **FR-009**: If push notifications are enabled for the picture owner, the system MUST attempt to deliver the owner comment notification through that channel while retaining the in-app notification when delivery fails or is unavailable.
- **FR-010**: The system MUST avoid creating duplicate owner notifications for the same comment and recipient.
- **FR-011**: The system MUST retain the original comment creation timestamp so the displayed value and notification event refer to the same comment activity.

### Key Entities

- **Comment**: A family member's text attached to a picture, including its author, picture, and creation date and time.
- **Picture Owner**: The family member who created the picture and is eligible to receive notifications about activity on it.
- **Comment Notification**: An unread or read activity item addressed to the picture owner, identifying the commenter and related picture.
- **Mention Notification**: The existing notification for a family member explicitly named in comment text; it remains distinct unless the mentioned member is also the picture owner and the product presents one combined event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability checks, 100% of visible comments show a readable date and time directly beneath the comment text on representative desktop and mobile layouts.
- **SC-002**: At least 95% of testers can identify when a selected comment was made without opening another screen.
- **SC-003**: For valid comments made by one family member on another member's picture, 100% of test cases produce an owner notification within 5 seconds of the comment being accepted in the application.
- **SC-004**: 100% of owner notifications link to the correct picture and identify the correct commenter.
- **SC-005**: 0% of authorization tests deliver a comment notification to a user who is not authorized to access the related family feed.
- **SC-006**: Existing mention-notification tests and comment-creation tests continue to pass after the feature is enabled.

## Assumptions

- Existing comment creation date and time data is authoritative and is available for every saved comment.
- The feature applies to comments on both photos and videos wherever the application presents a shared comment experience.
- The application may use the viewer's local timezone for presentation, with enough date and time detail to distinguish comments made close together.
- Existing in-app notification and optional push-notification channels are reused; no new notification preferences are introduced for this feature.
- The picture owner is the user who created the related post, and ownership is evaluated within the existing family-feed authorization model.
- Notification wording and exact visual styling may follow the existing notification-center conventions as long as the required information remains clear.