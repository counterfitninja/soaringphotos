import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPostNotifications } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import { saveMedia } from "@/lib/storage";
import { toRequestUrl } from "@/lib/request-url";
import { captionSchema, validateMediaFiles } from "@/lib/validation";

/**
 * POST /api/share-target — Web Share Target endpoint declared in the manifest.
 * Lets installed-as-PWA users share images/video from another app (e.g. Google
 * Photos) straight into a new post. The OS share sheet performs a top-level
 * POST navigation here, so every outcome is a redirect (never a JSON body).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.redirect(toRequestUrl(req, "/login"), 303);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.redirect(toRequestUrl(req, "/create?error=Shared+content+was+invalid."), 303);
  }

  const files = form.getAll("media").filter((f): f is File => f instanceof File && f.size > 0);
  const mediaCheck = validateMediaFiles(files);
  if (mediaCheck.error) {
    return NextResponse.redirect(
      toRequestUrl(req, `/create?error=${encodeURIComponent(mediaCheck.error)}`),
      303,
    );
  }

  const sharedText = String(form.get("text") ?? form.get("title") ?? "").trim().slice(0, 500);
  const captionCheck = captionSchema.safeParse(sharedText);
  const caption = captionCheck.success ? captionCheck.data : "";

  const post = await db.post.create({
    data: { authorId: session.userId, caption },
  });

  try {
    for (const [index, file] of files.entries()) {
      const { key, mimeType } = await saveMedia(file);
      await db.media.create({ data: { postId: post.id, key, mimeType, order: index } });
    }
  } catch (err) {
    console.error("Failed to store shared media, rolling back post", err);
    await db.post.delete({ where: { id: post.id } }).catch(() => {});
    return NextResponse.redirect(
      toRequestUrl(req, "/create?error=Upload+failed.+Please+try+again."),
      303,
    );
  }

  await createPostNotifications({ postId: post.id, authorId: session.userId, caption });

  return NextResponse.redirect(toRequestUrl(req, `/post/${post.id}`), 303);
}
