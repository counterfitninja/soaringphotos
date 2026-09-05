"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/validation";

export type CommentState = { error?: string; success?: boolean } | null;

export async function addComment(
  postId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(String(formData.get("text") ?? ""));
  if (!parsed.success) {
    return { error: "Comments must be 1-500 characters." };
  }

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { error: "Post not found." };

  await db.comment.create({
    data: { postId, authorId: user.id, text: parsed.data },
  });

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { success: true };
}
