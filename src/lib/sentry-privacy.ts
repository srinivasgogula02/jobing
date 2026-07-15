import type { Event } from "@sentry/nextjs";

const ANDROID_NAVIGATION_LOGGER_URL = "app://navigation_performance_logger_android";
const DESTROYED_ANDROID_BRIDGE_ERROR = "Error invoking postMessage: Java object is gone";
const IOS_INJECTED_SCRIPT_URL = "app:///";
const MISSING_IOS_BRIDGE_ERROR = "undefined is not an object (evaluating 'window.webkit.messageHandlers')";

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

/** Drop errors raised by injected mobile navigation loggers when their native bridges are unavailable. */
export function filterMainClientSentryEvent<T extends Event>(event: T): T | null {
  const values = event.exception?.values ?? [];
  const hasAndroidLoggerFrame = (value: (typeof values)[number]) => value.stacktrace?.frames?.some((frame) =>
    frame.filename?.startsWith(ANDROID_NAVIGATION_LOGGER_URL)
    || frame.abs_path?.startsWith(ANDROID_NAVIGATION_LOGGER_URL),
  );
  const hasIosBridgeFrame = (value: (typeof values)[number]) => value.stacktrace?.frames?.some((frame) =>
    frame.function === "sendDataToNative"
    && (frame.filename?.startsWith(IOS_INJECTED_SCRIPT_URL) || frame.abs_path?.startsWith(IOS_INJECTED_SCRIPT_URL)),
  );
  const isAndroidLoggerBridgeError = values.some((value) =>
    value.value === DESTROYED_ANDROID_BRIDGE_ERROR && hasAndroidLoggerFrame(value),
  ) || (
    event.message === DESTROYED_ANDROID_BRIDGE_ERROR
    && values.some(hasAndroidLoggerFrame)
  );
  const isIosLoggerBridgeError = values.some((value) =>
    value.value === MISSING_IOS_BRIDGE_ERROR && hasIosBridgeFrame(value),
  ) || (
    event.message === MISSING_IOS_BRIDGE_ERROR
    && values.some(hasIosBridgeFrame)
  );

  return isAndroidLoggerBridgeError || isIosLoggerBridgeError ? null : scrubMainSentryEvent(event);
}

export function scrubMainSentryTransaction<T extends Event>(event: T): T {
  scrubMainSentryEvent(event);
  event.spans = event.spans?.map((span) => ({ ...span, description: undefined, data: {} }));
  return event;
}
