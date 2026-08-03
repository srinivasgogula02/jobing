import { describe, expect, it } from "vitest";
import { resolveCustomPageRequest, resolvePageId } from "@/lib/page-request";

describe("resolvePageId", () => {
  it("resolves one page per wildcard subdomain at its root document", () => {
    expect(resolvePageId("freshmart-job-application.jobing.online", [], "jobing.online")).toBe("freshmart-job-application");
    expect(resolvePageId("LAUNCH.JOBING.ONLINE.:443", undefined, "https://jobing.online/")).toBe("launch");
  });

  it("supports Vercel and localhost path fallback", () => {
    expect(resolvePageId("jobing-pages.vercel.app", ["heusue"], "jobing.online")).toBe("heusue");
    expect(resolvePageId("localhost:3002", ["demo"], "pages.example")).toBe("demo");
    expect(resolvePageId("[::1]:3002", ["demo"], "pages.example")).toBe("demo");
  });

  it("does not serve the page document for wildcard asset or nested paths", () => {
    expect(resolvePageId("launch.jobing.online", ["favicon.ico"], "jobing.online")).toBeNull();
    expect(resolvePageId("launch.jobing.online", ["anything"], "jobing.online")).toBeNull();
    expect(resolvePageId("jobing-pages.vercel.app", ["launch", "anything"], "jobing.online")).toBeNull();
    expect(resolvePageId("jobing-pages.vercel.app", [], "jobing.online")).toBeNull();
  });

  it("rejects apex, nested, reserved, overlong, and malformed hosts", () => {
    expect(resolvePageId("jobing.online", [], "jobing.online")).toBeNull();
    expect(resolvePageId("a.b.jobing.online", [], "jobing.online")).toBeNull();
    expect(resolvePageId("www.jobing.online", [], "jobing.online")).toBeNull();
    expect(resolvePageId("bad_name.jobing.online", [], "jobing.online")).toBeNull();
    expect(resolvePageId(`${"a".repeat(64)}.jobing.online`, [], "jobing.online")).toBeNull();
  });

  it("does not trust lookalike or unconfigured hosts", () => {
    expect(resolvePageId("launch.jobing.online.evil.example", [], "jobing.online")).toBeNull();
    expect(resolvePageId("launch.example.com", [], "jobing.online")).toBeNull();
  });
});

describe("resolveCustomPageRequest", () => {
  it("accepts one editable path on an exact customer hostname", () => {
    expect(resolveCustomPageRequest("Pages.Example.com:443", ["Contact"], "jobing.online"))
      .toEqual({ hostname: "pages.example.com", path: "contact" });
  });

  it.each([
    ["launch.jobing.online", ["contact"]],
    ["jobing-pages.vercel.app", ["contact"]],
    ["pages.example.com", []],
    ["pages.example.com", ["contact", "thanks"]],
    ["pages.example.com", ["admin"]],
  ])("rejects system, root, nested, and reserved addresses", (host, path) => {
    expect(resolveCustomPageRequest(host, path, "jobing.online")).toBeNull();
  });
});
