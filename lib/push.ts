import webpush from "web-push";
import { db } from "@/lib/db";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const configuredSubject = process.env.VAPID_SUBJECT?.trim();
const subject = configuredSubject
  ? configuredSubject.includes(":")
    ? configuredSubject
    : `mailto:${configuredSubject}`
  : "mailto:admin@soaring.photos";

export function isPushConfigured() {
  return Boolean(publicKey && privateKey);
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

  webpush.setVapidDetails(subject, publicKey, privateKey);
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
