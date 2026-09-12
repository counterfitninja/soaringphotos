"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface PostMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  authorUsername?: string;
}

export default function PostMapModal({
  isOpen,
  onClose,
  latitude,
  longitude,
  locationName,
  authorUsername,
}: PostMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "post-map-marker",
      html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-base text-white shadow-md border-2 border-white">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);

    const popupContent = `
      <div class="text-xs p-1">
        ${locationName ? `<p class="font-semibold text-neutral-800">${locationName}</p>` : ""}
        ${authorUsername ? `<p class="text-neutral-500">Photo by @${authorUsername}</p>` : ""}
        <p class="text-[10px] text-neutral-400 mt-0.5">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</p>
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();

    // Invalidate size once modal animation finishes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude, locationName, authorUsername]);

  if (!isOpen) return null;

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="truncate text-sm font-semibold text-neutral-800">
              {locationName || "Photo Location"}
            </h3>
            <p className="text-xs text-neutral-400">
              {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close map"
          >
            ✕
          </button>
        </div>

        <div className="relative h-72 w-full bg-neutral-100 sm:h-80">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-2.5">
          <a
            href={externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Open in Google Maps ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
