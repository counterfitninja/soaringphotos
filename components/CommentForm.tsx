"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addComment } from "@/app/actions/comments";
import type { MemberOption } from "@/lib/types";
import { inputCls } from "@/lib/ui";

export default function CommentForm({
  postId,
  members,
}: {
  postId: string;
  members: MemberOption[];
}) {
  const action = addComment.bind(null, postId);
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setText("");
      setMentionStart(null);
    }
  }, [state]);

  const suggestions =
    mentionStart === null
      ? []
      : members.filter((member) => member.username.toLowerCase().startsWith(mentionQuery.toLowerCase()));

  function updateText(value: string, cursorPosition: number) {
    setText(value);
    const beforeCursor = value.slice(0, cursorPosition);
    const match = beforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionStart(cursorPosition - match[1].length - 1);
      setMentionQuery(match[1]);
    } else {
      setMentionStart(null);
    }
  }

  function selectMention(username: string) {
    if (mentionStart === null) return;
    const value = `${text.slice(0, mentionStart)}@${username} ${text.slice(mentionStart + mentionQuery.length + 1)}`;
    setText(value);
    setMentionStart(null);
    requestAnimationFrame(() => {
      const cursorPosition = mentionStart + username.length + 2;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2 pt-1">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          name="text"
          value={text}
          onChange={(event) => updateText(event.target.value, event.target.selectionStart ?? event.target.value.length)}
          onClick={(event) => updateText(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
          onBlur={() => setMentionStart(null)}
          placeholder="Add a comment…"
          maxLength={500}
          autoComplete="off"
          className={`${inputCls} w-full border-0 bg-neutral-100 px-3 py-1.5`}
        />
        {suggestions.length > 0 && (
          <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
            {suggestions.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectMention(member.username);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                >
                  @{member.username}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
