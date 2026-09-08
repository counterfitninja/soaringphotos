-- Multi-feed access: Feed + FeedMembership tables, feedId on Post/Invite/Notification,
-- with backfill of all existing data into a default "Family" feed.

-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FeedMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedMembership_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Redefine Post with feedId
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedId" TEXT NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Redefine Invite with feedId
CREATE TABLE "new_Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "usedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedId" TEXT NOT NULL,
    CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invite_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Redefine Notification with feedId
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Backfill: create the default feed with a stable id
INSERT INTO "Feed" ("id", "name", "description", "createdAt")
VALUES ('default-feed-family', 'Family', 'The original family feed', CURRENT_TIMESTAMP);

-- Backfill: every existing user becomes a member of the default feed;
-- existing admins become managers of it.
INSERT INTO "FeedMembership" ("id", "userId", "feedId", "role", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'default-feed-family',
       CASE WHEN "role" = 'admin' THEN 'manager' ELSE 'member' END,
       CURRENT_TIMESTAMP
FROM "User";

-- Backfill content into the default feed
INSERT INTO "new_Post" ("id", "authorId", "caption", "createdAt", "feedId")
SELECT "id", "authorId", "caption", "createdAt", 'default-feed-family' FROM "Post";

INSERT INTO "new_Invite" ("id", "token", "createdById", "usedById", "usedAt", "expiresAt", "createdAt", "feedId")
SELECT "id", "token", "createdById", "usedById", "usedAt", "expiresAt", "createdAt", 'default-feed-family' FROM "Invite";

INSERT INTO "new_Notification" ("id", "userId", "actorId", "postId", "type", "readAt", "createdAt", "feedId")
SELECT "id", "userId", "actorId", "postId", "type", "readAt", "createdAt", 'default-feed-family' FROM "Notification";

DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
DROP TABLE "Invite";
ALTER TABLE "new_Invite" RENAME TO "Invite";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Indexes & unique constraints
CREATE UNIQUE INDEX "Feed_name_key" ON "Feed"("name");
CREATE UNIQUE INDEX "FeedMembership_userId_feedId_key" ON "FeedMembership"("userId", "feedId");
CREATE INDEX "FeedMembership_feedId_idx" ON "FeedMembership"("feedId");
CREATE INDEX "FeedMembership_userId_idx" ON "FeedMembership"("userId");
CREATE INDEX "Post_feedId_createdAt_idx" ON "Post"("feedId", "createdAt");
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
CREATE UNIQUE INDEX "Invite_usedById_key" ON "Invite"("usedById");
CREATE INDEX "Invite_feedId_idx" ON "Invite"("feedId");
CREATE UNIQUE INDEX "Notification_userId_postId_type_key" ON "Notification"("userId", "postId", "type");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_feedId_idx" ON "Notification"("feedId");
