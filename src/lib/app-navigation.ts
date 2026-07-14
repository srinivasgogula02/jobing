export const DASHBOARD_PATH = "/dashboard";
export const DASHBOARD_PAGES_PATH = "/dashboard/pages";
export const FORMS_APP_PATH = "/forms/app";
export const DEFAULT_AUTH_DESTINATION = DASHBOARD_PATH;

const AUTH_ONLY_PRODUCT_PREFIXES = [
  DASHBOARD_PATH,
  "/billing",
  "/connector/manage",
  FORMS_APP_PATH,
] as const;

export function isAuthOnlyProductPath(pathname: string) {
  return AUTH_ONLY_PRODUCT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
