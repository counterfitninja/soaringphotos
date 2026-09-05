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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Notifications</h1>
        <div className="flex items-center gap-3">
          <Link href="/notifications/settings" className="text-sm text-sky-600 hover:underline">
            Settings
          </Link>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button className="text-sm text-sky-600 hover:underline">Mark all read</button>
            </form>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-neutral-500">
            No notifications yet. New family posts and captions that tag you will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const media = notification.post.media[0];
            const isVideo = media?.mimeType.startsWith("video/");
            return (
              <li key={notification.id}>
                <Link
                  href={`/post/${notification.postId}`}
                  className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow ${
                    notification.readAt ? "" : "ring-2 ring-sky-400"
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
                      <span className="font-semibold">{notification.actor.username}</span>{" "}
                      {notification.type === "mention" ? "mentioned you" : "added a new post"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {timeAgo(notification.createdAt)}
                      {!notification.readAt && (
                        <span className="ml-2 font-medium text-sky-600">New</span>
                      )}
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