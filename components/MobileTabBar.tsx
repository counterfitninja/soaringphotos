"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FeedSwitcher, { type SwitcherFeed } from "@/components/FeedSwitcher";

const tabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/create", label: "Post", icon: "➕" },
  { href: "/map", label: "Map", icon: "🗺️" },
  { href: "/search", label: "Search", icon: "🔍" },
];

export default function MobileTabBar({
  feeds,
  activeFeedId,
  viewMode,
}: {
  feeds?: SwitcherFeed[];
  activeFeedId?: string | null;
  viewMode?: "feed" | "all";
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:hidden">
      {feeds && feeds.length > 1 && (
        <div className="flex justify-center border-b border-neutral-100 px-4 py-1.5">
          <FeedSwitcher feeds={feeds} activeFeedId={activeFeedId ?? null} viewMode={viewMode ?? "feed"} allFeedsEnabled />
        </div>
      )}
      <div className="mx-auto flex max-w-xl items-center justify-around">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                active ? "text-sky-600" : "text-neutral-500"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
