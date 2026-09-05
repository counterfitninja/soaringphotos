"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/likes";

export default function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  const [state, setState] = useState({ liked, count });
  const [, startTransition] = useTransition();

  function onClick() {
    // Optimistic update, then persist on the server.
    setState((s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }));
    startTransition(() => toggleLike(postId));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={state.liked ? "Unlike" : "Like"}
      className="flex items-center gap-1 text-sm text-neutral-600 hover:text-red-500"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${state.liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-current"}`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{state.count}</span>
    </button>
  );
}
