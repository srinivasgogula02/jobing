import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { getPostHogClient } from "@/lib/posthog-server";

export type ProductServerEvent =
  | "connector_oauth_completed"
  | "connector_token_completed"
  | "mcp_request_completed"
  | "mcp_tool_completed"
  | "page_deploy_completed"
  | "form_draft_completed"
  | "form_publish_completed"
  | "forms_list_completed"
  | "connector_feedback_submitted";

const ALLOWED_PROPERTIES = new Set([
  "client_type",
  "duration_ms",
  "error_code",
  "grant_age_bucket",
  "is_idempotent_replay",
  "operation",
  "outcome",
  "reason",
  "scope_count",
  "status",
  "tool_name",
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

function schedule(task: Promise<unknown>) {
  const safeTask = task.catch(() => undefined);
  try {
    waitUntil(safeTask);
  } catch {
    // Local tests and non-Vercel runtimes do not provide a request lifecycle.
    // The best-effort promise is already guarded and must never affect users.
    void safeTask;
  }
}

export function captureProductEvent(input: {
  event: ProductServerEvent;
  distinctId?: string;
  properties?: Record<string, TelemetryValue>;
}) {
  const client = getPostHogClient();
  if (!client) return;
  schedule(client.captureImmediate({
    distinctId: input.distinctId || "jobing-system",
    event: input.event,
    properties: {
      ...sanitizeTelemetryProperties(input.properties ?? {}),
      service: "main",
      environment: environment(),
      release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
      $process_person_profile: false,
    },
  }));
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
