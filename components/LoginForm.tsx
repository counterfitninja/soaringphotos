"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { btnPrimary, inputCls } from "@/lib/ui";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{state.error}</p>
      )}
      <input
        name="identifier"
        required
        autoComplete="username"
        placeholder="Username or email"
        className={inputCls}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className={inputCls}
      />
      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
