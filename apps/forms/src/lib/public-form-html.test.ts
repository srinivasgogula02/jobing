import { describe, expect, it } from "vitest";
import { renderPublicForm } from "./public-form-html";

const definition = {
  schemaVersion: 1 as const,
  title: "Contact us",
  fields: [{ id: "c9317272-29fb-4ed6-92de-2aa36fa76158", key: "email", type: "email" as const, label: "Email", required: true, hidden: false }],
  confirmation: { title: "Response received", message: "Thank you." },
  settings: { allowedOrigins: [], acceptResponses: true, closedMessage: "This form is closed.", showProgress: false, submitButtonLabel: "Send response" },
  presentation: { colorMode: "dark" as const, accentColor: "#c6f24e", backgroundColor: "#0e1219", textColor: "#f2f4f7", fontFamily: "sans" as const, spacing: "comfortable" as const, buttonStyle: "solid" as const },
};

describe("renderPublicForm", () => {
  it("keeps submission immediately available without a third-party challenge", () => {
    const output = renderPublicForm({ definition, endpointId: "frm_test", action: "https://forms.jobing.site/forms/f/frm_test", submissionId: "submission-test" });

    expect(output).not.toContain("challenges.cloudflare.com");
    expect(output).not.toContain("cf-turnstile");
    expect(output).toContain('<button type="submit" data-submit-button');
    expect(output).toContain('name="_gotcha"');
    expect(output).toContain('tabindex="-1"');
    expect(output).toContain('src="/forms/public-form.js" defer');
  });

  it("preserves safe field values after validation retries", () => {
    const output = renderPublicForm({ definition, endpointId: "frm_test", action: "https://forms.jobing.site/forms/f/frm_test", submissionId: "submission-test", values: { email: 'person+retry@example.com' } });
    expect(output).toContain('value="person+retry@example.com"');
  });

  it("escapes a form-level error", () => {
    const output = renderPublicForm({ definition, endpointId: "frm_test", action: "https://forms.jobing.site/forms/f/frm_test", submissionId: "submission-test", formError: "Retry <now>" });

    expect(output).toContain("Retry &lt;now&gt;");
    expect(output).not.toContain("Retry <now>");
  });

  it("renders conditional questions and richer controls without an iframe", () => {
    const output = renderPublicForm({
      definition: {
        ...definition,
        fields: [
          { ...definition.fields[0], type: "yes_no", key: "needs_help", label: "Need help?" },
          { id: "d9317272-29fb-4ed6-92de-2aa36fa76158", key: "urgency", type: "rating", label: "Urgency", required: true, hidden: false, condition: { fieldKey: "needs_help", operator: "equals", value: "yes" } },
        ],
        settings: { ...definition.settings, showProgress: true, submitButtonLabel: "Request help" },
      },
      endpointId: "frm_test",
      action: "https://forms.jobing.site/forms/f/frm_test",
    });
    expect(output).toContain("data-condition=");
    expect(output).toContain("data-form-progress");
    expect(output).toContain(">Request help</button>");
    expect(output).not.toContain("iframe");
  });

  it("renders a clear non-interactive closed state", () => {
    const output = renderPublicForm({ definition, endpointId: "frm_test", action: "https://forms.jobing.site/forms/f/frm_test", closedMessage: "Applications reopen Monday." });
    expect(output).toContain("Responses are closed");
    expect(output).toContain("Applications reopen Monday.");
    expect(output).not.toContain("data-public-form");
  });
});
