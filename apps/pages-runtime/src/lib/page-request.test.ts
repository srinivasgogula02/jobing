import { describe, expect, it } from "vitest";
import { resolvePageId } from "@/lib/page-request";

describe("resolvePageId", () => {
  it("resolves one page per wildcard subdomain", () => expect(resolvePageId("heusue.pages.example", [], "pages.example")).toBe("heusue"));
  it("supports Vercel and localhost path fallback", () => {
    expect(resolvePageId("jobing-pages.vercel.app", ["heusue"], "pages.example")).toBe("heusue");
    expect(resolvePageId("localhost:3002", ["demo"], "pages.example")).toBe("demo");
  });
  it("rejects apex, nested, reserved and malformed hosts", () => {
    expect(resolvePageId("pages.example", [], "pages.example")).toBeNull();
    expect(resolvePageId("a.b.pages.example", [], "pages.example")).toBeNull();
    expect(resolvePageId("www.pages.example", [], "pages.example")).toBeNull();
    expect(resolvePageId("bad_name.pages.example", [], "pages.example")).toBeNull();
  });
});
