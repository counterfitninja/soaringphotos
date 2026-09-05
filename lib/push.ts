import webpush from "web-push";
import { db } from "@/lib/db";

// Some hosting UIs store env values with surrounding quotes/whitespace; strip those defensively.
function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^["']|["']$/g, "");
}

const publicKey = cleanEnv(process.env.VAPID_PUBLIC_KEY);
const privateKey = cleanEnv(process.env.VAPID_PRIVATE_KEY);
const configuredSubject = cleanEnv(process.env.VAPID_SUBJECT);
const subject = configuredSubject
  ? configuredSubject.includes(":")
    ? configuredSubject
    : `mailto:${configuredSubject}`
  : "mailto:admin@soaring.photos";

// A malformed public key decodes to something other than 65 bytes; validate up front instead of throwing mid-request.
function isValidVapidPublicKey(key: string) {
  try {
    const decoded = Buffer.from(key.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    return decoded.length === 65;
  } catch {
    return false;
  }
}

const vapidConfigured = Boolean(publicKey && privateKey && isValidVapidPublicKey(publicKey));
if (publicKey && privateKey && !vapidConfigured) {
  console.error("VAPID_PUBLIC_KEY is invalid (must decode to 65 bytes); push notifications are disabled.");
}

export function isPushConfigured() {
  return vapidConfigured;
}

export function getPushPublicKey() {
  return publicKey;
}

export async function sendPushNotifications({
  recipients,
  actorUsername,
  caption,
  postId,
}: {
  recipients: { id: string; type: "mention" | "post" }[];
  actorUsername: string;
  caption: string;
  postId: string;
}) {
  if (!isPushConfigured() || recipients.length === 0 || !publicKey || !privateKey) return;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (error) {
    console.error("Failed to configure VAPID details; skipping push notifications", error);
    return;
  }
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: { in: recipients.map((recipient) => recipient.id) } },
  });
  const notificationTypeByUserId = new Map(recipients.map((recipient) => [recipient.id, recipient.type]));

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const type = notificationTypeByUserId.get(subscription.userId) ?? "post";
      const title = type === "mention" ? `${actorUsername} tagged you` : `New post from ${actorUsername}`;
      const body = caption || (type === "mention" ? "You were tagged in a post." : "Shared a new photo or video.");

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime?.getTime() ?? null,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ title, body, url: `/post/${postId}`, tag: `post-${postId}` }),
        );
      } catch (error) {
        const statusCode = error instanceof webpush.WebPushError ? error.statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => {});
        } else {
          console.error("Failed to send push notification", error);
        }
      }
    }),
  );
}
