import assert from "node:assert/strict";
import test from "node:test";

import { getCommentNotificationRecipients } from "../lib/notification-policy";
import { getPushNotificationContent } from "../lib/push";
import { formatDateTime } from "../lib/utils";

const users = [
  { id: "owner", username: "owner" },
  { id: "mentioned", username: "mentioned" },
  { id: "other", username: "other" },
];

test("comment timestamps include both date and time", () => {
  const formatted = formatDateTime(new Date("2026-09-09T14:05:00.000Z"));
  assert.match(formatted, /2026/);
  assert.match(formatted, /05/);
});

test("cross-user comments notify the authorized post owner", () => {
  assert.deepEqual(
    getCommentNotificationRecipients({
      authorId: "commenter",
      ownerId: "owner",
      mentionedUsernames: new Set(),
      users,
    }),
    [{ id: "owner", type: "comment" }],
  );
});

test("self-comments do not notify the commenter as owner", () => {
  assert.deepEqual(
    getCommentNotificationRecipients({
      authorId: "owner",
      ownerId: "owner",
      mentionedUsernames: new Set(),
      users,
    }),
    [],
  );
});

test("owner mention is merged into one comment event while other mentions remain", () => {
  assert.deepEqual(
    getCommentNotificationRecipients({
      authorId: "commenter",
      ownerId: "owner",
      mentionedUsernames: new Set(["owner", "mentioned"]),
      users,
    }),
    [
      { id: "owner", type: "comment" },
      { id: "mentioned", type: "mention" },
    ],
  );
});

test("users outside the authorized feed receive no comment notification", () => {
  assert.deepEqual(
    getCommentNotificationRecipients({
      authorId: "commenter",
      ownerId: "owner",
      mentionedUsernames: new Set(["outside"]),
      users: [{ id: "commenter", username: "commenter" }],
    }),
    [],
  );
});

test("comment push content identifies the actor and preserves the comment text", () => {
  assert.deepEqual(getPushNotificationContent("comment", "owner", "A new family update"), {
    title: "owner commented on your post",
    body: "A new family update",
  });
  assert.deepEqual(getPushNotificationContent("comment", "owner", ""), {
    title: "owner commented on your post",
    body: "Added a comment to your post.",
  });
});