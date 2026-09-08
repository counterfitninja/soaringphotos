import { db } from "@/lib/db";
import { membershipFeedIds, requireFeedContext } from "@/lib/feed-context";
import SearchUsers from "@/components/SearchUsers";

export default async function SearchPage() {
  const ctx = await requireFeedContext();
  const feedIds = membershipFeedIds(ctx);

  // Only users sharing at least one feed with the searcher are discoverable (FR-010).
  const users = await db.user.findMany({
    where: { id: { not: ctx.user.id }, feedMemberships: { some: { feedId: { in: feedIds } } } },
    select: { username: true, _count: { select: { posts: { where: { feedId: { in: feedIds } } } } } },
    orderBy: { username: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Search</h1>
      <SearchUsers users={users.map((u) => ({ username: u.username, postCount: u._count.posts }))} />
    </div>
  );
}
