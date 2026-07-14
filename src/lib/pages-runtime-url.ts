const DEFAULT_RUNTIME_URL = "https://jobing-pages.vercel.app";
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function pagesRootDomain(): string | null {
  const configured = process.env.NEXT_PUBLIC_PAGES_ROOT_DOMAIN;
  if (!configured) return null;
  const value = configured
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/\.$/, "");
  return DOMAIN_PATTERN.test(value) ? value : null;
}

function runtimeUrl(): string {
  return (process.env.NEXT_PUBLIC_PAGES_RUNTIME_URL || DEFAULT_RUNTIME_URL).replace(/\/+$/, "");
}

export function publicPageUrl(id: string): string {
  const rootDomain = pagesRootDomain();
  if (rootDomain) return `https://${id}.${rootDomain}`;

  return `${runtimeUrl()}/${encodeURIComponent(id)}`;
}

export function publicPageAddress(id: string): string {
  return publicPageUrl(id).replace(/^https?:\/\//, "");
}

export function publicPageAddressAffixes(): { prefix: string; suffix: string } {
  const rootDomain = pagesRootDomain();
  if (rootDomain) return { prefix: "", suffix: `.${rootDomain}` };
  return { prefix: `${runtimeUrl().replace(/^https?:\/\//, "")}/`, suffix: "" };
}
