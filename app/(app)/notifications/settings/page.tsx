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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Notification settings</h1>
        <Link href="/notifications" className="text-sm text-sky-600 hover:underline">
          Back
        </Link>
      </div>

      <PushSubscriptionControl />

      <p className="text-sm text-neutral-500">
        Choose which family members you get notified about when they post. You&apos;ll still get notified any time
        someone @mentions you, even if you turn off their posts.
      </p>

      {otherUsers.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-neutral-500">No other members yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-2xl bg-white shadow-sm">
          {otherUsers.map((otherUser) => {
            const isMuted = mutedUserIds.has(otherUser.id);
            const toggleMute = async () => {
              "use server";
              await setUserNotificationMute(otherUser.id, !isMuted);
            };
            return (
              <li key={otherUser.id} className="flex items-center justify-between gap-3 p-4">
                <span className="text-sm font-medium">{otherUser.username}</span>
                <form action={toggleMute}>
                  <button
                    type="submit"
                    className={`relative h-6 w-11 rounded-full transition ${
                      isMuted ? "bg-neutral-300" : "bg-sky-600"
                    }`}
                    aria-pressed={!isMuted}
                    aria-label={`${isMuted ? "Enable" : "Disable"} notifications from ${otherUser.username}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        isMuted ? "left-0.5" : "left-5"
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
