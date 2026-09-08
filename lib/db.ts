import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma resolves relative `file:` URLs against the schema directory for CLI commands,
 * but against the generated client's location at runtime — which points into
 * `.next/standalone/node_modules` for standalone builds. Pin them to `<cwd>/prisma`
 * so migrations and the server open the same database file.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;

  const target = url.slice("file:".length);
  if (target === "" || target.startsWith(":") || path.isAbsolute(target)) return url;

  return `file:${path.resolve(process.cwd(), "prisma", target)}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatabaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
