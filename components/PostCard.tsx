import Link from "next/link";
import CommentForm from "@/components/CommentForm";
import DeletePostButton from "@/components/DeletePostButton";
import LikeButton from "@/components/LikeButton";
import MediaCarousel from "@/components/MediaCarousel";
import ShareDialog from "@/components/ShareDialog";
import type { MemberOption, PostWithRelations } from "@/lib/types";
import { initials, timeAgo } from "@/lib/utils";

export default function PostCard({
  post,
  currentUserId,
  members,
  showAllComments = false,
}: {
  post: PostWithRelations;
  currentUserId: string;
  members: MemberOption[];
  showAllComments?: boolean;
}) {
  const liked = post.likes.some((l) => l.userId === currentUserId);
  const comments = showAllComments ? post.comments : post.comments.slice(-3);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="flex items-center gap-3 p-4">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-xs font-bold text-sky-700"
        >
          {post.author.avatarKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${post.author.avatarKey}`}
              alt={`${post.author.username}'s profile photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(post.author.username)
          )}
        </Link>
        <div>
          <Link
            href={`/profile/${post.author.username}`}
            className="text-sm font-semibold hover:underline"
          >
            {post.author.username}
          </Link>
          <p className="text-xs text-neutral-400">{timeAgo(post.createdAt)}</p>
        </div>
        {post.author.id === currentUserId && <DeletePostButton postId={post.id} />}
      </header>

      <MediaCarousel media={post.media} />

      <div className="flex items-center gap-4 px-4 pt-3">
        <LikeButton postId={post.id} liked={liked} count={post._count.likes} />
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1 text-sm text-neutral-600 hover:text-sky-700"
        >
          💬 {post._count.comments}
        </Link>
        <ShareDialog postId={post.id} members={members} />
      </div>

      <div className="space-y-1.5 p-4 pt-2">
        {post.caption && (
          <p className="text-sm">
            <Link
              href={`/profile/${post.author.username}`}
              className="mr-1.5 font-semibold hover:underline"
            >
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {!showAllComments && post._count.comments > 3 && (
          <Link href={`/post/${post.id}`} className="block text-xs text-neutral-400 hover:underline">
            View all {post._count.comments} comments
          </Link>
        )}

        {comments.map((comment) => (
          <p key={comment.id} className="text-sm">
            <Link
              href={`/profile/${comment.author.username}`}
              className="mr-1.5 font-semibold hover:underline"
            >
              {comment.author.username}
            </Link>
            {comment.text}
          </p>
        ))}

        <CommentForm postId={post.id} members={members} />
      </div>
    </article>
  );
}
