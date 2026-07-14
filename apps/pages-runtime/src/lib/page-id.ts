// Keep this deployment-local contract aligned with src/lib/page-id.ts. The
// Pages Runtime is installed and deployed independently from the main app.
export const PAGE_ID_MAX_LENGTH = 63;
export const PAGE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const RESERVED_PAGE_IDS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "cdn",
  "copy",
  "create",
  "dashboard",
  "delete",
  "edit",
  "forms",
  "login",
  "logout",
  "mail",
  "new",
  "settings",
  "signup",
  "status",
  "support",
  "tools",
  "www",
]);

export function isValidPageId(value: string | undefined): value is string {
  return Boolean(
    value
    && value.length <= PAGE_ID_MAX_LENGTH
    && PAGE_ID_PATTERN.test(value)
    && !RESERVED_PAGE_IDS.has(value),
  );
}
