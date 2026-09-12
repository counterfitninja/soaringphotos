import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSharedMediaFile, validateMediaFiles } from "../lib/validation";

test("normalizes a Google Photos JPEG with a generic MIME type", async () => {
  const sharedFile = new File(
    [Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])],
    "shared-image",
    { type: "application/octet-stream" },
  );

  const normalized = await normalizeSharedMediaFile(sharedFile);

  assert.equal(normalized.type, "image/jpeg");
  assert.deepEqual(validateMediaFiles([normalized]), {});
});

test("normalizes supported shared media by filename extension", async () => {
  const sharedFile = new File(["image"], "photo.JPG", { type: "" });

  const normalized = await normalizeSharedMediaFile(sharedFile);

  assert.equal(normalized.type, "image/jpeg");
  assert.deepEqual(validateMediaFiles([normalized]), {});
});

test("does not disguise unsupported shared files", async () => {
  const sharedFile = new File(["document"], "notes.txt", { type: "application/octet-stream" });

  const normalized = await normalizeSharedMediaFile(sharedFile);

  assert.equal(normalized.type, "application/octet-stream");
  assert.match(validateMediaFiles([normalized]).error ?? "", /Unsupported file type/);
});