import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";

describe("CSV cells", () => {
  it("escapes quotes and spreadsheet formula prefixes", () => {
    expect(csvCell('He said "hello"')).toBe('"He said ""hello"""');
    expect(csvCell("=HYPERLINK(\"https://bad.example\")")).toBe('"\'=HYPERLINK(""https://bad.example"")"');
    expect(csvCell("+SUM(1,2)")).toBe('"\'+SUM(1,2)"');
  });

  it("keeps numeric values numeric", () => {
    expect(csvCell(-12)).toBe('"-12"');
  });
});
