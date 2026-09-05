"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleLike(postId: string) {
  const user = await requireUser();
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
