/**
 * Formats latitude and longitude coordinates into a friendly display string
 * e.g., "47.6062° N, 122.3321° W"
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  return `${latAbs}° ${latDir}, ${lngAbs}° ${lngDir}`;
}

/**
 * Reverse geocodes latitude and longitude into a human-readable location name
 * (e.g. "Seattle, Washington, United States" or "Banff, Alberta").
 * Falls back to formatted coordinates on network failure or timeout.
 */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  timeoutMs = 3000,
): Promise<string> {
  const fallback = formatCoordinates(latitude, longitude);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      latitude,
    )}&lon=${encodeURIComponent(longitude)}&zoom=14&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Famstagram/1.0 (Family photo sharing app)",
        Accept: "application/json",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const address = data?.address;

    if (!address) {
      if (typeof data?.display_name === "string" && data.display_name.trim().length > 0) {
        return data.display_name.split(",").slice(0, 3).join(", ").trim();
      }
      return fallback;
    }

    // Build concise location: [Specific Place/City/Town], [State/Region], [Country]
    const place =
      address.tourism ||
      address.leisure ||
      address.amenity ||
      address.natural ||
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality ||
      address.county;

    const state = address.state || address.region || address.province;
    const country = address.country;

    const parts: string[] = [];
    if (place) parts.push(place);
    if (state && state !== place) parts.push(state);
    if (country && parts.length < 2) parts.push(country);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return fallback;
  } catch {
    return fallback;
  }
}
