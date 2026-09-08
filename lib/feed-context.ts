import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ALL_FEEDS } from "@/lib/validation";

export interface FeedMembershipInfo {
  feedId: string;
  feedName: string;
  role: string; // "manager" | "member"
}

export interface FeedContext {
  user: {
    id: string;
    username: string;
    role: string; // global role: "admin" | "member"
  };
  memberships: FeedMembershipInfo[];
  /** null only when the user has no memberships */
  activeFeedId: string | null;
  viewMode: "feed" | "all";
}

/** Ids of every feed the user belongs to — use for feed-scoped queries. */
export function membershipFeedIds(ctx: FeedContext): string[] {
  return ctx.memberships.map((m) => m.feedId);
}

/** Global admin, or manager of the given feed. */
export function canManageFeed(
  user: { id: string; role: string },
  memberships: FeedMembershipInfo[],
  feedId: string,
): boolean {
  if (user.role === "admin") return true;
  return memberships.some((m) => m.feedId === feedId && m.role === "manager");
}

/** True when the target feed is one of the user's memberships. */
export function isMember(memberships: FeedMembershipInfo[], feedId: string): boolean {
  return memberships.some((m) => m.feedId === feedId);
}

/**
 * Resolves the current user plus their feed memberships and active feed.
 * Repairs the session's active feed when it points at a feed the user no
 * longer belongs to (e.g. removed membership). Returns null when signed out.
 */
export async function getFeedContext(): Promise<FeedContext | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true },
  });
  if (!user) return null;

  const memberships = await db.feedMembership.findMany({
    where: { userId: user.id },
    include: { feed: { select: { id: true, name: true } } },
    orderBy: { feed: { name: "asc" } },
  });

  const infos: FeedMembershipInfo[] = memberships.map((m) => ({
    feedId: m.feedId,
    feedName: m.feed.name,
    role: m.role,
  }));

  let viewMode: "feed" | "all" = session.feedViewMode === "all" ? "all" : "feed";
  let activeFeedId: string | null = session.activeFeedId ?? null;

  const validActive = activeFeedId !== null && infos.some((m) => m.feedId === activeFeedId);
  if (!validActive) {
    activeFeedId = infos[0]?.feedId ?? null;
    if (viewMode === "all" && infos.length < 2) viewMode = "feed";
    session.activeFeedId = activeFeedId ?? undefined;
    session.feedViewMode = viewMode;
    try {
      // Persist the repair when possible; during RSC render cookies are read-only,
      // in which case the values are simply recomputed on the next request.
      await session.save();
    } catch {
      // ignore: read-only cookie context
    }
  }

  return { user, memberships: infos, activeFeedId, viewMode };
}

/** Like getFeedContext, but redirects to /login when signed out. */
export async function requireFeedContext(): Promise<FeedContext> {
  const ctx = await getFeedContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Validates a feed-switch target against memberships. Returns the resolved session values. */
export function resolveSwitchTarget(
  ctx: FeedContext,
  target: string,
): { activeFeedId?: string; feedViewMode: "feed" | "all" } | { error: string } {
  if (target === ALL_FEEDS) {
    if (ctx.memberships.length < 2) return { error: "The combined view needs at least two feeds." };
    return { feedViewMode: "all" };
  }
  if (!isMember(ctx.memberships, target)) return { error: "Feed not found." };
  return { activeFeedId: target, feedViewMode: "feed" };
}
