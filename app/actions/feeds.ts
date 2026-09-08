"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  canManageFeed,
  isMember,
  requireFeedContext,
  resolveSwitchTarget,
} from "@/lib/feed-context";
import { feedDescriptionSchema, feedNameSchema } from "@/lib/validation";

export interface ActionResult {
  error?: string;
}

/** Switch the active feed (or the amalgamated "all" view) for this session. */
export async function switchFeed(target: string): Promise<ActionResult> {
  const ctx = await requireFeedContext();
  const resolved = resolveSwitchTarget(ctx, target);
  if ("error" in resolved) return { error: resolved.error };

  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (resolved.activeFeedId) session.activeFeedId = resolved.activeFeedId;
  session.feedViewMode = resolved.feedViewMode;
  await session.save();
  revalidatePath("/", "layout");
  return {};
}

/** Create a new private feed. Global admin only. */
export async function createFeed(input: { name: string; description?: string }): Promise<ActionResult> {
  const ctx = await requireFeedContext();
  if (ctx.user.role !== "admin") return { error: "Only the admin can create feeds." };

  const nameCheck = feedNameSchema.safeParse(input.name);
  if (!nameCheck.success) return { error: nameCheck.error.issues[0].message };
  const descCheck = feedDescriptionSchema.safeParse(input.description ?? "");
  if (!descCheck.success) return { error: descCheck.error.issues[0].message };

  const existing = await db.feed.findFirst({
    where: { name: { equals: nameCheck.data } },
    select: { id: true },
  });
  if (existing) return { error: "A feed with that name already exists." };

  await db.feed.create({
    data: {
      name: nameCheck.data,
      description: descCheck.data,
      memberships: {
        create: { userId: ctx.user.id, role: "manager" },
      },
    },
  });
  revalidatePath("/feeds");
  return {};
}

async function requireManagerOf(feedId: string) {
  const ctx = await requireFeedContext();
  if (!canManageFeed(ctx.user, ctx.memberships, feedId)) {
    return { ctx, error: "You do not manage this feed." as string };
  }
  return { ctx, error: null as string | null };
}

/** Add an existing user to a feed the caller manages. */
export async function addMember(feedId: string, userId: string): Promise<ActionResult> {
  const { error } = await requireManagerOf(feedId);
  if (error) return { error };

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { error: "User not found." };

  await db.feedMembership.upsert({
    where: { userId_feedId: { userId, feedId } },
    create: { userId, feedId, role: "member" },
    update: {},
  });
  revalidatePath(`/feeds/${feedId}`);
  return {};
}

/** Remove a member from a feed. Blocks removing the last manager and the global admin from the default feed. */
export async function removeMember(feedId: string, userId: string): Promise<ActionResult> {
  const { ctx, error } = await requireManagerOf(feedId);
  if (error) return { error };

  const membership = await db.feedMembership.findUnique({
    where: { userId_feedId: { userId, feedId } },
    include: { user: { select: { role: true } } },
  });
  if (!membership) return { error: "Not a member of this feed." };

  if (membership.role === "manager") {
    const managerCount = await db.feedMembership.count({ where: { feedId, role: "manager" } });
    if (managerCount <= 1 && ctx.user.id === userId) {
      return { error: "A feed must keep at least one manager." };
    }
  }
  if (membership.user.role === "admin" && ctx.user.id !== userId && ctx.user.role !== "admin") {
    return { error: "Only the admin can remove another admin from a feed." };
  }

  await db.feedMembership.delete({ where: { id: membership.id } });
  revalidatePath(`/feeds/${feedId}`);
  return {};
}

/** Change a member's role within a feed. Global admin only. */
export async function setMemberRole(
  feedId: string,
  userId: string,
  role: "manager" | "member",
): Promise<ActionResult> {
  const ctx = await requireFeedContext();
  if (ctx.user.role !== "admin") return { error: "Only the admin can change roles." };
  if (role !== "manager" && role !== "member") return { error: "Invalid role." };

  const membership = await db.feedMembership.findUnique({
    where: { userId_feedId: { userId, feedId } },
  });
  if (!membership) return { error: "Not a member of this feed." };

  if (membership.role === "manager" && role === "member") {
    const managerCount = await db.feedMembership.count({ where: { feedId, role: "manager" } });
    if (managerCount <= 1) return { error: "A feed must keep at least one manager." };
  }

  await db.feedMembership.update({ where: { id: membership.id }, data: { role } });
  revalidatePath(`/feeds/${feedId}`);
  return {};
}

/** Create a single-use, 7-day invite scoped to a feed the caller manages. */
export async function createFeedInvite(feedId: string): Promise<{ token?: string; error?: string }> {
  const { ctx, error } = await requireManagerOf(feedId);
  if (error) return { error };

  const invite = await db.invite.create({
    data: {
      token: randomBytes(16).toString("hex"),
      createdById: ctx.user.id,
      feedId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath(`/feeds/${feedId}`);
  return { token: invite.token };
}

/** Lists visible to managers/admins: members of a feed. */
export async function listFeedMembers(feedId: string) {
  const { error } = await requireManagerOf(feedId);
  if (error) return { error };
  const members = await db.feedMembership.findMany({
    where: { feedId },
    include: { user: { select: { id: true, username: true, role: true } } },
    orderBy: { user: { username: "asc" } },
  });
  return { members };
}

export { isMember };
