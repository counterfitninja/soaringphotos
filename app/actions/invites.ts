"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Form action: creates a feed-scoped invite. Reads optional hidden `feedId` form field;
 *  defaults to the admin's active/first feed for backward compatibility. */
export async function createInvite(formData?: FormData) {
  const admin = await requireAdmin();
  const requested = formData ? String(formData.get("feedId") ?? "").trim() : "";
  let targetFeedId = requested || undefined;
  if (!targetFeedId) {
    const membership = await db.feedMembership.findFirst({
      where: { userId: admin.id },
      orderBy: { feed: { name: "asc" } },
      select: { feedId: true },
    });
    if (!membership) throw new Error("No feed available to invite into.");
    targetFeedId = membership.feedId;
  }
  await db.invite.create({
    data: {
      token: randomBytes(16).toString("hex"),
      createdById: admin.id,
      feedId: targetFeedId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/invites");
}

export async function deleteInvite(inviteId: string) {
  await requireAdmin();
  await db.invite.delete({ where: { id: inviteId } }).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/admin/invites");
}
