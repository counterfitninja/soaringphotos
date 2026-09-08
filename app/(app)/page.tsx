import Link from "next/link";
import PostCard from "@/components/PostCard";
import { db } from "@/lib/db";
import { membershipFeedIds, requireFeedContext } from "@/lib/feed-context";
import { postInclude } from "@/lib/types";

const PAGE_SIZE = 10;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireFeedContext();
  const { user, memberships, activeFeedId, viewMode } = ctx;
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  if (memberships.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="mb-2 text-lg font-medium">No feeds yet</p>
        <p className="text-sm text-neutral-500">
          You haven't been added to any feeds yet. Ask your family admin for an invite.
        </p>
      </div>
    );
  }

  const feedIds = membershipFeedIds(ctx);
  // Amalgamated view ("all") merges every feed; otherwise scope to the active feed.
  const where = viewMode === "all" ? { feedId: { in: feedIds } } : { feedId: activeFeedId! };

  const [posts, total, members] = await Promise.all([
    db.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.post.count({ where }),
    // Mention targets are limited to members of the visible feed(s).
    db.user.findMany({
      where: { id: { not: user.id }, feedMemberships: { some: { feedId: { in: feedIds } } } },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {posts.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="mb-2 text-lg font-medium">No posts yet</p>
          <p className="text-sm text-neutral-500">
            Be the first to{" "}
            <Link href="/create" className="text-sky-600 underline">
              share a photo or video
            </Link>
            !
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={user.id}
          members={members}
          showFeedLabel={viewMode === "all"}
        />
      ))}

      {totalPages > 1 && (
        <div className="flex justify-between pb-4 text-sm">
          {pageNum > 1 ? (
            <Link href={`/?page=${pageNum - 1}`} className="text-sky-600 hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-400">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages ? (
            <Link href={`/?page=${pageNum + 1}`} className="text-sky-600 hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
