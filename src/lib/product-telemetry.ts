import * as Sentry from "@sentry/nextjs";
import { getPostHogClient } from "@/lib/posthog-server";

export type ProductServerEvent =
  | "user_signed_up"
  | "connector_oauth_completed"
  | "connector_token_completed"
  | "mcp_request_completed"
  | "mcp_tool_completed"
  | "page_deploy_completed"
  | "form_draft_completed"
  | "form_publish_completed"
  | "forms_list_completed"
  | "connector_feedback_submitted"
  | "checkout_started"
  | "checkout_failed"
  | "payment_succeeded"
  | "payment_failed"
  | "subscription_activated"
  | "subscription_cancelled";

const ALLOWED_PROPERTIES = new Set([
  "client_type",
  "access_mode",
  "duration_bucket",
  "duration_ms",
  "error_class",
  "error_code",
  "field_count_bucket",
  "feedback_kind",
  "grant_age_bucket",
  "has_file_upload",
  "has_hidden_results",
  "page_contains_form",
  "payload_size_bucket",
  "plan_key",
  "primary_scope",
  "product_area",
  "query_used",
  "resource_status",
  "response_state",
  "result_count_bucket",
  "is_idempotent_replay",
  "operation",
  "outcome",
  "reason",
  "scope_count",
  "source",
  "status",
  "tool_action",
  "tool_name",
  "use_case",
  "mcp_access_mode",
  "mcp_client_type",
  "mcp_duration_bucket",
  "mcp_duration_ms",
  "mcp_error_class",
  "mcp_error_code",
  "mcp_field_count_bucket",
  "mcp_has_file_upload",
  "mcp_has_hidden_results",
  "mcp_outcome",
  "mcp_page_contains_form",
  "mcp_payload_size_bucket",
  "mcp_plan_key",
  "mcp_primary_scope",
  "mcp_product_area",
  "mcp_query_used",
  "mcp_resource_status",
  "mcp_response_state",
  "mcp_result_count_bucket",
  "mcp_scope_count",
  "mcp_tool_action",
  "mcp_tool_name",
  "mcp_use_case",
]);

type TelemetryValue = string | number | boolean | null | undefined;

export function sanitizeTelemetryProperties(input: Record<string, TelemetryValue>) {
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_PROPERTIES.has(key) || value === null || value === undefined) continue;
    if (typeof value === "string") {
      // Product telemetry is classifications only. Discard free text rather
      // than truncating it into something that may still contain user data.
      if (value.length > 80 || !/^[a-zA-Z0-9_.:-]+$/.test(value)) continue;
      output[key] = value;
    } else if (typeof value === "number") {
      if (Number.isFinite(value)) output[key] = value;
    } else {
      output[key] = value;
    }
  }
  return output;
}

function environment() {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
}

export function captureProductEvent(input: {
  event: ProductServerEvent;
  distinctId?: string;
  properties?: Record<string, TelemetryValue>;
}) {
  try {
    const client = getPostHogClient();
    if (!client) return;
    client.capture({
      distinctId: input.distinctId || "jobing-system",
      event: input.event,
      properties: {
        ...sanitizeTelemetryProperties(input.properties ?? {}),
        service: "main",
        environment: environment(),
        release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
        $process_person_profile: false,
      },
    });
  } catch {
    // Observability can never change a user-visible product outcome.
  }
}

export function captureProductException(input: {
  errorCode: string;
  operation: string;
  toolName?: string;
}) {
  Sentry.withScope((scope) => {
    scope.setTag("service", "main");
    scope.setTag("operation", input.operation);
    scope.setTag("error_code", input.errorCode);
    if (input.toolName) scope.setTag("tool_name", input.toolName);
    // Do not send the originating exception: SDK/vendor errors can include
    // prompts, HTML, tokens, SQL, or response bodies in their message.
    Sentry.captureMessage("Unexpected product operation failure", "error");
  });
}
