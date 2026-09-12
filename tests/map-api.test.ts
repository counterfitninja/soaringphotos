import assert from "node:assert/strict";
import test from "node:test";

import { mapQuerySchema, MAP_LIMIT_DEFAULT, MAP_LIMIT_PRESETS } from "../lib/validation";

test("map query parameters accept standard presets and enforce limits", () => {
  for (const preset of MAP_LIMIT_PRESETS) {
    const parsed = mapQuerySchema.parse({ limit: preset });
    assert.equal(parsed.limit, preset);
  }

  const defaultParse = mapQuerySchema.parse({});
  assert.equal(defaultParse.limit, MAP_LIMIT_DEFAULT);

  // Rejects limits <= 0 or > 500
  assert.equal(mapQuerySchema.safeParse({ limit: -1 }).success, false);
  assert.equal(mapQuerySchema.safeParse({ limit: 0 }).success, false);
  assert.equal(mapQuerySchema.safeParse({ limit: 501 }).success, false);
});

test("map query filters feed access properly", () => {
  const allowedFeedIds = ["feed_family", "feed_vacation"];

  function canAccessFeedMap(requestedFeedId: string | undefined, userFeedIds: string[]): boolean {
    if (!requestedFeedId || requestedFeedId === "all") return true;
    return userFeedIds.includes(requestedFeedId);
  }

  assert.equal(canAccessFeedMap("feed_family", allowedFeedIds), true);
  assert.equal(canAccessFeedMap("feed_vacation", allowedFeedIds), true);
  assert.equal(canAccessFeedMap("feed_stranger", allowedFeedIds), false);
  assert.equal(canAccessFeedMap(undefined, allowedFeedIds), true);
  assert.equal(canAccessFeedMap("all", allowedFeedIds), true);
});
