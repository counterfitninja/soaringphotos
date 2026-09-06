import Link from "next/link";
import { setUserNotificationMute } from "@/app/actions/notifications";
import PushSubscriptionControl from "@/components/PushSubscriptionControl";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const [otherUsers, mutes] = await Promise.all([
    db.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
    db.notificationMute.findMany({ where: { userId: user.id }, select: { mutedUserId: true } }),
  ]);
  const mutedUserIds = new Set(mutes.map((mute) => mute.mutedUserId));

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Alerts</p>
            <h1 className="mt-1 text-xl font-bold text-neutral-900">Notification settings</h1>
          </div>
          <Link
            href="/notifications"
            className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            Back
          </Link>
        </div>
      </div>

      <PushSubscriptionControl />

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-neutral-600">
          Choose which family members you get notified about when they post. You&apos;ll still get notified any time
          someone @mentions you, even if you turn off their posts.
        </p>
      </div>

      {otherUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-neutral-500">No other members yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {otherUsers.map((otherUser) => {
            const isMuted = mutedUserIds.has(otherUser.id);
            const toggleMute = async () => {
              "use server";
              await setUserNotificationMute(otherUser.id, !isMuted);
            };
            return (
              <li
                key={otherUser.id}
                className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white p-3.5 shadow-sm"
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-neutral-800">{otherUser.username}</span>
                  <p className="text-[11px] text-neutral-500">
                    {isMuted ? "Muted" : "Alerts enabled"}
                  </p>
                </div>
                <form action={toggleMute}>
                  <button
                    type="submit"
                    className={`relative h-7 w-12 rounded-full border transition ${
                      isMuted
                        ? "border-neutral-300 bg-neutral-200"
                        : "border-sky-300 bg-sky-500 shadow-sm shadow-sky-200"
                    }`}
                    aria-pressed={!isMuted}
                    aria-label={`${isMuted ? "Enable" : "Disable"} notifications from ${otherUser.username}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        isMuted ? "left-1" : "left-6"
                      }`}
                    />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
