import { describe, expect, it } from "vitest";
import {
  isValidPageId,
  normalizePageId,
  RESERVED_PAGE_IDS,
} from "./page-id";
import { pageIdSchema } from "./page-id-schema";

describe("page ID contract", () => {
  it.each(["a", "freshmart-job-application", "a1", "a".repeat(63)])(
    "accepts DNS-safe page ID %s",
    (id) => expect(isValidPageId(id)).toBe(true),
  );

  it.each([
    "",
    "-starts-with-hyphen",
    "ends-with-hyphen-",
    "has spaces",
    "has_underscore",
    "A-uppercase",
    "a".repeat(64),
    ...RESERVED_PAGE_IDS,
  ])("rejects unavailable page ID %s", (id) => expect(isValidPageId(id)).toBe(false));

  it("normalizes connector input before validation", () => {
    expect(normalizePageId("  Launch-Page  ")).toBe("launch-page");
    expect(pageIdSchema.parse("  Launch-Page  ")).toBe("launch-page");
  });
});
