import { db } from "@/lib/db";
import { sendPushNotifications } from "@/lib/push";
import { getCommentNotificationRecipients } from "@/lib/notification-policy";

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
  commentId,
}: {
  postId: string;
  authorId: string;
  text: string;
  commentId: string;
}) {
  const mentionedUsernames = new Set(extractMentionedUsernames(text));
  const post = await db.post.findUnique({ where: { id: postId }, select: { feedId: true, authorId: true } });
  if (!post) return;

  // Only members of the post's feed can be notified (FR-014).
  const memberships = await db.feedMembership.findMany({
    where: { feedId: post.feedId, userId: { not: authorId } },
    select: { user: { select: { id: true, username: true } } },
  });
  const users = memberships.map((m) => m.user);
  const recipients = getCommentNotificationRecipients({
    authorId,
    ownerId: post.authorId,
    mentionedUsernames,
    users,
  });

  if (recipients.length === 0) return;

  // (userId, commentId, type) is unique, so retries re-mark the same event unread instead of duplicating it.
  await Promise.all(
    recipients.map((recipient) =>
      db.notification.upsert({
        where: {
          userId_commentId_type: { userId: recipient.id, commentId, type: recipient.type },
        },
        update: { readAt: null, actorId: authorId, postId, feedId: post.feedId, createdAt: new Date() },
        create: {
          userId: recipient.id,
          actorId: authorId,
          postId,
          commentId,
          type: recipient.type,
          feedId: post.feedId,
        },
      }),
    ),
  );

  const author = await db.user.findUnique({ where: { id: authorId }, select: { username: true } });
  if (author) {
    await sendPushNotifications({ recipients, actorUsername: author.username, caption: text, postId, feedId: post.feedId });
  }
}