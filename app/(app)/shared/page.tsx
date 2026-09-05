import Link from "next/link";
import { markAllSharesRead } from "@/app/actions/shares";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export default async function SharedPage() {
  const user = await requireUser();
  const shares = await db.sharedPost.findMany({
    where: { toUserId: user.id },
    include: {
      fromUser: { select: { username: true } },
      post: {
        include: {
          author: { select: { username: true } },
          media: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = shares.filter((s) => !s.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Shared with me</h1>
        {unreadCount > 0 && (
          <form action={markAllSharesRead}>
            <button className="text-sm text-sky-600 hover:underline">Mark all read</button>
          </form>
        )}
      </div>

      {shares.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-neutral-500">
            Nothing here yet. When a family member forwards a post to you, it will appear
            here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shares.map((share) => {
            const media = share.post.media[0];
            const isVideo = media?.mimeType.startsWith("video/");
            return (
              <li key={share.id}>
                <Link
                  href={`/post/${share.post.id}`}
                  className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow ${
                    share.readAt ? "" : "ring-2 ring-sky-400"
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                    {media &&
                      (isVideo ? (
                        <video
                          src={`/api/media/${media.key}`}
                          muted
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/media/${media.key}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ))}
                    {isVideo && (
                      <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                        ▶
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{share.fromUser.username}</span>{" "}
                      shared a post by{" "}
                      <span className="font-semibold">{share.post.author.username}</span>
                    </p>
                    {share.message && (
                      <p className="mt-0.5 truncate text-sm text-neutral-500">
                        “{share.message}”
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-400">
                      {timeAgo(share.createdAt)}
                      {!share.readAt && <span className="ml-2 font-medium text-sky-600">New</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
