import type { Event } from "@sentry/nextjs";

function pathOnly(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value, "https://jobing.site");
    return url.origin === "https://jobing.site" ? url.pathname : undefined;
  } catch {
    return undefined;
  }
}

/** Last-line Sentry guard: retain stacks and stable user IDs, discard content. */
export function scrubMainSentryEvent<T extends Event>(event: T): T {
  const path = pathOnly(event.request?.url);
  const method = event.request?.method;
  event.request = path || method ? { url: path, method } : undefined;
  event.user = event.user?.id ? { id: String(event.user.id).slice(0, 256) } : undefined;
  event.breadcrumbs = undefined;
  event.extra = undefined;
  event.contexts = undefined;
  for (const value of event.exception?.values ?? []) {
    for (const frame of value.stacktrace?.frames ?? []) frame.vars = undefined;
  }
  return event;
}

export function scrubMainSentryTransaction<T extends Event>(event: T): T {
  scrubMainSentryEvent(event);
  event.spans = event.spans?.map((span) => ({ ...span, description: undefined, data: {} }));
  return event;
}
