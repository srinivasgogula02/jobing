import { describe, expect, it } from "vitest";
import { createField, duplicateField, htmlSnippet, moveField, reactSnippet } from "./builder-utils";

describe("form builder utilities", () => {
  it("creates stable unique field keys", () => {
    const first = createField("email", []);
    const second = createField("email", [first]);
    expect(first.key).toBe("email");
    expect(second.key).toBe("email_2");
  });

  it("duplicates identity without mutating the original", () => {
    const first = createField("text", []);
    const copy = duplicateField(first, [first]);
    expect(copy.id).not.toBe(first.id);
    expect(copy.key).not.toBe(first.key);
    expect(first.label).toBe("Short text");
  });

  it("moves fields in either direction", () => {
    const fields = [createField("text", []), createField("email", [])];
    expect(moveField(fields, 1, 0).map((field) => field.type)).toEqual(["email", "text"]);
  });

  it("generates upload-ready native form snippets", () => {
    expect(htmlSnippet("https://forms.example/f/test")).toContain('enctype="multipart/form-data"');
    expect(reactSnippet("https://forms.example/f/test")).toContain('encType="multipart/form-data"');
  });
});
