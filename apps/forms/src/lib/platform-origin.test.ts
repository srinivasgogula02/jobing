import { afterEach, describe, expect, it } from "vitest";
import { isPagesRuntimeOrigin } from "./platform-origin";

afterEach(() => {
  delete process.env.PAGES_RUNTIME_ALLOWED_ORIGINS;
  delete process.env.PAGES_RUNTIME_ROOT_DOMAIN;
});

describe("isPagesRuntimeOrigin", () => {
  it("always allows the first-party Pages production origin", () => {
    expect(isPagesRuntimeOrigin("https://jobing-pages.vercel.app")).toBe(true);
  });

  it("allows an exact deployment origin", () => {
    process.env.PAGES_RUNTIME_ALLOWED_ORIGINS = "https://pages-preview.example";
    expect(isPagesRuntimeOrigin("https://pages-preview.example")).toBe(true);
  });

  it("allows exactly one HTTPS page subdomain", () => {
    process.env.PAGES_RUNTIME_ROOT_DOMAIN = "jobing.online";
    expect(isPagesRuntimeOrigin("https://launch.jobing.online")).toBe(true);
    expect(isPagesRuntimeOrigin("https://a.b.jobing.online")).toBe(false);
    expect(isPagesRuntimeOrigin("http://launch.jobing.online")).toBe(false);
  });
});
