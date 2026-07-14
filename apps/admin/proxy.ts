import { NextRequest, NextResponse } from "next/server";

function safeEqual(left: string, right: string) {
  const max = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < max; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function challenge(status = 401) {
  return new NextResponse(status === 503 ? "Admin access is not configured." : "Authentication required.", {
    status,
    headers: status === 401 ? { "WWW-Authenticate": 'Basic realm="Jobing operations", charset="UTF-8"' } : undefined,
  });
}

export function proxy(request: NextRequest) {
  const expectedUser = process.env.ADMIN_DASHBOARD_USER;
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!expectedUser || !expectedPassword || expectedPassword.length < 24) return challenge(503);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return challenge();
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 1) return challenge();
    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (!safeEqual(user, expectedUser) || !safeEqual(password, expectedPassword)) return challenge();
  } catch {
    return challenge();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
