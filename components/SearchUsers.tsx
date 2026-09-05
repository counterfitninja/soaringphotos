"use client";

import Link from "next/link";
import { useState } from "react";
import { inputCls } from "@/lib/ui";
import { initials } from "@/lib/utils";

export default function SearchUsers({
  users,
}: {
  users: { username: string; postCount: number }[];
}) {
  const [query, setQuery] = useState("");
  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search family members…"
        className={inputCls}
        autoFocus
      />

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
          No family members found.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
          {filtered.map((u) => (
            <li key={u.username}>
              <Link
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                  {initials(u.username)}
                </div>
                <div>
                  <p className="font-medium text-neutral-800">{u.username}</p>
                  <p className="text-xs text-neutral-500">
                    {u.postCount} {u.postCount === 1 ? "post" : "posts"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
