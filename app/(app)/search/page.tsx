import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SearchUsers from "@/components/SearchUsers";

export default async function SearchPage() {
  const user = await requireUser();

  const users = await db.user.findMany({
    where: { id: { not: user.id } },
    select: { username: true, _count: { select: { posts: true } } },
    orderBy: { username: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Search</h1>
      <SearchUsers users={users.map((u) => ({ username: u.username, postCount: u._count.posts }))} />
    </div>
  );
}
