export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = typeof value === "string" && /^[=+\-@\t\r]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
