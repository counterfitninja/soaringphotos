"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteMedia, saveMedia } from "@/lib/storage";
import { IMAGE_TYPES, MAX_AVATAR_SIZE } from "@/lib/validation";

export type ProfilePhotoState = { error?: string } | null;

export async function updateProfilePhoto(
  _prev: ProfilePhotoState,
  formData: FormData,
): Promise<ProfilePhotoState> {
  const user = await requireUser();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return { error: "Profile photos must be JPG, PNG, WebP or GIF images." };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "Profile photos must be smaller than 5 MB." };
  }

  const stored = await saveMedia(file);
  await db.user.update({
    where: { id: user.id },
    data: { avatarKey: stored.key, avatarMimeType: stored.mimeType },
  });
  if (user.avatarKey) await deleteMedia(user.avatarKey);

  revalidatePath(`/profile/${user.username}`);
  revalidatePath("/notifications/settings");
  return null;
}