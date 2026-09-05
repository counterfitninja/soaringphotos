-- Preserve source browser details for future push-subscription diagnostics.
ALTER TABLE "PushSubscription" ADD COLUMN "userAgent" TEXT;