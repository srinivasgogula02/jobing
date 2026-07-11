const SENSITIVE_REPLAY_PREFIXES = [
  "/billing",
  "/c",
  "/copy",
  "/feedback",
  "/mcp",
  "/oauth",
  "/online-clipboard",
  "/online-notepad",
  "/p",
  "/pages",
  "/share-text",
];

export function isSensitiveReplayPath(pathname: string): boolean {
  return SENSITIVE_REPLAY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
