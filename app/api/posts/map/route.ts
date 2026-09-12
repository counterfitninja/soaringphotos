import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { mapQuerySchema } from "@/lib/validation";

/**
 * GET /api/posts/map?feedId=FEED_ID&limit=50
 * Returns the most recent geotagged posts for the authenticated user,
 * scoped strictly to feeds the user is a member of.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = new URL(req.url);
  const parseResult = mapQuerySchema.safeParse({
    feedId: url.searchParams.get("feedId") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0].message },
      { status: 400 },
    );
  }

  const { feedId: requestedFeedId, limit } = parseResult.data;

  // Retrieve user memberships
  const memberships = await db.feedMembership.findMany({
    where: { userId: session.userId },
    select: { feedId: true },
  });

  const memberFeedIds = memberships.map((m) => m.feedId);
  if (memberFeedIds.length === 0) {
    return NextResponse.json({ posts: [], total: 0, limit });
  }

  // Determine allowed target feed IDs
  let targetFeedCondition: { in: string[] } | string;

  if (requestedFeedId && requestedFeedId !== "all") {
    if (!memberFeedIds.includes(requestedFeedId)) {
      return NextResponse.json(
        { error: "You do not have access to this feed." },
        { status: 403 },
      );
    }
    targetFeedCondition = requestedFeedId;
  } else {
    // Default to session's activeFeedId if set, or all accessible feeds
    if (session.activeFeedId && memberFeedIds.includes(session.activeFeedId) && requestedFeedId !== "all") {
      targetFeedCondition = session.activeFeedId;
    } else {
      targetFeedCondition = { in: memberFeedIds };
    }
  }

  const posts = await db.post.findMany({
    where: {
      feedId: typeof targetFeedCondition === "string" ? targetFeedCondition : targetFeedCondition,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      caption: true,
      createdAt: true,
      latitude: true,
      longitude: true,
      locationName: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarKey: true,
        },
      },
      feed: {
        select: {
          id: true,
          name: true,
        },
      },
      media: {
        select: {
          key: true,
          mimeType: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json({
    posts,
    total: posts.length,
    limit,
  });
}
