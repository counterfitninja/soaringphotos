import test from "node:test";
import assert from "node:assert/strict";

import { getWebAuthnConfig, normalizeWebAuthnOrigin } from "../lib/webauthn";

test("normalize origin removes trailing slash without altering the scheme", () => {
  assert.equal(normalizeWebAuthnOrigin("https://app.example.com/"), "https://app.example.com");
  assert.equal(normalizeWebAuthnOrigin("http://localhost:3000"), "http://localhost:3000");
});

test("WebAuthn config falls back to localhost when not explicitly configured", () => {
  const config = getWebAuthnConfig();
  assert.equal(config.rpName, "Famstagram");
  assert.equal(config.origin, "http://localhost:3000");
  assert.equal(config.rpID, "localhost");
});
