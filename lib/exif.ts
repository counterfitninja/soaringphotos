import ExifReader from "exifreader";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extracts GPS latitude and longitude from an image buffer or ArrayBuffer.
 * Returns null if no GPS tags exist or coordinates are invalid.
 */
export async function extractGpsCoordinates(
  buffer: Buffer | ArrayBuffer | Uint8Array,
): Promise<GpsCoordinates | null> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (buffer instanceof ArrayBuffer) {
      arrayBuffer = buffer;
    } else if (ArrayBuffer.isView(buffer)) {
      arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
    } else {
      return null;
    }

    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    // ExifReader in expanded mode provides decimal gps coordinates directly in tags.gps
    if (
      tags.gps &&
      typeof tags.gps.Latitude === "number" &&
      typeof tags.gps.Longitude === "number" &&
      !Number.isNaN(tags.gps.Latitude) &&
      !Number.isNaN(tags.gps.Longitude)
    ) {
      const lat = tags.gps.Latitude;
      const lng = tags.gps.Longitude;

      if (isValidCoordinate(lat, lng)) {
        return {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        };
      }
    }

    // Fallback: Check top-level tag properties if expanded didn't populate
    const rawTags = tags as unknown as Record<string, any>;
    if (rawTags["GPSLatitude"] && rawTags["GPSLongitude"]) {
      const latVal = parseCoordinateTag(rawTags["GPSLatitude"], rawTags["GPSLatitudeRef"]?.value?.[0]);
      const lngVal = parseCoordinateTag(rawTags["GPSLongitude"], rawTags["GPSLongitudeRef"]?.value?.[0]);

      if (latVal !== null && lngVal !== null && isValidCoordinate(latVal, lngVal)) {
        return {
          latitude: Number(latVal.toFixed(6)),
          longitude: Number(lngVal.toFixed(6)),
        };
      }
    }

    return null;
  } catch {
    // If image format has no EXIF or is corrupt, fail gracefully
    return null;
  }
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function parseCoordinateTag(coordTag: any, ref?: string): number | null {
  if (!coordTag) return null;

  // If already a number
  if (typeof coordTag.description === "number") {
    let val = coordTag.description;
    if (ref === "S" || ref === "W") val = -Math.abs(val);
    return val;
  }

  // If rational array [degrees, minutes, seconds]
  if (Array.isArray(coordTag.value) && coordTag.value.length >= 3) {
    const deg = Number(coordTag.value[0]) || 0;
    const min = Number(coordTag.value[1]) || 0;
    const sec = Number(coordTag.value[2]) || 0;
    let decimal = deg + min / 60 + sec / 3600;
    if (ref === "S" || ref === "W") decimal = -Math.abs(decimal);
    return decimal;
  }

  return null;
}
