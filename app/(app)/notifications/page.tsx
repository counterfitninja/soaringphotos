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
      <div className="rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-4 shadow-[0_18px_40px_-28px_rgba(14,116,144,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-600">
                Family feed
              </p>
            </div>
            <h1 className="mt-2 text-xl font-bold text-neutral-900">Notifications</h1>
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
                  {unreadCount > 1 ? `${unreadCount} unread` : "Mark all read"}
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
                  className={`group relative flex gap-3 overflow-hidden rounded-[26px] border bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    notification.readAt
                      ? "border-neutral-200"
                      : "border-sky-200 bg-sky-50/75 ring-1 ring-sky-100"
                  }`}
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 to-indigo-500 opacity-80" />
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 via-neutral-100 to-indigo-100">
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
                    <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[10px] font-bold text-sky-700 shadow-sm">
                      {notification.type === "mention" ? "@" : "•"}
                    </span>
                    {isVideo && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        ▶
                      </span>
                    )}
                  </div>

                  <div className="relative min-w-0 flex-1 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-5 text-neutral-800">
                        <span className="font-semibold text-neutral-900">{notification.actor.username}</span>{" "}
                        <span>{actionLabel}</span>
                      </p>
                      {!notification.readAt && (
                        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                          New
                        </span>
                      )}
                    </div>

                    {notification.post.caption && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                        {notification.post.caption}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] font-medium text-neutral-400">{timeAgo(notification.createdAt)}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        View
                      </span>
                    </div>
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