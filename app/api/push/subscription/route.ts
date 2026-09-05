import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPushPublicKey, isPushConfigured } from "@/lib/push";
import { getSession } from "@/lib/session";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});

async function getUserId() {
  const session = await getSession();
  return session.userId;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const subscribed =
    (await db.pushSubscription.count({ where: { userId } })) > 0;
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: getPushPublicKey() ?? null,
    subscribed,
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });

  const subscription = parsed.data;
  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
    },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint = z.string().url().max(2048).safeParse(body?.endpoint);
  if (!endpoint.success) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });

  await db.pushSubscription.deleteMany({ where: { userId, endpoint: endpoint.data } });
  return NextResponse.json({ ok: true });
}
