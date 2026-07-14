const DEFAULT_RUNTIME_URL = "https://jobing-pages.vercel.app";

export function publicPageUrl(id: string): string {
  const rootDomain = process.env.NEXT_PUBLIC_PAGES_ROOT_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (rootDomain) return `https://${id}.${rootDomain}`;

  const runtimeUrl = (process.env.NEXT_PUBLIC_PAGES_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/$/, "");
  return `${runtimeUrl}/${encodeURIComponent(id)}`;
}

export function publicPageAddress(id: string): string {
  return publicPageUrl(id).replace(/^https?:\/\//, "");
}

