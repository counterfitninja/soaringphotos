import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { db } from "@/lib/db";
import { membershipFeedIds, requireFeedContext } from "@/lib/feed-context";
import { postInclude } from "@/lib/types";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFeedContext();
  const { id } = await params;
  const feedIds = membershipFeedIds(ctx);

  const [post, members] = await Promise.all([
    db.post.findUnique({ where: { id }, include: postInclude }),
    db.user.findMany({
      where: { id: { not: ctx.user.id }, feedMemberships: { some: { feedId: { in: feedIds } } } },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);
  // 404 when the post is missing OR belongs to a feed the viewer can't see (FR-010).
  if (!post || !feedIds.includes(post.feedId)) notFound();

  return <PostCard post={post} currentUserId={ctx.user.id} members={members} showAllComments showFeedLabel />;
}
