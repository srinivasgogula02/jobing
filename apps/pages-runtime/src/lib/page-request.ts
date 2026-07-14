const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const RESERVED_HOSTS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "cdn",
  "dashboard",
  "forms",
  "mail",
  "status",
  "support",
  "www",
]);

function hostnameWithoutPort(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "").split(":", 1)[0] ?? "";
}

function normalizedRootDomain(rootDomain?: string): string | null {
  if (!rootDomain) return null;

  const value = rootDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/\.$/, "");

  return value && !value.includes("/") && !value.includes(":") ? value : null;
}

function validPageId(value: string | undefined): value is string {
  return Boolean(value && HOST_LABEL.test(value) && !RESERVED_HOSTS.has(value));
}

function isFallbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".vercel.app")
  );
}

export function resolvePageId(
  host: string,
  pathSegments: string[] | undefined,
  rootDomain?: string,
): string | null {
  const hostname = hostnameWithoutPort(host);
  const root = normalizedRootDomain(rootDomain);

  if (root && hostname.endsWith(`.${root}`)) {
    const label = hostname.slice(0, -(root.length + 1));
    return validPageId(label) && !label.includes(".") ? label : null;
  }

  if (!isFallbackHost(hostname)) return null;

  const firstSegment = pathSegments?.[0]?.toLowerCase();
  return validPageId(firstSegment) ? firstSegment : null;
}

