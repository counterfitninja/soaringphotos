import { NextRequest, NextResponse } from "next/server";
import { sessionOptions } from "@/lib/session";

const PUBLIC_PREFIXES = ["/login", "/invite", "/icons"];
const PUBLIC_ASSETS = [
  "/manifest.webmanifest",
  "/sw.js",
  "/icon.jpeg",
  "/apple-icon.jpeg",
  "/logo.jpeg",
];

/**
 * Lightweight gate: only checks for the presence of the session cookie.
 * The actual session is validated by layouts, server actions and route handlers.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicAsset = PUBLIC_ASSETS.includes(pathname);
  const hasSessionCookie = req.cookies.has(sessionOptions.cookieName);

  if (!hasSessionCookie && !isPublic && !isPublicAsset) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
