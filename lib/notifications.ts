import { db } from "@/lib/db";
import { sendPushNotifications } from "@/lib/push";

const MENTION_RE = /(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{3,20})\b/g;

export function extractMentionedUsernames(text: string): string[] {
  const usernames = new Set<string>();
  for (const match of text.matchAll(MENTION_RE)) {
    usernames.add(match[2].toLowerCase());
  }
  return [...usernames];
}

export async function createPostNotifications({
  postId,
  authorId,
  caption,
  feedId,
}: {
  postId: string;
  authorId: string;
  caption: string;
  feedId: string;
}) {
  const mentionedUsernames = new Set(extractMentionedUsernames(caption));
  // Only members of the post's feed are notified (FR-014).
  const memberships = await db.feedMembership.findMany({
    where: { feedId, userId: { not: authorId } },
    select: { user: { select: { id: true, username: true } } },
  });
  const recipients = memberships.map((m) => m.user);

  if (recipients.length === 0) return;

  const mutes = await db.notificationMute.findMany({
    where: { mutedUserId: authorId, userId: { in: recipients.map((recipient) => recipient.id) } },
    select: { userId: true },
  });
  const mutedRecipientIds = new Set(mutes.map((mute) => mute.userId));

  const recipientsWithType = recipients
    .map((recipient) => ({
      id: recipient.id,
      type: mentionedUsernames.has(recipient.username.toLowerCase()) ? ("mention" as const) : ("post" as const),
    }))
    // A muted author's regular posts are skipped, but mentions still notify.
    .filter((recipient) => recipient.type === "mention" || !mutedRecipientIds.has(recipient.id));

  if (recipientsWithType.length === 0) return;

  await db.notification.createMany({
    data: recipientsWithType.map((recipient) => ({
      userId: recipient.id,
      actorId: authorId,
      postId,
      type: recipient.type,
      feedId,
    })),
  });

  const author = await db.user.findUnique({ where: { id: authorId }, select: { username: true } });
  if (author) {
    await sendPushNotifications({ recipients: recipientsWithType, actorUsername: author.username, caption, postId, feedId });
  }
}

export async function createCommentNotifications({
  postId,
  authorId,
  text,
}: {
  postId: string;
  authorId: string;
  text: string;
}) {
  const mentionedUsernames = new Set(extractMentionedUsernames(text));
  if (mentionedUsernames.size === 0) return;

  // Only members of the post's feed can be mentioned/notified (FR-014).
  const post = await db.post.findUnique({ where: { id: postId }, select: { feedId: true } });
  if (!post) return;
  const memberships = await db.feedMembership.findMany({
    where: { feedId: post.feedId, userId: { not: authorId } },
    select: { user: { select: { id: true, username: true } } },
  });
  const users = memberships.map((m) => m.user);
  // Mentions always notify, even if the recipient muted the author's regular posts.
  const recipients = users
    .filter((user) => mentionedUsernames.has(user.username.toLowerCase()))
    .map((user) => ({ id: user.id, type: "mention" as const }));

  if (recipients.length === 0) return;

  // (userId, postId, type) is unique, so a repeat mention upserts: re-mark unread and point at the latest actor.
  await Promise.all(
    recipients.map((recipient) =>
      db.notification.upsert({
        where: { userId_postId_type: { userId: recipient.id, postId, type: "mention" } },
        update: { readAt: null, actorId: authorId, createdAt: new Date() },
        create: { userId: recipient.id, actorId: authorId, postId, type: "mention", feedId: post.feedId },
      }),
    ),
  );

  const author = await db.user.findUnique({ where: { id: authorId }, select: { username: true } });
  if (author) {
    await sendPushNotifications({ recipients, actorUsername: author.username, caption: text, postId, feedId: post.feedId });
  }
}