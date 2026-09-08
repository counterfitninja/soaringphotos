# Feature Specification: Multi-Feed Access (Private Feeds)

**Feature Branch**: `002-multi-feed-access`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "i want to be a ble to allow different users to have access to multiple private instances of famstagram. for example my daighter can have an instance just for her friends and herself, but click a toggle and see the family feed. It would also be useful to have an amalgamated feed to see images from both feeds and you pick which feed you post ttoo"

## Clarifications

### Session 2026-09-08

- Q: Should multiple private feeds live in one deployment or be separate linked instances? → A: One deployment hosting many feeds, with feed boundaries kept clean so feeds can be split onto separate compute in the future.
- Q: Who should be able to create feeds and manage their members? → A: The global admin creates feeds and appoints a per-feed manager for each feed; a manager can invite new users and add/remove members only within their own feed(s).
- Q: What should happen with notifications for activity in a feed that is not the user's currently active feed? → A: A combined notification center shows notifications from all feeds the user belongs to, each labeled with its feed; tapping one switches to that feed, and the feed selector shows per-feed unread counts.
- Q: Should posts in the amalgamated view carry a visible feed label? → A: Yes — every post in the amalgamated view shows an always-visible feed-name label (e.g., a small chip or badge) so the audience is identifiable at a glance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch Between Multiple Private Feeds (Priority: P1)

A user who belongs to more than one private feed (for example, a daughter who is a member of a "Friends" feed and the "Family" feed) opens the app, sees the content of her currently active feed only, and can tap a visible feed selector to switch to another feed she belongs to. When she switches, the entire app context (timeline, post detail, comments, likes, notifications) shows only that feed's content. Her last-selected feed is remembered the next time she opens the app.

**Why this priority**: This is the core value of the feature — one account participating in multiple private spaces with a hard privacy boundary between them. Without scoped feeds and switching, nothing else in the feature has meaning.

**Independent Test**: Can be fully tested by creating two feeds, assigning one user to both and another user to only one, posting distinct content to each feed, and verifying that (a) the dual-member can toggle and sees only the active feed's content, and (b) the single-member can never see the other feed's content, members, or existence. Delivers the fundamental privacy boundary and switching value on its own.

**Acceptance Scenarios**:

1. **Given** a user who is a member of feeds "Friends" and "Family", **When** the user opens the app, **Then** the user sees the timeline of their last-active feed and a feed selector indicating which feed is active.
2. **Given** a user viewing the "Friends" feed, **When** the user selects "Family" from the feed selector, **Then** the timeline and all related views (post detail, comments, likes, notifications) show only "Family" content.
3. **Given** a user who is a member of only the "Family" feed, **When** the user browses the app, **Then** the user sees no indication that the "Friends" feed exists (no name, no member list, no content).
4. **Given** a user who switched to the "Family" feed and closed the app, **When** the user reopens the app later, **Then** the "Family" feed is still the active feed.
5. **Given** a user who belongs to exactly one feed, **When** the user browses the app, **Then** the experience matches today's single-feed behavior with no disruptive UI changes.

---

### User Story 2 - Post to a Chosen Feed (Priority: P2)

A member of multiple feeds creates a new post and explicitly chooses which of their feeds the post is published to. The choice defaults to the currently active feed, and the selected destination is clearly confirmed before publishing. Once posted, the post is visible only to members of that feed.

**Why this priority**: Publishing to the wrong private space is the biggest user-facing risk of multi-feed support; an explicit, defaulted feed choice protects privacy while keeping posting fast. It builds on P1's feed context but is a separate interaction.

**Independent Test**: Can be fully tested by a dual-feed member creating posts while each feed is active (and while overriding the default) and verifying each post appears only in the selected feed and only to its members. Delivers correct publishing behavior even if the amalgamated view is not yet built.

**Acceptance Scenarios**:

1. **Given** a dual-feed member with "Friends" active, **When** the user opens the post composer, **Then** the destination feed is pre-selected as "Friends" and visibly displayed.
2. **Given** the composer open with "Friends" pre-selected, **When** the user changes the destination to "Family" and publishes, **Then** the post appears in the "Family" feed only and "Friends" members never see it.
3. **Given** a single-feed member, **When** the user creates a post, **Then** the post goes to their only feed with no extra selection step required.
4. **Given** a user who was removed from a feed after opening the composer, **When** the user attempts to publish to that feed, **Then** publishing is blocked with a friendly explanation and no content is exposed.

---

### User Story 3 - Amalgamated "All My Feeds" View (Priority: P3)

