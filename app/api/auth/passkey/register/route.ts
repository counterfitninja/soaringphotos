import { NextResponse } from "next/server";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { base64urlToUint8Array, createChallenge, getWebAuthnConfig, uint8ArrayToBase64URL } from "@/lib/webauthn";

export async function GET() {
  const user = await requireUser();
  const config = getWebAuthnConfig();
  const challenge = createChallenge();
  const cookieStore = await cookies();
  cookieStore.set({
    name: "famstagram_passkey_register_challenge",
    value: challenge,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 120,
  });

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: user.email,
    userDisplayName: user.username,
    userID: Uint8Array.from(Buffer.from(user.id)),
    challenge,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  return NextResponse.json({ options });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const { response } = await request.json();
  if (!response) {
    return NextResponse.json({ error: "Missing passkey registration response." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const challenge = cookieStore.get("famstagram_passkey_register_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Passkey registration expired. Please try again." }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: getWebAuthnConfig().origin,
    expectedRPID: getWebAuthnConfig().rpID,
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey registration failed." }, { status: 400 });
  }

  const credentialId = response.id;
  const publicKey = verification.registrationInfo.credential.publicKey;
  const publicKeyBase64 = uint8ArrayToBase64URL(publicKey);

  await db.webAuthnCredential.upsert({
    where: { credentialId },
    create: {
      userId: user.id,
      credentialId,
      publicKey: publicKeyBase64,
      counter: verification.registrationInfo.credential.counter,
    },
    update: {
      userId: user.id,
      publicKey: publicKeyBase64,
      counter: verification.registrationInfo.credential.counter,
    },
  });

  cookieStore.delete("famstagram_passkey_register_challenge");
  return NextResponse.json({ ok: true });
}
