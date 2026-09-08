import MobileTabBar from "@/components/MobileTabBar";
import Navbar from "@/components/Navbar";
import PushNotifications from "@/components/PushNotifications";
import { db } from "@/lib/db";
import { requireFeedContext } from "@/lib/feed-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireFeedContext();
  const { user, memberships, activeFeedId, viewMode } = ctx;
  const feedIds = memberships.map((m) => m.feedId);

  const [unreadShares, unreadNotifications, unreadByFeed] = await Promise.all([
    db.sharedPost.count({
      where: { toUserId: user.id, readAt: null },
    }),
    db.notification.count({
      where: { userId: user.id, readAt: null, feedId: { in: feedIds } },
    }),
    // Per-feed unread counts power the switcher badges (FR-014b).
    db.notification.groupBy({
      by: ["feedId"],
      where: { userId: user.id, readAt: null, feedId: { in: feedIds } },
      _count: { _all: true },
    }),
  ]);
  const unreadCountByFeed = new Map(unreadByFeed.map((row) => [row.feedId, row._count._all]));
  const switcherFeeds = memberships.map((m) => ({
    feedId: m.feedId,
    feedName: m.feedName,
    unread: unreadCountByFeed.get(m.feedId) ?? 0,
  }));

  return (
    <div className="min-h-screen">
      <Navbar
        username={user.username}
        role={user.role}
        unreadShares={unreadShares}
        unreadNotifications={unreadNotifications}
        feeds={switcherFeeds}
        activeFeedId={activeFeedId}
        viewMode={viewMode}
        managesAnyFeed={user.role === "admin" || memberships.some((m) => m.role === "manager")}
      />
      <main className="mx-auto max-w-xl px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:max-w-6xl sm:pb-6">
        {children}
      </main>
      <PushNotifications />
      <MobileTabBar feeds={switcherFeeds} activeFeedId={activeFeedId} viewMode={viewMode} />
    </div>
  );
}
