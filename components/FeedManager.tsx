"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addMember,
  createFeedInvite,
  removeMember,
  setMemberRole,
} from "@/app/actions/feeds";
import CopyInviteLink from "@/components/CopyInviteLink";
import { btnSmall } from "@/lib/ui";

export interface RosterMember {
  id: string;
  username: string;
  globalRole: string;
  feedRole: string; // "manager" | "member"
}

export interface Candidate {
  id: string;
  username: string;
}

export default function FeedManager({
  feedId,
  feedName,
  members,
  candidates,
  isAdmin,
  currentUserId,
}: {
  feedId: string;
  feedName: string;
  members: RosterMember[];
  candidates: Candidate[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Add a member</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Add an existing account to <strong>{feedName}</strong>, or create an invite link for
          someone new — they'll join this feed directly.
        </p>
        <div className="mt-3 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Choose a person…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.username}
              </option>
            ))}
          </select>
          <button
            className={btnSmall}
            disabled={pending || !selected}
            onClick={() => run(() => addMember(feedId, selected))}
          >
            Add
          </button>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <button
            className={btnSmall}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await createFeedInvite(feedId);
                if (result.error) setError(result.error);
                else setInviteToken(result.token ?? null);
                router.refresh();
              })
            }
          >
            + Generate invite link
          </button>
          {inviteToken && (
            <div className="mt-2">
              <CopyInviteLink token={inviteToken} />
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{member.username}</p>
                <p className="text-xs text-neutral-500">
                  {member.feedRole}
                  {member.globalRole === "admin" ? " · admin" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && member.id !== currentUserId && (
                  <button
                    className="text-xs font-medium text-sky-600 hover:underline disabled:opacity-50"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        setMemberRole(feedId, member.id, member.feedRole === "manager" ? "member" : "manager"),
                      )
                    }
                  >
                    {member.feedRole === "manager" ? "Make member" : "Make manager"}
                  </button>
                )}
                {member.id !== currentUserId && (
                  <button
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    disabled={pending}
                    onClick={() => run(() => removeMember(feedId, member.id))}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
