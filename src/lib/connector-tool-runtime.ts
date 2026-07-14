import "server-only";

import { z } from "zod";
import { ConnectorAuthError, requireConnectorActor, type ConnectorAuthInfo } from "@/lib/connector-auth";
import { ConnectedToolError } from "@/lib/connected-tools";
import { ConnectorFeedbackError } from "@/lib/connector-feedback";
import { FormsServiceError, type FormsActor } from "@/lib/forms-service";
import type { OAuthScope } from "@/lib/oauth-scopes";
import { captureProductEvent, captureProductException } from "@/lib/product-telemetry";

export type PublicToolFailure = {
  code: string;
  message: string;
  operational: boolean;
};

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
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: failure.message }],
  };
}

export async function runConnectorTool<T>(input: {
  toolName: string;
  authInfo: ConnectorAuthInfo | undefined;
  requiredScope: OAuthScope;
  fallback: string;
  execute: (actor: FormsActor) => Promise<T>;
}): Promise<T | ReturnType<typeof toolError>> {
  const startedAt = performance.now();
  let distinctId: string | undefined;
  try {
    const actor = requireConnectorActor(input.authInfo, input.requiredScope);
    distinctId = actor.userId;
    const result = await input.execute(actor);
    captureProductEvent({
      event: "mcp_tool_completed",
      distinctId,
      properties: {
        tool_name: input.toolName,
        outcome: "success",
        duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
        client_type: "oauth",
      },
    });
    return result;
  } catch (error) {
    const failure = normalizeConnectorToolFailure(error, input.fallback);
    captureProductEvent({
      event: "mcp_tool_completed",
      distinctId,
      properties: {
        tool_name: input.toolName,
        outcome: "error",
        error_code: failure.code,
        duration_ms: Math.max(0, Math.round(performance.now() - startedAt)),
        client_type: "oauth",
      },
    });
    if (failure.operational) captureProductException({ errorCode: failure.code, operation: "mcp_tool", toolName: input.toolName });
    return toolError(failure);
  }
}
