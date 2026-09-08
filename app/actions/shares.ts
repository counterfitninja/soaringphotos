"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function sharePost(
  postId: string,
  toUserId: string,
  message: string,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();

  if (toUserId === user.id) return { error: "You can't share a post with yourself." };

  const [post, target] = await Promise.all([
    db.post.findUnique({ where: { id: postId }, select: { id: true, feedId: true } }),
    db.user.findUnique({ where: { id: toUserId }, select: { id: true } }),
  ]);
  if (!post) return { error: "Post not found." };
  if (!target) return { error: "That user no longer exists." };

  // Both parties must belong to the post's feed — sharing can't cross the boundary.
  const [sharerMembership, targetMembership] = await Promise.all([
    db.feedMembership.findUnique({
      where: { userId_feedId: { userId: user.id, feedId: post.feedId } },
      select: { id: true },
    }),
    db.feedMembership.findUnique({
      where: { userId_feedId: { userId: toUserId, feedId: post.feedId } },
      select: { id: true },
    }),
  ]);
  if (!sharerMembership) return { error: "Post not found." }; // FR-010
  if (!targetMembership) return { error: "That person isn't in this feed." };

  await db.sharedPost.create({
    data: { postId, fromUserId: user.id, toUserId, message: message.slice(0, 200) },
  });

  revalidatePath("/shared");
  return { ok: true };
}

export async function markAllSharesRead() {
  const user = await requireUser();
  await db.sharedPost.updateMany({
    where: { toUserId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/shared");
}
