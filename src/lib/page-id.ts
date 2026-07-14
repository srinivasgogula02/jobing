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

export const PAGE_ID_ERROR =
  "Use 1-63 lowercase letters, numbers, or hyphens. The page ID must start and end with a letter or number and cannot be a reserved name.";

export function normalizePageId(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidPageId(value: string): boolean {
  return (
    value.length <= PAGE_ID_MAX_LENGTH
    && PAGE_ID_PATTERN.test(value)
    && !RESERVED_PAGE_IDS.has(value)
  );
}