A member of multiple feeds selects an "All feeds" (amalgamated) option and sees one combined timeline containing posts from every feed they belong to, newest first. Each post in this view is clearly labeled with the feed it belongs to, and opening a post shows its comments and likes as normal — still only ever revealing content from feeds the viewer belongs to.

**Why this priority**: This is the "useful to have" convenience layer — it saves switching when casually browsing, but the feature is viable without it (P1 switching already gives access to all content).

**Independent Test**: Can be fully tested by a dual-feed member opening the amalgamated view and verifying it contains exactly the union of their feeds' posts in correct order with correct feed labels, and that a single-feed member's amalgamated view matches their one feed. Delivers combined browsing independently of posting changes.

**Acceptance Scenarios**:

1. **Given** a member of "Friends" and "Family" feeds, **When** the user selects the amalgamated view, **Then** the user sees posts from both feeds merged newest-first, each labeled with its feed name.
2. **Given** posts from both feeds in the amalgamated view, **When** the user opens a "Friends" post, **Then** the post, its comments and likes display normally within the "Friends" context.
3. **Given** a member of only one feed, **When** the user opens the amalgamated view, **Then** the content is identical to their single feed's timeline.
4. **Given** a user with no feed memberships, **When** the user opens the app, **Then** the user sees a friendly empty state explaining they have not been added to any feed yet.

---

### User Story 4 - Feed Administration and Membership (Priority: P2)

An authorized user creates a new named private feed (for example "Daughter's Friends") and manages who belongs to it, so that each feed's membership is exactly the intended private circle. Members can be added (including inviting brand-new users directly into a feed) and removed; removed members immediately lose all access to that feed's content.

**Why this priority**: Feeds must be created and populated before anyone can switch or post — but P1 can be validated with administratively seeded data, so the management UI itself is a parallel P2 slice rather than a blocker for the core privacy model.

**Independent Test**: Can be fully tested by creating a feed, adding/removing members (including via a new-user invite scoped to that feed), and verifying access changes take effect immediately. Delivers feed lifecycle management independently of the amalgamated view.

**Acceptance Scenarios**:

1. **Given** an authorized user, **When** they create a feed named "Daughter's Friends", **Then** the feed exists, is empty, and is visible only to its members.
2. **Given** an existing feed, **When** an authorized user adds an existing account as a member, **Then** that account immediately sees the feed in their selector and can view its content.
3. **Given** an existing feed, **When** an authorized user invites a brand-new person, **Then** the invite grants an account that is a member of exactly that feed (and no others).
4. **Given** an existing feed with members, **When** a manager or the global admin removes a member, **Then** that member immediately loses access to the feed's posts, media, comments, and notifications, and the feed disappears from their selector.
5. **Given** two feeds with different names, **When** the global admin attempts to create a third feed with a duplicate name, **Then** the system rejects it with a clear message.
6. **Given** a manager of the "Friends" feed but not the "Family" feed, **When** they attempt to manage members of "Family", **Then** the action is denied and they see no management controls for feeds they do not manage.

---

### Edge Cases

