import Link from "next/link";
import Image from "next/image";
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
      <nav className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 lg:max-w-6xl">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-sky-700">
          <Image src="/logo.jpeg" alt="Famstagram" width={40} height={43} className="rounded-md" />
          <span>Famstagram</span>
        </Link>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
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
            className="max-w-24 truncate font-medium text-neutral-700 hover:text-sky-700"
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
