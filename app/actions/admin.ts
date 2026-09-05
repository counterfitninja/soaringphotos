"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMedia } from "@/lib/storage";

export async function deletePostAsAdmin(postId: string) {
  await requireAdmin();

  const post = await db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      author: { select: { username: true } },
      media: { select: { key: true } },
    },
  });
  if (!post) return;

  await db.post.delete({ where: { id: post.id } });
  await Promise.all(post.media.map((media) => deleteMedia(media.key)));

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/profile/${post.author.username}`);
}