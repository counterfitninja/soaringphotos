import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { base64urlToUint8Array, getWebAuthnConfig } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { response } = await request.json();
    if (!response) {
      return NextResponse.json({ error: "Missing passkey response." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const challengeVal = cookieStore.get("famstagram_passkey_challenge_value")?.value;
    const userKey = cookieStore.get("famstagram_passkey_challenge")?.value;

    if (!challengeVal || !userKey || !userKey.startsWith("passkeyChallenge:")) {
      return NextResponse.json({ error: "Passkey login expired. Please try again." }, { status: 400 });
    }

    const userId = userKey.replace("passkeyChallenge:", "");
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      return NextResponse.json({ error: "No matching account found." }, { status: 404 });
    }

    const passkey = user.passkeys.find((item) => item.credentialId === response.id);
    if (!passkey) {
      return NextResponse.json({ error: "This passkey is not registered to this account." }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeVal,
      expectedOrigin: getWebAuthnConfig().origin,
      expectedRPID: getWebAuthnConfig().rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: base64urlToUint8Array(passkey.publicKey),
        counter: passkey.counter,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey verification failed." }, { status: 400 });
    }

    await db.webAuthnCredential.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    await session.save();

    cookieStore.delete("famstagram_passkey_challenge");
    cookieStore.delete("famstagram_passkey_challenge_value");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Passkey verification failed", error);
    return NextResponse.json({ error: "Could not verify passkey." }, { status: 500 });
  }
}
