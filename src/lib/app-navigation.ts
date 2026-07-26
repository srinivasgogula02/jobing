export const DASHBOARD_PATH = "/dashboard";
export const DASHBOARD_PAGES_PATH = "/dashboard/pages";
export const FORMS_APP_PATH = "/dashboard/forms";
export const DEFAULT_AUTH_DESTINATION = DASHBOARD_PATH;
export const DOCS_URL = "https://docs.jobing.site";
export const DOCS_CONNECTING_URL = `${DOCS_URL}/connecting/overview`;
export const DOCS_PERMISSIONS_URL = `${DOCS_URL}/connecting/permissions`;

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
