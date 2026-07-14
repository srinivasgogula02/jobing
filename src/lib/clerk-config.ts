function normalizeWebOrigin(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("CLERK_AUTHORIZED_PARTIES must contain absolute http(s) origins");
  }

  const hasOnlyOrigin =
    (url.protocol === "http:" || url.protocol === "https:") &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash;

  if (!hasOnlyOrigin) {
    throw new Error(
      "CLERK_AUTHORIZED_PARTIES must contain origins without credentials, paths, queries, or hashes",
    );
  }

  return url.origin;
}

export function resolveClerkAuthorizedParties(
  configured = process.env.CLERK_AUTHORIZED_PARTIES,
  environment = process.env.NODE_ENV,
) {
  const configuredOrigins = configured?.split(",").map((origin) => origin.trim()).filter(Boolean);
  const defaults = environment === "production"
    ? ["https://jobing.site"]
    : ["http://localhost:3000", "http://localhost:3001"];
  const origins = configuredOrigins?.length ? configuredOrigins : defaults;

  return [...new Set(origins.map(normalizeWebOrigin))];
}
