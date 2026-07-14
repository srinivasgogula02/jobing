import { describe, expect, it } from "vitest";
import type { ProviderResult } from "./dashboard";

describe("dashboard provider result", () => {
  it("keeps unavailable distinct from a real zero", () => {
    const unavailable: ProviderResult<number[]> = { status: "unavailable", reason: "timeout" };
    const empty: ProviderResult<number[]> = { status: "ok", data: [] };
    expect(unavailable.status).not.toBe(empty.status);
  });
});
