import { describe, expect, it } from "vitest";
import {
  connectorDestinations,
  formNavigation,
  pageNavigation,
  recoveryUrlForConnectorError,
} from "./connector-navigation";

describe("connector navigation", () => {
  it("builds stable destinations for pages and forms", () => {
    expect(pageNavigation("launch page", "https://launch.jobing.online")).toMatchObject({
      editUrl: "https://jobing.site/pages/launch%20page/edit",
      pagesDashboardUrl: "https://jobing.site/dashboard/pages",
    });
    expect(formNavigation("4e279eaf-0a6e-48de-a66e-3c819f3fb756", "https://forms.jobing.site/forms/f/frm_live")).toMatchObject({
      liveUrl: "https://forms.jobing.site/forms/f/frm_live",
      responsesUrl: "https://jobing.site/dashboard/forms/4e279eaf-0a6e-48de-a66e-3c819f3fb756",
      editUrl: "https://jobing.site/dashboard/forms/4e279eaf-0a6e-48de-a66e-3c819f3fb756/edit",
      shareUrl: "https://jobing.site/dashboard/forms/4e279eaf-0a6e-48de-a66e-3c819f3fb756/share",
    });
  });

  it("routes recoverable failures to the relevant place", () => {
    expect(recoveryUrlForConnectorError("insufficient_scope")).toBe(connectorDestinations.connectorManageUrl);
    expect(recoveryUrlForConnectorError("form_limit_reached")).toBe("https://jobing.site/pricing?from=connector-limit");
    expect(recoveryUrlForConnectorError("page_id_taken")).toBe(connectorDestinations.pagesDashboardUrl);
    expect(recoveryUrlForConnectorError("internal_error")).toBeUndefined();
  });
});
