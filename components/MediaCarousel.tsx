"use client";

import { useState } from "react";

interface MediaItem {
  id: string;
  key: string;
  mimeType: string;
}

export default function MediaCarousel({ media }: { media: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  if (media.length === 0) return null;

  const current = media[Math.min(index, media.length - 1)];
  const isVideo = current.mimeType.startsWith("video/");

  return (
    <div className="relative aspect-square select-none bg-black">
      {isVideo ? (
        <video
          key={current.id}
          src={`/api/media/${current.key}`}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.id}
          src={`/api/media/${current.key}`}
          alt=""
          className="h-full w-full object-contain"
        />
      )}

      {media.length > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setIndex(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1 text-lg text-white hover:bg-black/70"
            >
              ‹
            </button>
          )}
          {index < media.length - 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setIndex(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2.5 py-1 text-lg text-white hover:bg-black/70"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {media.map((m, i) => (
              <span
                key={m.id}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
