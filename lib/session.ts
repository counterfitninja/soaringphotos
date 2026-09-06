import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  username?: string;
  role?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "famstagram_session",
  // iron-session requires a secret of at least 32 characters.
  password:
    process.env.SESSION_SECRET ?? "dev-only-secret-change-me-0123456789abcdef0123456789abcdef",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
