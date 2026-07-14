import { isValidPageId } from "@/lib/page-id";

function hostnameWithoutPort(host: string): string {
  const value = host.trim().toLowerCase();
  if (value.startsWith("[")) {
    const closingBracket = value.indexOf("]");
    return closingBracket > 0 ? value.slice(1, closingBracket).replace(/\.$/, "") : "";
  }
  return (value.split(":", 1)[0] ?? "").replace(/\.$/, "");
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
    const isRootDocument = (pathSegments?.length ?? 0) === 0;
    return isRootDocument && isValidPageId(label) && !label.includes(".") ? label : null;
  }

  if (!isFallbackHost(hostname)) return null;

  if (pathSegments?.length !== 1) return null;
  const firstSegment = pathSegments?.[0]?.toLowerCase();
  return isValidPageId(firstSegment) ? firstSegment : null;
}
