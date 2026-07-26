import type { FormIntegration } from "@/lib/forms-service";

export type FormIntegrationDisplayState =
  | "available"
  | "connected"
  | "paused"
  | "queued"
  | "retrying"
  | "failed";

export type FormIntegrationStatus = {
  state: FormIntegrationDisplayState;
  badge: string;
  headline: string;
  detail: string;
  action: string | null;
  pendingLabel: "In queue" | "Retrying";
};

function plural(count: number, singular: string, multiple = `${singular}s`) {
  return `${count} ${count === 1 ? singular : multiple}`;
}

function providerErrorExplanation(code: string | null, providerName: string) {
  if (!code) {
    return {
      detail: `${providerName} did not accept the delivery. Your response is still saved in Jobing Forms.`,
      action: "Open the connection settings below, check every value, and save again.",
    };
  }

  const httpStatus = /^provider_http_(\d{3})$/u.exec(code)?.[1];
  if (httpStatus) {
    const status = Number(httpStatus);
    if (status === 401 || status === 403) {
      return {
        detail: `${providerName} rejected the saved credentials or does not allow this action.`,
        action: "Replace the credential below, confirm it has the required access, and save again.",
      };
    }
    if (status === 404) {
      return {
        detail: `${providerName} could not find the connected destination.`,
        action: "Check the destination ID, table, sheet, channel, or URL below, then save again.",
      };
    }
    if (status === 408 || status === 425 || status === 429) {
      return {
        detail: status === 429
          ? `${providerName} is temporarily limiting requests.`
          : `${providerName} was not ready before this delivery timed out.`,
        action: "No action is needed yet. Jobing will try again automatically.",
      };
    }
    if (status >= 500) {
      return {
        detail: `${providerName} is temporarily unavailable.`,
        action: "No action is needed yet. Jobing will try again automatically.",
      };
    }
    if (status === 400 || status === 409 || status === 413 || status === 422) {
      return {
        detail: `${providerName} rejected the destination settings or response data.`,
        action: "Check the IDs and field mappings below, then save again.",
      };
    }
    return {
      detail: `${providerName} rejected the delivery with HTTP ${status}.`,
      action: "Check the connection settings below and save again.",
    };
  }

  switch (code) {
    case "integration_timeout":
      return {
        detail: `${providerName} took too long to respond.`,
        action: "No action is needed yet. Jobing will try again automatically.",
      };
    case "integration_dns_failed":
      return {
        detail: `Jobing could not find the server for this ${providerName} destination.`,
        action: "Check the destination URL or try again after its DNS is available.",
      };
    case "integration_connection_refused":
      return {
        detail: `The ${providerName} destination refused the connection.`,
        action: "Confirm the destination is online and accepts secure HTTPS requests.",
      };
    case "integration_connection_interrupted":
      return {
        detail: `The connection to ${providerName} ended before the delivery completed.`,
        action: "No action is needed yet. Jobing will try again automatically.",
      };
    case "integration_tls_failed":
      return {
        detail: `Jobing could not establish a secure connection to ${providerName}.`,
        action: "Check the destination's HTTPS certificate before trying again.",
      };
    case "integration_response_too_large":
      return {
        detail: `${providerName} returned a response that was too large to process safely.`,
        action: "Check the destination and contact support if it continues.",
      };
    case "integration_url_not_allowed":
    case "integration_host_not_allowed":
    case "integration_destination_not_public":
      return {
        detail: "The destination is private, insecure, or not allowed.",
        action: "Use a public HTTPS destination without redirects to a private network.",
      };
    case "integration_secret_missing":
    case "integration_secret_invalid":
      return {
        detail: `The saved ${providerName} connection details are incomplete or unreadable.`,
        action: "Enter the credential again below and save the connection.",
      };
    case "integration_configuration_invalid":
      return {
        detail: `The saved ${providerName} settings are incomplete or no longer valid.`,
        action: "Review the fields below and save the connection again.",
      };
    case "integration_encryption_key_unavailable":
    case "integration_encryption_key_invalid":
    case "email_integration_not_configured":
      return {
        detail: "Jobing's delivery service is not configured correctly.",
        action: "Your response is safe. Contact Jobing support and include this integration name.",
      };
    case "mailchimp_api_key_invalid":
      return {
        detail: "The Mailchimp API key is not in the expected format.",
        action: "Copy a complete Mailchimp API key, including its data-center suffix, and save again.",
      };
    case "integration_request_failed":
      return {
        detail: `Jobing could not complete the connection to ${providerName}. The response is still saved.`,
        action: "Check the connection details below. Jobing will also retry temporary connection failures.",
      };
    default:
      if (code.startsWith("google_auth_http_")) {
        return {
          detail: "Google rejected the service account authorization request.",
          action: "Check the service account JSON and confirm the target file is shared with its email address.",
        };
      }
      return {
        detail: `${providerName} did not accept the delivery. Your response is still saved in Jobing Forms.`,
        action: "Check the connection settings below and save again.",
      };
  }
}

