import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me-admin";

  let admin = await db.user.findUnique({ where: { username } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "admin",
      },
    });
    console.log(`Created admin user "${username}" <${email}>`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  Default password: ${password}  <-- change this (set ADMIN_PASSWORD in .env)`);
    }
  } else {
    console.log(`Admin user "${username}" already exists, skipping.`);
  }

  // Ensure the default feed exists and the admin manages it.
  const feed = await db.feed.upsert({
    where: { id: "default-feed-family" },
    create: { id: "default-feed-family", name: "Family", description: "The original family feed" },
    update: {},
  });
  await db.feedMembership.upsert({
    where: { userId_feedId: { userId: admin.id, feedId: feed.id } },
    create: { userId: admin.id, feedId: feed.id, role: "manager" },
    update: {},
  });

  const token = randomBytes(16).toString("hex");
  await db.invite.create({
    data: {
      token,
      createdById: admin.id,
      feedId: feed.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`\nInvite link for your first family member:`);
  console.log(`  http://localhost:3000/invite/${token}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
