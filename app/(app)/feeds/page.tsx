import Link from "next/link";
import { redirect } from "next/navigation";
import { createFeed } from "@/app/actions/feeds";
import { db } from "@/lib/db";
import { requireFeedContext } from "@/lib/feed-context";
import { btnPrimary, inputCls } from "@/lib/ui";

export default async function FeedsPage() {
  const ctx = await requireFeedContext();
  const isAdmin = ctx.user.role === "admin";

  // Managers see only the feeds they manage; the admin sees all feeds.
  const manageableFeedIds = ctx.memberships
    .filter((m) => m.role === "manager")
    .map((m) => m.feedId);
  if (!isAdmin && manageableFeedIds.length === 0) redirect("/");

  const feeds = await db.feed.findMany({
    where: isAdmin ? {} : { id: { in: manageableFeedIds } },
    include: { _count: { select: { memberships: true, posts: true } } },
    orderBy: { name: "asc" },
  });

  async function create(formData: FormData) {
    "use server";
    const { revalidatePath } = await import("next/cache");
    await createFeed({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    revalidatePath("/feeds");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Feeds</h1>

      {isAdmin && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold">Create a feed</h2>
          <p className="mt-1 text-xs text-neutral-500">
            A feed is a private space with its own posts and members. You'll manage it and can
            appoint other managers.
          </p>
          <form action={create} className="mt-4 space-y-3">
            <input name="name" required maxLength={50} placeholder="Feed name (e.g. Friends)" className={inputCls} />
            <input name="description" maxLength={200} placeholder="Description (optional)" className={inputCls} />
            <button className={btnPrimary}>Create feed</button>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {feeds.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">You don't manage any feeds yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {feeds.map((feed) => (
              <li key={feed.id}>
                <Link
                  href={`/feeds/${feed.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{feed.name}</p>
                    {feed.description && (
                      <p className="truncate text-xs text-neutral-500">{feed.description}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-xs text-neutral-400">
                    {feed._count.memberships} {feed._count.memberships === 1 ? "member" : "members"} ·{" "}
                    {feed._count.posts} {feed._count.posts === 1 ? "post" : "posts"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
