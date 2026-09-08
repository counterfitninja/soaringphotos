"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchFeed } from "@/app/actions/feeds";
import { ALL_FEEDS } from "@/lib/validation";

export interface SwitcherFeed {
  feedId: string;
  feedName: string;
  unread: number;
}

/**
 * Feed selector shown in the navbar/tab bar. With a single membership it
 * renders as a static label (FR-016). With multiple, it offers each feed plus
 * the amalgamated "All feeds" view (when enabled), with per-feed unread badges.
 */
export default function FeedSwitcher({
  feeds,
  activeFeedId,
  viewMode,
  allFeedsEnabled = false,
}: {
  feeds: SwitcherFeed[];
  activeFeedId: string | null;
  viewMode: "feed" | "all";
  allFeedsEnabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (feeds.length === 0) return null;

  // Single-feed members see a static label — today's UI, unchanged.
  if (feeds.length === 1) {
    return (
      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
        {feeds[0].feedName}
      </span>
    );
  }

  const value = viewMode === "all" ? ALL_FEEDS : (activeFeedId ?? feeds[0].feedId);
  const unreadByFeed = new Map(feeds.map((f) => [f.feedId, f.unread]));

  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label="Choose feed"
        className="appearance-none rounded-full bg-sky-50 py-1 pl-3 pr-7 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const target = e.target.value;
          setError(null);
          startTransition(async () => {
            const result = await switchFeed(target);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {feeds.map((feed) => (
          <option key={feed.feedId} value={feed.feedId}>
            {feed.feedName}
            {(unreadByFeed.get(feed.feedId) ?? 0) > 0 ? ` (${unreadByFeed.get(feed.feedId)})` : ""}
          </option>
        ))}
        {allFeedsEnabled && <option value={ALL_FEEDS}>All feeds</option>}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-sky-500">▼</span>
      {error && <span className="sr-only" role="alert">{error}</span>}
    </span>
  );
}
