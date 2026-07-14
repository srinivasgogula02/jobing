import { describe, expect, it } from "vitest";
import { renderPageDocument } from "./page-document";

describe("renderPageDocument", () => {
  it("injects the runtime client before body closes", () => {
    const result = renderPageDocument("<!doctype html><html><body><h1>Hello</h1></body></html>");
    expect(result).toContain('<h1>Hello</h1><script src="/_jobing/forms-client.js" defer></script></body>');
  });

  it("wraps fragments as a complete responsive document", () => {
    const result = renderPageDocument("<main>Page</main>");
    expect(result).toMatch(/^<!doctype html>/);
    expect(result).toContain('name="viewport"');
    expect(result).toContain("<main>Page</main>");
  });

  it("moves legacy form actions to the dedicated Forms deployment", () => {
    const result = renderPageDocument('<form action="https://jobing.site/f/frm_test"></form>');
    expect(result).toContain('action="https://forms.jobing.site/forms/f/frm_test"');
    expect(result).not.toContain("https://jobing.site/f/");
  });
});
