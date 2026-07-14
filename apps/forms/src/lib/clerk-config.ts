const PRODUCTION_FORMS_BASE_URL = "https://jobing.site/forms";

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

function normalizeFormsBaseUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_FORMS_SITE_URL must be an absolute http(s) URL");
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  const isValid =
    (url.protocol === "http:" || url.protocol === "https:")
    && !url.username
    && !url.password
    && pathname === "/forms"
    && !url.search
    && !url.hash;

  if (!isValid) {
    throw new Error("NEXT_PUBLIC_FORMS_SITE_URL must be an absolute /forms URL without credentials, query, or hash");
  }

  return `${url.origin}${pathname}`;
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

  return [...new Set(origins.map((origin) => normalizeWebOrigin(origin, "CLERK_AUTHORIZED_PARTIES")))];
}

export function getFormsSignInRedirectProps(
  configuredFormsBaseUrl = process.env.NEXT_PUBLIC_FORMS_SITE_URL,
  environment = process.env.NODE_ENV,
) {
  const fallbackBaseUrl = environment === "production"
    ? PRODUCTION_FORMS_BASE_URL
    : "http://localhost:3000/forms";
  const formsBaseUrl = normalizeFormsBaseUrl(configuredFormsBaseUrl || fallbackBaseUrl);
  const returnUrl = `${formsBaseUrl}/app`;

  return {
    mode: "redirect" as const,
    forceRedirectUrl: returnUrl,
    signUpForceRedirectUrl: returnUrl,
  };
}
