import { describe, expect, it } from "vitest";
import {
  PAGE_ID_MAX_LENGTH as mainMaxLength,
  PAGE_ID_PATTERN as mainPattern,
  RESERVED_PAGE_IDS as mainReservedIds,
} from "../../../../src/lib/page-id";
import {
  isValidPageId,
  PAGE_ID_MAX_LENGTH,
  PAGE_ID_PATTERN,
  RESERVED_PAGE_IDS,
} from "./page-id";

describe("Pages Runtime page ID contract", () => {
  it("stays aligned with the main deployment", () => {
    expect(PAGE_ID_MAX_LENGTH).toBe(mainMaxLength);
    expect(PAGE_ID_PATTERN.source).toBe(mainPattern.source);
    expect([...RESERVED_PAGE_IDS]).toEqual([...mainReservedIds]);
  });

  it.each(["a", "freshmart-job-application", "a".repeat(63)])(
    "accepts DNS-safe page ID %s",
    (id) => expect(isValidPageId(id)).toBe(true),
  );

  it.each(["", "has_underscore", "-bad", "bad-", "a".repeat(64), ...RESERVED_PAGE_IDS])(
    "rejects unavailable page ID %s",
    (id) => expect(isValidPageId(id)).toBe(false),
  );
});
