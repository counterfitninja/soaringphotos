import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { getWebAuthnConfig } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = String(body?.identifier ?? "").trim();

    const user = identifier
      ? await db.user.findFirst({
          where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
          include: { passkeys: true },
        })
      : null;

    if (!user || user.passkeys.length === 0) {
      return NextResponse.json({ error: "No passkeys are registered for this account." }, { status: 400 });
    }

    const opts = await generateAuthenticationOptions({
      rpID: getWebAuthnConfig().rpID,
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
        type: "public-key",
      })),
      userVerification: "preferred",
    });

    const challengeKey = `passkeyChallenge:${user.id}`;
    const cookie = await import("next/headers").then(({ cookies }) => cookies());
    const store = await cookie;
    store.set({
      name: "famstagram_passkey_challenge",
      value: challengeKey,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });

    const challenge = opts.challenge;
    const challengeCookie = await import("next/headers").then(({ cookies }) => cookies());
    const challengeStore = await challengeCookie;
    challengeStore.set({
      name: "famstagram_passkey_challenge_value",
      value: challenge,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });

    return NextResponse.json({ options: opts });
  } catch (error) {
    console.error("Passkey login challenge failed", error);
    return NextResponse.json({ error: "Could not start passkey sign in." }, { status: 500 });
  }
}
