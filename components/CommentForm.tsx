"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/comments";
import { inputCls } from "@/lib/ui";

export default function CommentForm({ postId }: { postId: string }) {
  const action = addComment.bind(null, postId);
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2 pt-1">
      <input
        name="text"
        placeholder="Add a comment…"
        maxLength={500}
        autoComplete="off"
        className={`${inputCls} flex-1 border-0 bg-neutral-100 px-3 py-1.5`}
      />
      <button
        disabled={isPending}
        className="text-sm font-medium text-sky-600 hover:text-sky-800 disabled:opacity-50"
      >
        Post
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
