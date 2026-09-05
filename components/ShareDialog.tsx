"use client";

import { useState, useTransition } from "react";
import { sharePost } from "@/app/actions/shares";
import type { MemberOption } from "@/lib/types";
import { btnSmall, inputCls } from "@/lib/ui";

export default function ShareDialog({
  postId,
  members,
}: {
  postId: string;
  members: MemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setToUserId("");
    setMessage("");
    setFeedback(null);
  }

  function send() {
    if (!toUserId) {
      setFeedback("Please pick a family member.");
      return;
    }
    startTransition(async () => {
      const result = await sharePost(postId, toUserId, message.trim());
      if (result?.error) {
        setFeedback(result.error);
      } else {
        close();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Forward post to a family member"
        title="Forward to a family member"
        className="ml-auto flex items-center gap-1 text-sm text-neutral-600 hover:text-sky-700"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4Z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-semibold">Forward this post</h2>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm text-neutral-600">Send to</span>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className={inputCls}
              >
                <option value="">Choose a family member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm text-neutral-600">Message (optional)</span>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                placeholder="Say something about it…"
                className={inputCls}
              />
            </label>

            {feedback && <p className="mb-3 text-sm text-red-600">{feedback}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button type="button" onClick={send} disabled={isPending} className={btnSmall}>
                {isPending ? "Sending…" : "Send"}
              </button>
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              The post will appear in their “Shared with me” inbox.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
