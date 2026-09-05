"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btnPrimary, inputCls } from "@/lib/ui";
import {
  MAX_IMAGES_PER_POST,
  MAX_VIDEO_SECONDS,
  VIDEO_TYPES,
  isVideo,
  validateMediaFiles,
} from "@/lib/validation";

export default function UploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Build / clean up object URLs for previews.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function checkVideoDuration(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration <= MAX_VIDEO_SECONDS + 1);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(true); // if we can't read metadata, don't block the upload
      };
      video.src = url;
    });
  }

  async function onSelect(list: FileList | null) {
    setError(null);
    if (!list) return;
    const selected = Array.from(list);

    const check = validateMediaFiles(selected);
    if (check.error) {
      setError(check.error);
      return;
    }
    const video = selected.find((f) => isVideo(f));
    if (video && !(await checkVideoDuration(video))) {
      setError(`Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter.`);
      return;
    }
    setFiles(selected);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError("Please select at least one image or a video.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("caption", caption);
      for (const f of files) form.append("media", f);

      const res = await fetch("/api/posts", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          <span className="mb-1 block text-2xl">📷</span>
          <p className="mb-3">
            {files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
              : "Choose photos/video from your library, or take a new one"}
          </p>
          <div className="flex justify-center gap-2">
            <label
              htmlFor="media-library"
              className="cursor-pointer rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Choose from Library
            </label>
            <label
              htmlFor="media-camera"
              className="cursor-pointer rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
            >
              Take Photo/Video
            </label>
          </div>
        </div>
        <input
          id="media-library"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => onSelect(e.target.files)}
        />
        <input
          id="media-camera"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          capture="environment"
          className="hidden"
          onChange={(e) => onSelect(e.target.files)}
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Up to {MAX_IMAGES_PER_POST} images (10 MB each) or 1 video up to {MAX_VIDEO_SECONDS}s /
          100 MB. Selecting a video replaces any other files.
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) =>
            isVideo(files[i]) ? (
              <video
                key={src}
                src={src}
                muted
                className="aspect-square w-full rounded-lg object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
            ),
          )}
        </div>
      )}

      <div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Write a short description about your photo…"
          className={inputCls}
        />
        <p className="mt-1 text-right text-xs text-neutral-400">{caption.length}/500</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={uploading} className={btnPrimary}>
        {uploading ? "Uploading…" : "Share with family"}
      </button>
    </form>
  );
}
