import Link from "next/link";
import AllPhotosMapClient from "@/components/AllPhotosMapClient";
import { db } from "@/lib/db";
import { membershipFeedIds, requireFeedContext } from "@/lib/feed-context";
import type { GeotaggedPostItem } from "@/lib/types";
import { MAP_LIMIT_DEFAULT, MAP_LIMIT_PRESETS } from "@/lib/validation";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const ctx = await requireFeedContext();
  const { memberships, activeFeedId, viewMode } = ctx;
  const { limit: queryLimit } = await searchParams;

  const currentLimit = Math.min(
    500,
    Math.max(1, Number.parseInt(queryLimit ?? `${MAP_LIMIT_DEFAULT}`, 10) || MAP_LIMIT_DEFAULT),
  );

  if (memberships.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="mb-2 text-lg font-medium">No feeds yet</p>
        <p className="text-sm text-neutral-500">
          You haven't been added to any feeds yet.
        </p>
      </div>
    );
  }

  const feedIds = membershipFeedIds(ctx);
  const where = {
    feedId: viewMode === "all" ? { in: feedIds } : activeFeedId!,
    latitude: { not: null },
    longitude: { not: null },
  };

  const rawPosts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: currentLimit,
    select: {
      id: true,
      caption: true,
      createdAt: true,
      latitude: true,
      longitude: true,
      locationName: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarKey: true,
        },
      },
      feed: {
        select: {
          id: true,
          name: true,
        },
      },
      media: {
        select: {
          key: true,
          mimeType: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  const posts: GeotaggedPostItem[] = rawPosts.map((p) => ({
    ...p,
    latitude: p.latitude as number,
    longitude: p.longitude as number,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-neutral-800">🗺️ Family Photo Map</h1>
          <p className="text-xs text-neutral-500">
            {posts.length > 0
              ? `Showing ${posts.length} recent geotagged photo${posts.length === 1 ? "" : "s"}`
              : "Explore photo locations across the family"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-neutral-500">Show:</span>
          {MAP_LIMIT_PRESETS.map((preset) => (
            <Link
              key={preset}
              href={`/map?limit=${preset}`}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                currentLimit === preset
                  ? "bg-sky-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {preset}
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="mb-2 text-lg font-medium text-neutral-800">No geotagged photos yet</p>
          <p className="text-sm text-neutral-500">
            When photos with EXIF GPS coordinates are uploaded, they will appear on this interactive map.
          </p>
          <div className="mt-4">
            <Link
              href="/create"
              className="inline-block rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              + Share a Photo
            </Link>
          </div>
        </div>
      ) : (
        <AllPhotosMapClient posts={posts} />
      )}
    </div>
  );
}
