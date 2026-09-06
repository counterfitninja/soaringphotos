import { z } from "zod";

// ---------- auth ----------

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers and underscores"),
  email: z.string().email("Enter a valid email address").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

// ---------- posts ----------

export const captionSchema = z.string().max(500, "Captions are limited to 500 characters");

export const commentSchema = z.string().trim().min(1).max(500);

// ---------- media ----------

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const MAX_IMAGES_PER_POST = 10;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
export const MAX_VIDEO_SECONDS = 60; // enforced client-side when picking the file

export function isImage(file: { type: string }) {
  return IMAGE_TYPES.includes(file.type);
}

export function isVideo(file: { type: string }) {
  return VIDEO_TYPES.includes(file.type);
}

/**
 * Validates the media selection for a post:
 * either 1-10 images, or exactly 1 short video. Used on both client and server.
 */
export function validateMediaFiles(files: { type: string; size: number }[]): { error?: string } {
  if (files.length === 0) {
    return { error: "Please select at least one image or a video." };
  }
  const images = files.filter(isImage);
  const videos = files.filter(isVideo);
  if (images.length + videos.length !== files.length) {
    return { error: "Unsupported file type. Use JPG, PNG, WebP or GIF images, or an MP4/WebM/MOV video." };
  }
  if (videos.length > 0) {
    if (files.length > 1) {
      return { error: "A post can contain either up to 10 images or a single video." };
    }
    if (videos[0].size > MAX_VIDEO_SIZE) {
      return { error: "The video is too large (max 100 MB)." };
    }
  } else {
    if (images.length > MAX_IMAGES_PER_POST) {
      return { error: `You can upload at most ${MAX_IMAGES_PER_POST} images per post.` };
    }
    for (const img of images) {
      if (img.size > MAX_IMAGE_SIZE) {
        return { error: "Each image must be smaller than 10 MB." };
      }
    }
  }
  return {};
}
