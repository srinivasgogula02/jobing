function normalizeRootDomain(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/\.$/, "");
  return normalized && !normalized.includes("/") && !normalized.includes(":") ? normalized : null;
}

const FIRST_PARTY_PAGES_ORIGINS = new Set([
  "https://jobing-pages.vercel.app",
]);

export function isPagesRuntimeOrigin(origin: string | null): boolean {
  if (!origin) return false;

  let url: URL;
  try { url = new URL(origin); } catch { return false; }
  if (url.origin !== origin || url.protocol !== "https:") return false;

  if (FIRST_PARTY_PAGES_ORIGINS.has(origin)) return true;

  const exactOrigins = (process.env.PAGES_RUNTIME_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (exactOrigins.includes(origin)) return true;

  const root = normalizeRootDomain(process.env.PAGES_RUNTIME_ROOT_DOMAIN);
  if (!root || !url.hostname.endsWith(`.${root}`)) return false;
  const label = url.hostname.slice(0, -(root.length + 1));
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label) && !label.includes(".");
}
