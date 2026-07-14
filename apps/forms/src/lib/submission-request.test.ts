import { describe, expect, it } from "vitest";
import { parseSubmissionRequest, SubmissionRequestError } from "./submission-request";

describe("parseSubmissionRequest", () => {
  it("accepts JSON sent by generated Jobing pages", async () => {
    const request = new Request("https://forms.jobing.site/forms/f/frm_test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ravi", interests: ["design", "sales"], seats: 2 }),
    });
    const result = await parseSubmissionRequest(request);
    expect(result.isJson).toBe(true);
    expect(result.data.get("name")).toBe("Ravi");
    expect(result.data.getAll("interests")).toEqual(["design", "sales"]);
    expect(result.data.get("seats")).toBe("2");
  });

  it("continues to accept native FormData", async () => {
    const body = new FormData();
    body.set("email", "person@example.com");
    const result = await parseSubmissionRequest(new Request("https://example.com", { method: "POST", body }));
    expect(result.isJson).toBe(false);
    expect(result.data.get("email")).toBe("person@example.com");
  });

  it("accepts native URL-encoded forms", async () => {
    const result = await parseSubmissionRequest(new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "name=Ravi&interest=design&interest=sales",
    }));
    expect(result.data.get("name")).toBe("Ravi");
    expect(result.data.getAll("interest")).toEqual(["design", "sales"]);
  });

  it("rejects unsupported media types", async () => {
    const request = new Request("https://example.com", { method: "POST", headers: { "content-type": "text/plain" }, body: "name=Ravi" });
    await expect(parseSubmissionRequest(request)).rejects.toMatchObject({ code: "unsupported_media_type" });
  });

  it("rejects oversized JSON even when content-length is absent", async () => {
    const request = new Request("https://example.com", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ field: "a".repeat(300) }) });
    await expect(parseSubmissionRequest(request, 100)).rejects.toMatchObject({ code: "request_too_large" });
  });

  it.each([
    "{broken",
    JSON.stringify(["not", "an", "object"]),
    JSON.stringify({ field: { nested: "objects are not form values" } }),
  ])("rejects unsafe or malformed JSON", async (body) => {
    const request = new Request("https://example.com", { method: "POST", headers: { "content-type": "application/json" }, body });
    await expect(parseSubmissionRequest(request)).rejects.toBeInstanceOf(SubmissionRequestError);
  });
});
