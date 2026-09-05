import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD is required to initialize the admin account.");
  }

  const admin = await db.user.findUnique({ where: { username } });
  if (admin) {
    console.log(`Admin user "${username}" already exists, skipping.`);
    return;
  }

  await db.user.create({
    data: {
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });
  console.log(`Created admin user "${username}" <${email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());