// `/p/*` is explicitly the private-link product. All other product journeys
// remain recordable for early-stage UX research; input values are still masked
// globally in the PostHog client configuration.
const SENSITIVE_REPLAY_PREFIXES = ["/p"];

export function isSensitiveReplayPath(pathname: string): boolean {
  return SENSITIVE_REPLAY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
