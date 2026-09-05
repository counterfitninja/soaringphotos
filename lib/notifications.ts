import { db } from "@/lib/db";

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

  await db.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      actorId: authorId,
      postId,
      type: mentionedUsernames.has(recipient.username.toLowerCase()) ? "mention" : "post",
    })),
  });
}