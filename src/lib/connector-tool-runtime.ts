import "server-only";

import { z } from "zod";
import { ConnectorAuthError, requireConnectorActor, type ConnectorAuthInfo } from "@/lib/connector-auth";
import { ConnectedToolError } from "@/lib/connected-tools";
import { ConnectorFeedbackError } from "@/lib/connector-feedback";
import { FormsServiceError, type FormsActor } from "@/lib/forms-service";
import type { OAuthScope } from "@/lib/oauth-scopes";
import { captureProductEvent, captureProductException } from "@/lib/product-telemetry";
import { durationBucket, errorClass, MCP_TOOL_METADATA } from "@/lib/product-analytics-contract";
import { recoveryUrlForConnectorError } from "@/lib/connector-navigation";

export type PublicToolFailure = {
  code: string;
  message: string;
  operational: boolean;
};

const COMPLETED_OUTCOME_EVENTS = {
  deploy_page: "page_deploy_completed",
  create_form_draft: "form_draft_completed",
  list_forms: "forms_list_completed",
  publish_form: "form_publish_completed",
  report_connector_feedback: "connector_feedback_submitted",
} as const;

const SAFE_CODE = /^[a-z][a-z0-9_]{0,79}$/;

type TelemetryProperty = string | number | boolean | null | undefined;

const MCP_PROPERTY_ALIASES = {
  access_mode: "mcp_access_mode",
  client_type: "mcp_client_type",
  duration_bucket: "mcp_duration_bucket",
  duration_ms: "mcp_duration_ms",
  error_class: "mcp_error_class",
  error_code: "mcp_error_code",
  field_count_bucket: "mcp_field_count_bucket",
  has_file_upload: "mcp_has_file_upload",
  has_hidden_results: "mcp_has_hidden_results",
  page_contains_form: "mcp_page_contains_form",
  payload_size_bucket: "mcp_payload_size_bucket",
  plan_key: "mcp_plan_key",
  primary_scope: "mcp_primary_scope",
  product_area: "mcp_product_area",
  query_used: "mcp_query_used",
  resource_status: "mcp_resource_status",
  response_state: "mcp_response_state",
  result_count_bucket: "mcp_result_count_bucket",
  scope_count: "mcp_scope_count",
  tool_action: "mcp_tool_action",
  tool_name: "mcp_tool_name",
  outcome: "mcp_outcome",
  use_case: "mcp_use_case",
} as const;

export function addMcpPropertyAliases(properties: Record<string, TelemetryProperty>) {
  const aliases: Record<string, TelemetryProperty> = {};
  for (const [source, target] of Object.entries(MCP_PROPERTY_ALIASES)) {
    const value = properties[source];
    if (value !== null && value !== undefined) aliases[target] = value;
  }
  return { ...properties, ...aliases };
}

export function normalizeConnectorToolFailure(error: unknown, fallback: string): PublicToolFailure {
  if (error instanceof ConnectorAuthError) return { code: error.code, message: error.message, operational: false };
  if (error instanceof ConnectedToolError) {
    return { code: error.code, message: error.message, operational: error.code.endsWith("_failed") };
  }
  if (error instanceof FormsServiceError) {
    const code = SAFE_CODE.test(error.code) ? error.code : "forms_error";
    return { code, message: error.message, operational: error.status >= 500 };
  }
  if (error instanceof ConnectorFeedbackError) {
    return { code: error.code, message: error.message, operational: error.code === "storage_unavailable" };
  }
  if (error instanceof z.ZodError) return { code: "invalid_input", message: "The tool input is invalid.", operational: false };
  return { code: "internal_error", message: fallback, operational: true };
}

function toolError(failure: PublicToolFailure) {
  const recoveryUrl = recoveryUrlForConnectorError(failure.code);
  const message = recoveryUrl && !failure.message.includes(recoveryUrl)
    ? `${failure.message} Continue here: ${recoveryUrl}`
    : failure.message;
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
    ...(recoveryUrl ? { structuredContent: { error: { code: failure.code, message, recoveryUrl } } } : {}),
  };
}

export async function runConnectorTool<T>(input: {
  toolName: string;
  authInfo: ConnectorAuthInfo | undefined;
  requiredScope: OAuthScope | readonly OAuthScope[];
  fallback: string;
  execute: (actor: FormsActor) => Promise<T>;
  properties?: Record<string, string | number | boolean | null | undefined>;
  resultProperties?: (result: T) => Record<string, string | number | boolean | null | undefined>;
}): Promise<T | ReturnType<typeof toolError>> {
  const startedAt = performance.now();
  const possibleUserId = input.authInfo?.extra?.userId;
  const distinctId = typeof possibleUserId === "string" ? possibleUserId : undefined;
  const clientType = input.authInfo?.extra?.clientType;
  const metadata = MCP_TOOL_METADATA[input.toolName];
  const requiredScopes = Array.isArray(input.requiredScope) ? input.requiredScope : [input.requiredScope];
  try {
    const actor = requireConnectorActor(input.authInfo, input.requiredScope);
    const result = await input.execute(actor);
    const elapsed = Math.max(0, Math.round(performance.now() - startedAt));
    const resultProperties = input.resultProperties?.(result);
    const successProperties = {
      tool_name: input.toolName,
      product_area: metadata?.productArea ?? "connector",
      tool_action: metadata?.toolAction ?? "other",
      access_mode: metadata?.accessMode ?? "write",
      primary_scope: requiredScopes[0],
      scope_count: requiredScopes.length,
      outcome: "success",
      duration_ms: elapsed,
      duration_bucket: durationBucket(elapsed),
      client_type: typeof clientType === "string" ? clientType : "other",
      use_case: input.properties?.use_case ?? "unspecified",
      ...input.properties,
      ...resultProperties,
    };
    captureProductEvent({
      event: "mcp_tool_completed",
      distinctId: actor.userId,
      properties: addMcpPropertyAliases(successProperties),
    });
    const outcomeEvent = COMPLETED_OUTCOME_EVENTS[input.toolName as keyof typeof COMPLETED_OUTCOME_EVENTS];
    if (outcomeEvent) {
      captureProductEvent({
        event: outcomeEvent,
        distinctId: actor.userId,
        properties: {
          source: "connector",
          product_area: metadata?.productArea ?? "connector",
          client_type: typeof clientType === "string" ? clientType : "other",
          outcome: "success",
          ...input.properties,
          ...resultProperties,
        },
      });
    }
    return result;
  } catch (error) {
    const failure = normalizeConnectorToolFailure(error, input.fallback);
    const elapsed = Math.max(0, Math.round(performance.now() - startedAt));
    const errorProperties = {
      tool_name: input.toolName,
      product_area: metadata?.productArea ?? "connector",
      tool_action: metadata?.toolAction ?? "other",
      access_mode: metadata?.accessMode ?? "write",
      primary_scope: requiredScopes[0],
      scope_count: requiredScopes.length,
      outcome: "error",
      error_code: failure.code,
      error_class: errorClass(failure.code),
      duration_ms: elapsed,
      duration_bucket: durationBucket(elapsed),
      client_type: typeof clientType === "string" ? clientType : "other",
      use_case: input.properties?.use_case ?? "unspecified",
      ...input.properties,
    };
    captureProductEvent({
      event: "mcp_tool_completed",
      distinctId,
      properties: addMcpPropertyAliases(errorProperties),
    });
    if (failure.operational) captureProductException({ errorCode: failure.code, operation: "mcp_tool", toolName: input.toolName });
    return toolError(failure);
  }
}
