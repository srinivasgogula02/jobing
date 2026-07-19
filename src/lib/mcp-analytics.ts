import "server-only";

import {
  instrument,
  type MCPAnalyticsOptions,
  type McpAnalytics,
} from "@posthog/mcp";
import type { ConnectorAuthInfo } from "@/lib/connector-auth";
import { getPostHogMcpClient } from "@/lib/posthog-server";
import {
  MCP_TOOL_METADATA,
  MCP_USE_CASES,
  payloadSizeBucket,
} from "@/lib/product-analytics-contract";

const USE_CASES = new Set<string>(MCP_USE_CASES);
const PRIVATE_MCP_PROPERTIES = [
  "$mcp_parameters",
  "$mcp_response",
  "$mcp_error_message",
] as const;

type RequestExtraWithAuth = {
  authInfo?: ConnectorAuthInfo;
};

function authInfoFromExtra(extra: unknown): ConnectorAuthInfo | undefined {
  if (!extra || typeof extra !== "object") return undefined;
  return (extra as RequestExtraWithAuth).authInfo;
}

function safeUseCase(value: unknown): string | undefined {
  return typeof value === "string" && USE_CASES.has(value) ? value : undefined;
}

function toolArguments(request: { params?: { arguments?: Record<string, unknown> } }) {
  return request.params?.arguments ?? {};
}

export function sanitizeMcpIntent(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const sanitized = value
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/<[^>]{1,500}>/gu, "[markup]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email]")
    .replace(/\b(?:https?:\/\/|www\.)[^\s]+/giu, "[link]")
    .replace(/\b(?:bearer\s+)?(?:sk|phc|phx|cfut)_[A-Za-z0-9_-]{12,}\b/giu, "[secret]")
    .replace(/(?:\+?\d[\d ().-]{7,}\d)/gu, "[phone]")
    .replace(/\s+/gu, " ")
    .trim();
  if (!sanitized) return undefined;
  return sanitized.slice(0, 320);
}

function redactMcpEvent<T extends { properties: Record<string, unknown> }>(event: T): T {
  for (const property of PRIVATE_MCP_PROPERTIES) delete event.properties[property];
  const intent = sanitizeMcpIntent(event.properties.$mcp_intent);
  if (intent) event.properties.$mcp_intent = intent;
  else delete event.properties.$mcp_intent;
  return event;
}

export function createJobingMcpAnalyticsOptions(): MCPAnalyticsOptions {
  return {
    context: {
      description: "Describe the user's underlying goal in one short sentence. Do not include names, emails, phone numbers, URLs, credentials, copied text, HTML, or form answers.",
    },
    reportMissing: true,
    missingCapabilityToolName: "get_more_tools",
    enableConversationId: false,
    // Sentry already receives privacy-safe operational incidents. The canonical
    // MCP event still carries $mcp_is_error without duplicating raw exceptions.
    enableExceptionAutocapture: false,
    identify: async (_request, extra) => {
      const userId = authInfoFromExtra(extra)?.extra?.userId;
      return typeof userId === "string" ? { distinctId: userId } : null;
    },
    intentFallback: (request) => {
      const toolName = request.params?.name;
      const useCase = safeUseCase(toolArguments(request).useCase);
      if (useCase) return `Use Jobing for ${useCase.replaceAll("_", " ")}`;
      const metadata = toolName ? MCP_TOOL_METADATA[toolName] : undefined;
      return metadata ? `${metadata.toolAction} ${metadata.productArea} with Jobing` : null;
    },
    eventProperties: (request, extra) => {
      const toolName = request.params?.name;
      const metadata = toolName ? MCP_TOOL_METADATA[toolName] : undefined;
      const args = toolArguments(request);
      const clientType = authInfoFromExtra(extra)?.extra?.clientType;
      const html = typeof args.html === "string" ? args.html : undefined;
      const content = typeof args.content === "string" ? args.content : undefined;
      const useCase = safeUseCase(args.useCase);

      return {
        service: "main",
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
        ...(metadata ? {
          product_area: metadata.productArea,
          tool_action: metadata.toolAction,
          access_mode: metadata.accessMode,
        } : {}),
        ...(typeof clientType === "string" ? { client_type: clientType } : {}),
        ...(useCase ? { use_case: useCase } : {}),
        ...(typeof args.query === "string" ? { query_used: args.query.trim().length > 0 } : {}),
        ...(typeof args.state === "string" ? { response_state: args.state } : {}),
        ...(html ? {
          page_contains_form: /<form\b/iu.test(html),
          payload_size_bucket: payloadSizeBucket(html.length),
        } : content ? { payload_size_bucket: payloadSizeBucket(content.length) } : {}),
      };
    },
    beforeSend: redactMcpEvent,
  };
}

export function instrumentJobingMcpServer(server: unknown): McpAnalytics | null {
  const posthog = getPostHogMcpClient();
  if (!posthog) return null;
  return instrument(server, posthog, createJobingMcpAnalyticsOptions());
}
