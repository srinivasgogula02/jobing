import { describe, expect, it } from "vitest";
import { GET as favicon } from "./favicon.ico/route";
import { GET as robots } from "./robots.txt/route";

describe("Pages Runtime fixed assets", () => {
  it("serves a cacheable default favicon instead of routing it as a customer page", async () => {
    const response = favicon();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(await response.text()).toContain("<svg");
  });

  it("serves an explicit robots policy", async () => {
    const response = robots();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("User-agent: *\nAllow: /\n");
  });
});
