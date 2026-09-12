import assert from "node:assert/strict";
import test from "node:test";

import { extractGpsCoordinates } from "../lib/exif";
import { formatCoordinates, reverseGeocodeLocation } from "../lib/geocoding";
import { latitudeSchema, longitudeSchema, mapQuerySchema } from "../lib/validation";

test("coordinate validation schemas enforce WGS84 bounds", () => {
  assert.equal(latitudeSchema.safeParse(47.6062).success, true);
  assert.equal(latitudeSchema.safeParse(-90).success, true);
  assert.equal(latitudeSchema.safeParse(90).success, true);
  assert.equal(latitudeSchema.safeParse(91).success, false);
  assert.equal(latitudeSchema.safeParse(-90.1).success, false);

  assert.equal(longitudeSchema.safeParse(-122.3321).success, true);
  assert.equal(longitudeSchema.safeParse(-180).success, true);
  assert.equal(longitudeSchema.safeParse(180).success, true);
  assert.equal(longitudeSchema.safeParse(180.1).success, false);
  assert.equal(longitudeSchema.safeParse(-180.1).success, false);
});

test("map query schema applies defaults and bounds", () => {
  const parsedDefault = mapQuerySchema.parse({});
  assert.equal(parsedDefault.limit, 50);

  const parsedCustom = mapQuerySchema.parse({ limit: "100", feedId: "feed_123" });
  assert.equal(parsedCustom.limit, 100);
  assert.equal(parsedCustom.feedId, "feed_123");

  assert.equal(mapQuerySchema.safeParse({ limit: 0 }).success, false);
  assert.equal(mapQuerySchema.safeParse({ limit: 600 }).success, false);
});

test("formatCoordinates formats latitude and longitude into friendly representation", () => {
  assert.equal(formatCoordinates(47.6062, -122.3321), "47.6062° N, 122.3321° W");
  assert.equal(formatCoordinates(-33.8688, 151.2093), "33.8688° S, 151.2093° E");
});

test("extractGpsCoordinates gracefully handles empty or non-image buffers", async () => {
  const empty = Buffer.alloc(0);
  const result = await extractGpsCoordinates(empty);
  assert.equal(result, null);

  const randomData = Buffer.from("Not an image file at all");
  const resultRandom = await extractGpsCoordinates(randomData);
  assert.equal(resultRandom, null);

  // Partial or corrupted JPEG header
  const corruptJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00]);
  const resultCorrupt = await extractGpsCoordinates(corruptJpeg);
  assert.equal(resultCorrupt, null);
});

test("reverseGeocodeLocation returns coordinate string as fallback when network is unreachable or times out", async () => {
  // Uses unreachable port/timeout to verify fallback mechanism
  const location = await reverseGeocodeLocation(47.6062, -122.3321, 10);
  assert.match(location, /47\.6062° N, 122\.3321° W/);
});
