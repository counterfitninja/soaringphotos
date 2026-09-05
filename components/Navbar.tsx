import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function Navbar({
  username,
  role,
  unreadShares,
  unreadNotifications,
}: {
  username: string;
  role: string;
  unreadShares: number;
  unreadNotifications: number;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 lg:max-w-6xl">
        <Link href="/" className="text-lg font-bold text-sky-700">
          🦅 Soaring Photos
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/create"
            className="hidden font-medium text-neutral-700 hover:text-sky-700 sm:inline"
          >
            + Post
          </Link>
          <Link href="/shared" className="relative text-neutral-700 hover:text-sky-700">
            Shared
            {unreadShares > 0 && (
              <span className="absolute -right-3 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                {unreadShares}
              </span>
            )}
          </Link>
          <Link href="/notifications" className="relative text-neutral-700 hover:text-sky-700">
            Alerts
            {unreadNotifications > 0 && (
              <span className="absolute -right-3 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="text-neutral-700 hover:text-sky-700">
              Admin
            </Link>
          )}
          <Link
            href={`/profile/${username}`}
            className="font-medium text-neutral-700 hover:text-sky-700"
          >
            {username}
          </Link>
          <form action={logout}>
            <button className="text-neutral-400 hover:text-red-600">Log out</button>
          </form>
        </div>
      </nav>
    </header>
  );
}
