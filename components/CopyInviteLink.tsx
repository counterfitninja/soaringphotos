"use client";

import { useEffect, useState } from "react";

export default function CopyInviteLink({ token }: { token: string }) {
  const [url, setUrl] = useState(`/invite/${token}`);
  const [copied, setCopied] = useState(false);

  // Build the absolute URL on the client (server doesn't know the origin).
  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${token}`);
  }, [token]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="truncate rounded bg-neutral-100 px-2 py-1 text-xs">{url}</code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 text-xs font-medium text-sky-600 hover:underline"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
