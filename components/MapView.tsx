"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { GeotaggedPostItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface MapViewProps {
  posts: GeotaggedPostItem[];
  selectedPostId?: string | null;
}

export default function MapView({ posts, selectedPostId }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter: [number, number] =
      posts.length > 0 ? [posts[0].latitude, posts[0].longitude] : [39.8283, -98.5795]; // US center default

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: posts.length > 0 ? 5 : 4,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "all-photos-map-pin",
      html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-base text-white shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const markers: L.Marker[] = [];
    const bounds = L.latLngBounds([]);

    for (const post of posts) {
      const latLng: [number, number] = [post.latitude, post.longitude];
      bounds.extend(latLng);

      const marker = L.marker(latLng, { icon: pinIcon }).addTo(map);

      const photoThumb = post.media?.[0]?.key
        ? `<div class="mt-1.5 overflow-hidden rounded-lg bg-neutral-100 max-h-32">
             <img src="/api/media/${post.media[0].key}" alt="Thumbnail" class="w-full h-28 object-cover rounded-md" />
           </div>`
        : "";

      const popupHtml = `
        <div class="min-w-[180px] max-w-[220px] p-0.5 font-sans">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-xs text-neutral-800">@${post.author.username}</span>
            <span class="text-[10px] text-neutral-400">${formatDateTime(new Date(post.createdAt))}</span>
          </div>
          ${
            post.locationName
              ? `<p class="mt-0.5 text-xs text-sky-700 font-medium truncate">📍 ${post.locationName}</p>`
              : ""
          }
          ${photoThumb}
          ${
            post.caption
              ? `<p class="mt-1.5 text-xs text-neutral-700 line-clamp-2">${escapeHtml(
                  post.caption,
                )}</p>`
              : ""
          }
          <div class="mt-2 text-right">
            <a href="/post/${post.id}" class="inline-block rounded-md bg-sky-600 px-2.5 py-1 text-center text-xs font-medium text-white hover:bg-sky-700">
              View Post →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 240 });
      markers.push(marker);

      if (selectedPostId && post.id === selectedPostId) {
        marker.openPopup();
      }
    }

    if (posts.length > 1 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (posts.length === 1) {
      map.setView([posts[0].latitude, posts[0].longitude], 13);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [posts, selectedPostId]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-sm border border-neutral-200">
      <div ref={mapContainerRef} className="h-full w-full min-h-[450px]" />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
