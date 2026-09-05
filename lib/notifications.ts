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
}: {
  postId: string;
  authorId: string;
  caption: string;
}) {
  const mentionedUsernames = new Set(extractMentionedUsernames(caption));
  const recipients = await db.user.findMany({
    where: { id: { not: authorId } },
    select: { id: true, username: true },
  });

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
    })),
  });

  const author = await db.user.findUnique({ where: { id: authorId }, select: { username: true } });
  if (author) {
    await sendPushNotifications({ recipients: recipientsWithType, actorUsername: author.username, caption, postId });
  }
}