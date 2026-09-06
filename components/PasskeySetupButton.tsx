"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function PasskeySetupButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSetup() {
    setStatus("loading");
    setMessage(null);

    try {
      const startRes = await fetch("/api/auth/passkey/register", { method: "GET" });
      const payload = await startRes.json();
      if (!startRes.ok || !payload?.options) {
        throw new Error(payload?.error ?? "Passkey setup is not available right now.");
      }

      const registration = await startRegistration({ optionsJSON: payload.options });
      const verifyRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: registration }),
      });

      const verifyPayload = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyPayload?.error ?? "Could not save the passkey.");
      }

      setStatus("success");
      setMessage("Passkey added successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not add a passkey.");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-800">Passkeys</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Use Face ID, Touch ID, or Windows Hello with no password.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSetup}
          disabled={status === "loading"}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {status === "loading" ? "Adding…" : "Add passkey"}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-xs ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
