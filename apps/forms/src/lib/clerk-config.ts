function normalizeWebOrigin(value: string, label: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute http(s) origin`);
  }

  const hasOnlyOrigin =
    (url.protocol === "http:" || url.protocol === "https:") &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash;

  if (!hasOnlyOrigin) {
    throw new Error(`${label} must be an absolute http(s) origin without credentials, path, query, or hash`);
  }

  return url.origin;
}

export function resolveClerkAuthorizedParties(
  configured = process.env.CLERK_AUTHORIZED_PARTIES,
  environment = process.env.NODE_ENV,
) {
  const configuredOrigins = configured?.split(",").map((origin) => origin.trim()).filter(Boolean);
  const defaults = environment === "production"
    ? ["https://jobing.site", "https://forms.jobing.site"]
    : ["http://localhost:3000", "http://localhost:3001"];
  const origins = configuredOrigins?.length ? configuredOrigins : defaults;

  return [...new Set(origins.map((origin) => normalizeWebOrigin(origin, "CLERK_AUTHORIZED_PARTIES")))];
}
