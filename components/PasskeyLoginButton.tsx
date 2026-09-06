"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { btnPrimary } from "@/lib/ui";

export default function PasskeyLoginButton({ identifier }: { identifier: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handlePasskeyLogin() {
    setStatus("loading");
    setMessage(null);

    try {
      const startRes = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() || undefined }),
      });

      const payload = await startRes.json();
      if (!startRes.ok || !payload?.options) {
        throw new Error(payload?.error ?? "Passkey sign-in is not available for this account.");
      }

      const authResponse = await startAuthentication({ optionsJSON: payload.options });

      const verifyRes = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResponse }),
      });

      const verifyPayload = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyPayload?.error ?? "Passkey verification failed.");
      }

      setStatus("success");
      setMessage("Passkey verified. Redirecting...");
      window.location.href = "/";
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not sign in with passkey.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={status === "loading"}
        className={`${btnPrimary} bg-neutral-900 hover:bg-neutral-800`}
      >
        {status === "loading" ? "Checking passkeys…" : "Use a passkey"}
      </button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </>
  );
}
