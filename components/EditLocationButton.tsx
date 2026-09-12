"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePostLocation } from "@/app/actions/posts";
import { btnPrimary, inputCls } from "@/lib/ui";

export default function EditLocationButton({
  postId,
  latitude,
  longitude,
}: {
  postId: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [lat, setLat] = useState(latitude !== null ? String(latitude) : "");
  const [lng, setLng] = useState(longitude !== null ? String(longitude) : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const parsedLat = lat.trim() === "" ? null : Number(lat);
    const parsedLng = lng.trim() === "" ? null : Number(lng);
    if ((parsedLat === null) !== (parsedLng === null)) {
      setError("Enter both latitude and longitude, or leave both blank to clear.");
      return;
    }
    if (parsedLat !== null && Number.isNaN(parsedLat)) {
      setError("Latitude must be a number.");
      return;
    }
    if (parsedLng !== null && Number.isNaN(parsedLng)) {
      setError("Longitude must be a number.");
      return;
    }

    startTransition(async () => {
      const result = await updatePostLocation(postId, parsedLat, parsedLng);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
        title="Admin: edit photo location"
      >
        <span>✏️</span>
        <span className="hidden sm:inline">Edit location</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="mb-1 text-sm font-semibold text-neutral-800">Edit photo location</h2>
            <p className="mb-3 text-xs text-neutral-500">
              Set coordinates manually, or leave both blank to remove this photo from the map.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Latitude (-90 to 90)"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className={inputCls}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Longitude (-180 to 180)"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className={inputCls}
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={isPending} className={btnPrimary}>
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