function happenedAfter(later: string | null, earlier: string | null) {
  if (!later || !earlier) return false;
  const laterTime = Date.parse(later);
  const earlierTime = Date.parse(earlier);
  return Number.isFinite(laterTime) && Number.isFinite(earlierTime) && laterTime > earlierTime;
}

export function getFormIntegrationStatus(
  integration: FormIntegration | undefined,
  providerName: string,
): FormIntegrationStatus {
  if (!integration) {
    return {
      state: "available",
      badge: "Available",
      headline: `Connect ${providerName}`,
      detail: `New responses can be sent to ${providerName}.`,
      action: null,
      pendingLabel: "In queue",
    };
  }

  if (integration.status === "paused") {
    return {
      state: "paused",
      badge: "Paused",
      headline: "Delivery is paused",
      detail: `New responses are being saved, but they are not being sent to ${providerName}.`,
      action: "Resume delivery when you are ready to send new responses again.",
      pendingLabel: integration.lastErrorCode ? "Retrying" : "In queue",
    };
  }

  const explanation = providerErrorExplanation(integration.lastErrorCode, providerName);
  const recovered = happenedAfter(integration.lastSuccessAt, integration.lastFailureAt);
  if (integration.failedDeliveries > 0) {
    if (recovered && !integration.lastErrorCode) {
      return {
        state: "connected",
        badge: "Connected",
        headline: "Delivery is working again",
        detail: `The latest response was delivered to ${providerName}.`,
        action: `${plural(integration.failedDeliveries, "older delivery")} stopped retrying before the connection recovered and remains saved in Jobing Forms.`,
        pendingLabel: "In queue",
      };
    }
    return {
      state: "failed",
      badge: "Needs attention",
      headline: `${plural(integration.failedDeliveries, "delivery")} could not be sent`,
      detail: explanation.detail,
      action: `${explanation.action} Deliveries that stopped retrying remain saved in Jobing Forms.`,
      pendingLabel: integration.lastErrorCode ? "Retrying" : "In queue",
    };
  }

  if (integration.pendingDeliveries > 0 && integration.lastErrorCode) {
    return {
      state: "retrying",
      badge: "Retrying",
      headline: `Retrying ${plural(integration.pendingDeliveries, "delivery")}`,
      detail: explanation.detail,
      action: explanation.action,
      pendingLabel: "Retrying",
    };
  }

  if (integration.pendingDeliveries > 0) {
    return {
      state: "queued",
      badge: "Sending",
      headline: `${plural(integration.pendingDeliveries, "delivery")} waiting to send`,
      detail: `The responses are safely stored and waiting to be delivered to ${providerName}.`,
      action: "No action is needed.",
      pendingLabel: "In queue",
    };
  }

  if (integration.lastSuccessAt) {
    return {
      state: "connected",
      badge: "Connected",
      headline: "Delivery is working",
      detail: `The latest response was delivered to ${providerName}.`,
      action: null,
      pendingLabel: "In queue",
    };
  }

  return {
    state: "connected",
    badge: "Connected",
    headline: "Waiting for the first response",
    detail: `The connection is ready. A delivery will be created when this form receives a valid response.`,
    action: null,
    pendingLabel: "In queue",
  };
}
