import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTH_DESTINATION,
  FORMS_APP_PATH,
  isAuthOnlyProductPath,
} from "./app-navigation";

describe("application navigation policy", () => {
  it("returns ordinary sign-ins to the product dashboard", () => {
    expect(DEFAULT_AUTH_DESTINATION).toBe("/dashboard");
  });

  it("keeps every dashboard route outside the payment gate", () => {
    expect(isAuthOnlyProductPath("/dashboard")).toBe(true);
    expect(isAuthOnlyProductPath("/dashboard/pages")).toBe(true);
  });

  it("uses the authenticated Forms application as the only Forms destination", () => {
    expect(FORMS_APP_PATH).toBe("/dashboard/forms");
    expect(isAuthOnlyProductPath(FORMS_APP_PATH)).toBe(true);
  });

  it("does not accidentally exempt legacy paid tools", () => {
    expect(isAuthOnlyProductPath("/tools")).toBe(false);
  });
});
