const JOBING_ORIGIN = "https://jobing.site";

export const connectorDestinations = {
  dashboardUrl: `${JOBING_ORIGIN}/dashboard`,
  pagesDashboardUrl: `${JOBING_ORIGIN}/dashboard/pages`,
  formsDashboardUrl: `${JOBING_ORIGIN}/dashboard/forms`,
  connectorManageUrl: `${JOBING_ORIGIN}/connector/manage`,
  pricingUrl: `${JOBING_ORIGIN}/pricing`,
} as const;

export type ConnectorNextAction = {
  label: string;
  url: string;
};

export function pageNavigation(pageId: string, liveUrl?: string, includeNextActions = true) {
  const encodedId = encodeURIComponent(pageId);
  const editUrl = `${JOBING_ORIGIN}/pages/${encodedId}/edit`;
  const nextActions = [
    ...(liveUrl ? [{ label: "View live page", url: liveUrl }] : []),
    { label: "Edit page", url: editUrl },
    { label: "Open all pages", url: connectorDestinations.pagesDashboardUrl },
  ] satisfies ConnectorNextAction[];
  return {
    ...(liveUrl ? { liveUrl } : {}),
    editUrl,
    pagesDashboardUrl: connectorDestinations.pagesDashboardUrl,
    ...(includeNextActions ? { nextActions } : {}),
  };
}

export function formNavigation(formId: string, liveUrl?: string, includeNextActions = true) {
  const encodedId = encodeURIComponent(formId);
  const responsesUrl = `${JOBING_ORIGIN}/dashboard/forms/${encodedId}`;
  const editUrl = `${responsesUrl}/edit`;
  const shareUrl = `${responsesUrl}/share`;
  const integrationsUrl = `${responsesUrl}/integrations`;
  const nextActions = [
    ...(liveUrl ? [{ label: "Open live form", url: liveUrl }] : []),
    { label: "View responses", url: responsesUrl },
    { label: "Edit form", url: editUrl },
    { label: "Share or embed form", url: shareUrl },
    { label: "Connect other apps", url: integrationsUrl },
    { label: "Open all forms", url: connectorDestinations.formsDashboardUrl },
  ] satisfies ConnectorNextAction[];
  return {
    ...(liveUrl ? { liveUrl } : {}),
    responsesUrl,
    editUrl,
    shareUrl,
    integrationsUrl,
    formsDashboardUrl: connectorDestinations.formsDashboardUrl,
    ...(includeNextActions ? { nextActions } : {}),
  };
}

export function noteNavigation(noteUrl: string) {
  return {
    nextActions: [{ label: "Open note", url: noteUrl }] satisfies ConnectorNextAction[],
  };
}

export function recoveryUrlForConnectorError(code: string) {
  if (code === "insufficient_scope" || code === "invalid_token" || code === "missing_auth") {
    return connectorDestinations.connectorManageUrl;
  }
  if (code === "form_limit_reached") return `${connectorDestinations.pricingUrl}?from=connector-limit`;
  if (code.startsWith("form_") || code === "stale_revision" || code === "response_not_found") {
    return connectorDestinations.formsDashboardUrl;
  }
  if (code.startsWith("page_")) return connectorDestinations.pagesDashboardUrl;
  return undefined;
}
