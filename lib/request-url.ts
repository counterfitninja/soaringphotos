/**
 * Resolve the public origin for redirects from route handlers.
 *
 * Preference order:
 * 1) APP_ORIGIN env var (explicit canonical URL)
 * 2) Forwarded headers from a reverse proxy
 * 3) Host header + request protocol
 * 4) request.url as a final fallback
 */
export function getRequestOrigin(req: Request): string {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    const protocol = forwardedProto || new URL(req.url).protocol.replace(":", "");
    return `${protocol}://${host}`;
  }

  return new URL(req.url).origin;
}

export function toRequestUrl(req: Request, path: string): URL {
  return new URL(path, getRequestOrigin(req));
}
