import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postInclude } from "@/lib/types";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [post, members] = await Promise.all([
    db.post.findUnique({ where: { id }, include: postInclude }),
    db.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);
  if (!post) notFound();

  return <PostCard post={post} currentUserId={user.id} members={members} showAllComments />;
}
