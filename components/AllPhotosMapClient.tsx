"use client";

import dynamic from "next/dynamic";
import type { GeotaggedPostItem } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400">
      Loading photo map...
    </div>
  ),
});

export default function AllPhotosMapClient({ posts }: { posts: GeotaggedPostItem[] }) {
  return (
    <div className="h-[520px] w-full">
      <MapView posts={posts} />
    </div>
  );
}
