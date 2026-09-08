import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMedia } from "@/lib/storage";

/**
 * GET /api/media/[key] — serves uploaded media to signed-in members only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await getSession();
  if (!session.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { key } = await params;
  // Keys are generated as <uuid>.<ext>; validate to prevent path traversal.
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
    return new NextResponse("Invalid key", { status: 400 });
  }

  const [media, avatar] = await Promise.all([
    db.media.findFirst({ where: { key }, select: { mimeType: true } }),
    db.user.findFirst({ where: { avatarKey: key }, select: { avatarMimeType: true } }),
  ]);
  const mimeType = media?.mimeType ?? avatar?.avatarMimeType;
  if (!mimeType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await getMedia(key);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(file.body as BodyInit, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
