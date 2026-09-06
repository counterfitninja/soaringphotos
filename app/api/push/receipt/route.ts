import { NextResponse } from "next/server";
import { z } from "zod";

const receiptSchema = z.object({
  serviceWorkerVersion: z.string().max(80).optional(),
  receivedAt: z.string().max(64),
  title: z.string().max(120),
  body: z.string().max(240),
  tag: z.string().max(120).nullable(),
  url: z.string().max(512),
});

function isPushDebugEnabled() {
  return process.env.PUSH_DEBUG?.trim().replace(/^["']|["']$/g, "").toLowerCase() === "true";
}

export async function POST(request: Request) {
  const parsed = receiptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push receipt." }, { status: 400 });

  if (isPushDebugEnabled()) {
    const userAgent = request.headers.get("user-agent")?.slice(0, 160) ?? null;
    console.log("[push] client received remote push", { ...parsed.data, userAgent });
  }

  return NextResponse.json({ ok: true });
}