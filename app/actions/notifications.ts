"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function setUserNotificationMute(targetUserId: string, muted: boolean) {
  const user = await requireUser();
  if (targetUserId === user.id) return;

  if (muted) {
    await db.notificationMute.upsert({
      where: { userId_mutedUserId: { userId: user.id, mutedUserId: targetUserId } },
      create: { userId: user.id, mutedUserId: targetUserId },
      update: {},
    });
  } else {
    await db.notificationMute.deleteMany({
      where: { userId: user.id, mutedUserId: targetUserId },
    });
  }
  revalidatePath("/notifications/settings");
}