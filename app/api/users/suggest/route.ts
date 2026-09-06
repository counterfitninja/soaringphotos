import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = (searchParams.get("q") ?? "").trim();
  const query = rawQuery.slice(0, 20);

  const users = await db.user.findMany({
    where: {
      id: { not: session.userId },
      ...(query
        ? {
            username: {
              contains: query,
            },
          }
        : {}),
    },
    select: { username: true },
    orderBy: { username: "asc" },
    take: 8,
  });

  return NextResponse.json({ users: users.map((user) => user.username) });
}