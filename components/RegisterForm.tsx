"use client";

import { useActionState, useState } from "react";
import { register } from "@/app/actions/auth";
import { btnPrimary, inputCls } from "@/lib/ui";

export default function RegisterForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(register, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.error}</p>
      )}

      <div>
        <input
          name="username"
          required
          autoComplete="username"
          placeholder="Username"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-neutral-400">
          3-20 characters: letters, numbers and underscores.
        </p>
      </div>

      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email address"
        className={inputCls}
      />

      <div>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-neutral-400">At least 8 characters.</p>
      </div>

      <div>
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
        {mismatch && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-700">
        <input
          name="confirmAccount"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>
          Confirm I want to create this family account.
          <span className="mt-1 block text-xs text-neutral-400">
            Your invite will be marked as used after the account is created.
          </span>
        </span>
      </label>

      <button type="submit" disabled={isPending || mismatch || !confirmed} className={btnPrimary}>
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
