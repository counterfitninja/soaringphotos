import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FeedManager from "@/components/FeedManager";
import { db } from "@/lib/db";
import { canManageFeed, requireFeedContext } from "@/lib/feed-context";

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFeedContext();
  const { id } = await params;

  if (!canManageFeed(ctx.user, ctx.memberships, id)) redirect("/feeds");

  const feed = await db.feed.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: { select: { id: true, username: true, role: true } } },
        orderBy: { user: { username: "asc" } },
      },
      _count: { select: { posts: true } },
    },
  });
  if (!feed) notFound();

  const memberIds = new Set(feed.memberships.map((m) => m.userId));
  const candidates = await db.user.findMany({
    where: { id: { notIn: [...memberIds] } },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/feeds" className="text-xs text-neutral-400 hover:text-sky-600">
            ← Feeds
          </Link>
          <h1 className="mt-1 text-xl font-bold">{feed.name}</h1>
          {feed.description && <p className="text-sm text-neutral-500">{feed.description}</p>}
          <p className="mt-1 text-xs text-neutral-400">
            {feed.memberships.length} {feed.memberships.length === 1 ? "member" : "members"} ·{" "}
            {feed._count.posts} {feed._count.posts === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      <FeedManager
        feedId={feed.id}
        feedName={feed.name}
        isAdmin={ctx.user.role === "admin"}
        currentUserId={ctx.user.id}
        members={feed.memberships.map((m) => ({
          id: m.userId,
          username: m.user.username,
          globalRole: m.user.role,
          feedRole: m.role,
        }))}
        candidates={candidates}
      />
    </div>
  );
}
