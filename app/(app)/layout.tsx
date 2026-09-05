import MobileTabBar from "@/components/MobileTabBar";
import Navbar from "@/components/Navbar";
import PushNotifications from "@/components/PushNotifications";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unreadShares, unreadNotifications] = await Promise.all([
    db.sharedPost.count({
      where: { toUserId: user.id, readAt: null },
    }),
    db.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar
        username={user.username}
        role={user.role}
        unreadShares={unreadShares}
        unreadNotifications={unreadNotifications}
      />
      <main className="mx-auto max-w-xl px-4 py-6 pb-20 lg:max-w-6xl sm:pb-6">{children}</main>
      <PushNotifications />
      <MobileTabBar />
    </div>
  );
}
