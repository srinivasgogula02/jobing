export type ProductArea = "connector" | "notes" | "pages" | "forms" | "responses" | "feedback" | "billing" | "account" | "marketing";
export type ToolAction = "create" | "list" | "read" | "update" | "delete" | "duplicate" | "publish" | "organize" | "report";
export type AccessMode = "read" | "write" | "destructive";
export type ConnectorClientType = "chatgpt" | "claude" | "other";

export const MCP_TOOL_METADATA: Record<string, {
  productArea: ProductArea;
  toolAction: ToolAction;
  accessMode: AccessMode;
}> = {
  create_note: { productArea: "notes", toolAction: "create", accessMode: "write" },
  deploy_page: { productArea: "pages", toolAction: "create", accessMode: "write" },
  list_pages: { productArea: "pages", toolAction: "list", accessMode: "read" },
  get_page: { productArea: "pages", toolAction: "read", accessMode: "read" },
  update_page: { productArea: "pages", toolAction: "update", accessMode: "write" },
  delete_page: { productArea: "pages", toolAction: "delete", accessMode: "destructive" },
  create_form_draft: { productArea: "forms", toolAction: "create", accessMode: "write" },
  list_forms: { productArea: "forms", toolAction: "list", accessMode: "read" },
  update_form_draft: { productArea: "forms", toolAction: "update", accessMode: "write" },
  duplicate_form: { productArea: "forms", toolAction: "duplicate", accessMode: "write" },
  list_form_responses: { productArea: "responses", toolAction: "read", accessMode: "read" },
  set_form_response_state: { productArea: "responses", toolAction: "organize", accessMode: "write" },
  publish_form: { productArea: "forms", toolAction: "publish", accessMode: "write" },
  report_connector_feedback: { productArea: "feedback", toolAction: "report", accessMode: "write" },
};

export function classifyConnectorClient(redirectUris: readonly string[]): ConnectorClientType {
  for (const redirectUri of redirectUris) {
    try {
      const hostname = new URL(redirectUri).hostname.toLowerCase();
      if (hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com")) return "chatgpt";
      if (hostname === "claude.ai" || hostname.endsWith(".claude.ai")) return "claude";
    } catch {
      // Invalid redirect URIs are rejected by OAuth registration. Analytics
      // classification must never make an otherwise valid request fail.
    }
  }
  return "other";
}

export function durationBucket(milliseconds: number) {
  if (milliseconds < 250) return "lt_250ms";
  if (milliseconds < 1_000) return "250ms_1s";
  if (milliseconds < 3_000) return "1s_3s";
  if (milliseconds < 10_000) return "3s_10s";
  return "gte_10s";
}

export function countBucket(count: number) {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 5) return "2_5";
  if (count <= 20) return "6_20";
  if (count <= 100) return "21_100";
  return "gt_100";
}

export function payloadSizeBucket(characters: number) {
  if (characters < 5_000) return "lt_5k";
  if (characters < 25_000) return "5k_25k";
  if (characters < 100_000) return "25k_100k";
  return "gte_100k";
}

export function errorClass(code: string) {
  if (["invalid_connection", "insufficient_scope"].includes(code)) return "authorization";
  if (code === "invalid_input") return "validation";
  if (code.includes("limit") || code.includes("rate")) return "limit";
  if (code.endsWith("_failed") || code === "storage_unavailable" || code === "internal_error") return "dependency";
  return "product";
}

export type ProductPage = { pageName: string; productArea: ProductArea; replayEligible: boolean };

export function classifyProductPage(pathname: string): ProductPage {
  if (pathname === "/dashboard") return { pageName: "dashboard", productArea: "account", replayEligible: true };
  if (pathname.startsWith("/dashboard/pages")) return { pageName: pathname.includes("/edit") ? "page_editor" : "pages_dashboard", productArea: "pages", replayEligible: true };
  if (/^\/pages\/[^/]+\/edit$/u.test(pathname)) return { pageName: "page_editor", productArea: "pages", replayEligible: true };
  if (pathname === "/pages") return { pageName: "pages_dashboard_legacy", productArea: "pages", replayEligible: true };
  if (pathname.startsWith("/dashboard/forms")) return { pageName: pathname.includes("/edit") ? "form_editor" : "forms_dashboard", productArea: "forms", replayEligible: true };
  if (pathname.startsWith("/connector/manage")) return { pageName: "connector_manage", productArea: "connector", replayEligible: true };
  if (pathname.startsWith("/billing")) return { pageName: "billing", productArea: "billing", replayEligible: true };
  if (pathname === "/pricing") return { pageName: "pricing", productArea: "billing", replayEligible: false };
  if (pathname === "/connector") return { pageName: "connector_marketing", productArea: "connector", replayEligible: false };
  if (pathname === "/forms") return { pageName: "forms_marketing", productArea: "forms", replayEligible: false };
  if (pathname === "/") return { pageName: "homepage", productArea: "marketing", replayEligible: false };
  return { pageName: "other", productArea: "marketing", replayEligible: false };
}
