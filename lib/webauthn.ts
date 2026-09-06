import { randomBytes } from "node:crypto";

export type WebAuthnConfig = {
  origin: string;
  rpID: string;
  rpName: string;
};

export function normalizeWebAuthnOrigin(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "http://localhost:3000";
  return trimmed.replace(/\/+$/, "");
}

export function getWebAuthnConfig(): WebAuthnConfig {
  const origin = normalizeWebAuthnOrigin(process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000");
  const rpID = (process.env.WEBAUTHN_RP_ID ?? "localhost").trim() || "localhost";
  const rpName = (process.env.WEBAUTHN_RP_NAME ?? "Famstagram").trim() || "Famstagram";

  return {
    origin,
    rpID,
    rpName,
  };
}

export function createChallenge() {
  return randomBytes(32).toString("base64url");
}

export function base64urlToUint8Array(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(Buffer.from(padded, "base64"));
}

export function uint8ArrayToBase64URL(value: Uint8Array) {
  return Buffer.from(value).toString("base64url");
}
