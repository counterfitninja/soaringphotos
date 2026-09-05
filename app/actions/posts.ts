"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMedia } from "@/lib/storage";

export type DeletePostResult = { error?: string; success?: boolean };

export async function deletePost(postId: string): Promise<DeletePostResult> {
  const user = await requireUser();
  const post = await db.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      author: { select: { username: true } },
      media: { select: { key: true } },
    },
  });

  if (!post) return { error: "Post not found." };
  if (post.authorId !== user.id) return { error: "You can only delete your own posts." };

  await db.post.delete({ where: { id: postId } });
  await Promise.all(post.media.map(({ key }) => deleteMedia(key)));

  revalidatePath("/");
  revalidatePath("/shared");
  revalidatePath(`/post/${postId}`);
  revalidatePath(`/profile/${post.author.username}`);
  return { success: true };
}