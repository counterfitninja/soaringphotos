export type CommentNotificationRecipient = {
  id: string;
  type: "comment" | "mention";
};

export function getCommentNotificationRecipients({
  authorId,
  ownerId,
  mentionedUsernames,
  users,
}: {
  authorId: string;
  ownerId: string;
  mentionedUsernames: Set<string>;
  users: { id: string; username: string }[];
}): CommentNotificationRecipient[] {
  const owner = users.find((user) => user.id === ownerId && user.id !== authorId);
  const recipients: CommentNotificationRecipient[] = owner ? [{ id: owner.id, type: "comment" }] : [];

  recipients.push(
    ...users
      .filter((user) => user.id !== owner?.id && mentionedUsernames.has(user.username.toLowerCase()))
      .map((user) => ({ id: user.id, type: "mention" as const })),
  );

  return recipients;
}