- What happens when a user belongs to zero feeds? They see a friendly empty state ("you haven't been added to any feeds yet") and cannot post.
- What happens when a user is removed from their currently active feed? The app falls back to another feed they belong to (or the empty state) without errors.
- What happens when a user tries to open a direct link to a post or media item from a feed they do not belong to (e.g., shared in chat)? Access is denied as if the content does not exist — no feed name or metadata leaks.
- How does the system handle duplicate or confusingly similar feed names? Creation rejects duplicates; members always see feed names labeled on posts in combined views.
- What happens to notifications when a user belongs to many feeds? All feeds the user belongs to contribute to one combined notification center; each item is labeled with its feed, tapping an item switches to that feed's context, and the feed selector shows per-feed unread counts. Push alerts follow the same combined behavior (subject to the user's existing mute settings).
- What happens to all existing content and users when the feature is introduced? Everything migrates into a default feed (e.g., "Family") with all existing users as members, so day-one behavior is unchanged.
- What happens when a feed is empty or newly created? Members see a normal empty-timeline state prompting the first post.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multiple named private feeds within a single deployment, with feed boundaries kept self-contained (content, membership, and media ownership fully attributable to one feed) so that an individual feed could be split out onto separate compute in the future without redesign.
- **FR-002**: Each user account MUST be able to hold membership in zero, one, or many feeds simultaneously (one identity across all their feeds).
- **FR-003**: All content — posts, media, comments, likes, shares, and notifications — MUST be scoped to exactly one feed and accessible only to that feed's current members.
- **FR-004**: Users with multiple memberships MUST be able to switch their active feed through a clearly visible feed selector, usable on both mobile and desktop form factors.
- **FR-005**: The system MUST remember each user's last-active feed and restore it on their next visit.
- **FR-006**: Users MUST be able to choose which of their feeds a new post is published to at creation time; the choice MUST default to the currently active feed and MUST be visibly confirmed in the composer.
- **FR-007**: A post MUST belong to exactly one feed (no cross-posting or duplicating across feeds in this iteration).
- **FR-008**: Users with multiple memberships MUST be able to open an amalgamated timeline that merges posts from all of their feeds, newest first; every post in this view MUST carry an always-visible feed-name label (e.g., a small chip or badge) identifying the feed it belongs to.
- **FR-009**: The global admin MUST be the only role able to create feeds; the global admin appoints one or more managers per feed. A feed manager MUST be able to add existing users to, invite new users into, and remove members from only the feed(s) they manage; the global admin can manage membership in any feed.
- **FR-010**: Users MUST NOT be able to discover the existence, name, membership, or content of any feed they do not belong to — including via direct links, search, user suggestions, or error messages.
- **FR-011**: Media files MUST remain private per feed: access to any media item MUST require current membership in the feed that owns it.
- **FR-012**: Invitations MUST be scoped so that a newly invited user's account is a member of exactly the feed(s) the inviter specified at invite time.
- **FR-013**: Removing a member from a feed MUST take effect immediately for all of that feed's content and stop all future notifications from that feed.
- **FR-014**: Notifications MUST only be generated from activity in feeds the recipient currently belongs to.
- **FR-014a**: The notification center MUST combine notifications from all of the user's feeds into one list, with each notification labeled by its source feed; opening a notification from a non-active feed MUST switch the user into that feed's context.
- **FR-014b**: The feed selector MUST surface per-feed unread notification counts so activity in non-active feeds is visible at a glance.
- **FR-015**: When the feature is introduced, all existing posts, comments, likes, shares, and user accounts MUST be assigned to a default feed so that existing members experience no loss of content or change in behavior until additional feeds are created.
- **FR-016**: Users belonging to exactly one feed MUST experience the app essentially as today, with no mandatory extra steps.

### Key Entities *(include if feature involves data)*

- **Feed**: A named private space within the app; has a name, optional description, creation metadata, and an ordered collection of posts. Its existence is visible only to members.
- **Feed Membership**: The association between a user account and a feed; carries the member's role within that feed (manager or regular member, per clarification Q2) and when they joined.
- **Post**: A photo/video post with caption; belongs to exactly one feed; all its comments, likes, and shares inherit that feed's visibility.
- **User Account**: A single identity that can hold memberships in multiple feeds and carries a last-active-feed preference.
- **Invite**: A single-use, time-limited invitation that now also specifies which feed(s) the new account will join.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of posts, media, comments, likes, and notifications are accessible only to current members of their owning feed in authorization testing (zero cross-feed leakage, including via direct links).
- **SC-002**: A multi-feed member can switch feeds in no more than 2 taps/clicks, with the switched timeline visibly loaded in under 2 seconds on a typical connection.
- **SC-003**: 95% of multi-feed members publish to their intended feed on the first attempt in usability testing (measured via destination-confirmation review, not support requests).
- **SC-004**: The amalgamated view displays the correct union of a member's feeds' posts — with correct ordering and feed labels — for 100% of test cases covering 1 to 10 memberships.
- **SC-005**: After rollout, 100% of pre-existing content remains visible to its original audience in the default feed, and existing single-feed users report no change in their daily workflow.
- **SC-006**: Feed management tasks (create feed, add member, remove member) are each completable by an authorized user in under 1 minute without technical assistance.

## Assumptions

- "Instance" in the request means a private feed/space inside the one deployment (per clarification Q1); one user account spans all feeds the user belongs to. Feed data boundaries are kept clean so a feed could later be split onto separate compute without changing user-facing behavior.
- A post belongs to exactly one feed; cross-posting the same media to multiple feeds is out of scope for this iteration.
- Feeds are not end-user deletable in this iteration; an empty feed simply shows an empty timeline. (Feed deletion/archival can be a follow-up feature.)
- All existing content and users migrate into a single default feed (name configurable, e.g., "Family") at rollout.
- Profile pages show a user's posts only from feeds the viewer shares membership with; the full profile view is per-feed context.
- Search (users, content) only ever returns results from feeds the searcher belongs to.
- Push and in-app notifications carry the feed context so tapping a notification lands in the correct feed.
- Feed management authority: the global admin creates feeds and appoints per-feed managers; managers run their own feed's membership (per clarification Q2). Regular members cannot create feeds or manage memberships.
- The existing invite-only, admin-managed onboarding model remains the foundation; feed-scoped invites extend it rather than replace it.
