-- CreateTable
CREATE TABLE "NotificationMute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mutedUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationMute_mutedUserId_fkey" FOREIGN KEY ("mutedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NotificationMute_mutedUserId_idx" ON "NotificationMute"("mutedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMute_userId_mutedUserId_key" ON "NotificationMute"("userId", "mutedUserId");
