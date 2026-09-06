import Link from "next/link";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    include: {
      actor: { select: { username: true } },
      post: { include: { media: { orderBy: { order: "asc" }, take: 1 } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Family feed</p>
            <h1 className="mt-1 text-xl font-bold text-neutral-900">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications/settings"
              className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Settings
            </Link>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead}>
                <button className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700">
                  Mark all read
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-700">
            ✨
          </div>
          <p className="text-sm font-medium text-neutral-700">Nothing new yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            New family posts and captions that tag you will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const media = notification.post.media[0];
            const isVideo = media?.mimeType.startsWith("video/");
            const actionLabel =
              notification.type === "mention" ? "mentioned you" : "shared a new post";

            return (
              <li key={notification.id}>
                <Link
                  href={`/post/${notification.postId}`}
                  className={`group flex gap-3 rounded-3xl border bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    notification.readAt
                      ? "border-neutral-200"
                      : "border-sky-200 bg-sky-50/60 ring-1 ring-sky-200"
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-200">
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
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        ▶
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm leading-5 text-neutral-800">
                        <span className="font-semibold text-neutral-900">{notification.actor.username}</span>{" "}
                        <span>{actionLabel}</span>
                      </p>
                      {!notification.readAt && (
                        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                          New
                        </span>
                      )}
                    </div>

                    {notification.post.caption && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                        {notification.post.caption}
                      </p>
                    )}

                    <p className="mt-2 text-[11px] font-medium text-neutral-400">
                      {timeAgo(notification.createdAt)}
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