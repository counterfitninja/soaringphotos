"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createInvite() {
  const admin = await requireAdmin();
  await db.invite.create({
    data: {
      token: randomBytes(16).toString("hex"),
      createdById: admin.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  revalidatePath("/admin/invites");
}

export async function deleteInvite(inviteId: string) {
  await requireAdmin();
  await db.invite.delete({ where: { id: inviteId } }).catch(() => {});
  revalidatePath("/admin/invites");
}
