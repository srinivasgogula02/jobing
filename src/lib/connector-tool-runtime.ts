import "server-only";

import { z } from "zod";
import { ConnectorAuthError, requireConnectorActor, type ConnectorAuthInfo } from "@/lib/connector-auth";
import { ConnectedToolError } from "@/lib/connected-tools";
import { ConnectorFeedbackError } from "@/lib/connector-feedback";
import { FormsServiceError, type FormsActor } from "@/lib/forms-service";
import type { OAuthScope } from "@/lib/oauth-scopes";
import { captureProductEvent, captureProductException } from "@/lib/product-telemetry";
import { MCP_TOOL_METADATA } from "@/lib/product-analytics-contract";
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
  list_form_integrations: "form_integrations_list_completed",
  publish_form: "form_publish_completed",
  report_connector_feedback: "connector_feedback_submitted",
} as const;

const SAFE_CODE = /^[a-z][a-z0-9_]{0,79}$/;

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
  const clientType = input.authInfo?.extra?.clientType;
  const metadata = MCP_TOOL_METADATA[input.toolName];
  try {
    const actor = requireConnectorActor(input.authInfo, input.requiredScope);
    const result = await input.execute(actor);
    const outcomeEvent = COMPLETED_OUTCOME_EVENTS[input.toolName as keyof typeof COMPLETED_OUTCOME_EVENTS];
    if (outcomeEvent) {
      const resultProperties = input.resultProperties?.(result);
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
    if (failure.operational) captureProductException({ errorCode: failure.code, operation: "mcp_tool", toolName: input.toolName });
    return toolError(failure);
  }
}
