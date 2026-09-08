"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleLike(postId: string) {
  const user = await requireUser();
  const post = await db.post.findUnique({ where: { id: postId }, select: { feedId: true } });
  if (!post) return;
  const membership = await db.feedMembership.findUnique({
    where: { userId_feedId: { userId: user.id, feedId: post.feedId } },
    select: { id: true },
  });
  if (!membership) return; // not a member of the post's feed — no-op (FR-010)

  const key = { userId_postId: { userId: user.id, postId } };

  const existing = await db.like.findUnique({ where: key });
  if (existing) {
    await db.like.delete({ where: key });
  } else {
    await db.like.create({ data: { userId: user.id, postId } });
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}
