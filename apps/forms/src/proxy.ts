import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { resolveClerkAuthorizedParties } from "@/lib/clerk-config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/forms",
  "/api/health",
  "/forms/api/health",
  "/api/internal(.*)",
  "/forms/api/internal(.*)",
  "/f(.*)",
  "/forms/f(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/api/app(.*)",
  "/forms/api/app(.*)",
]);

const authenticatedRoutes = clerkMiddleware(
  async (auth, request) => {
    // Only real dashboard surfaces require a session. Unknown document paths
    // must reach Next.js so the branded 404 is shown instead of a sign-in
    // redirect loop.
    if (!isPublicRoute(request) && isProtectedRoute(request)) {
      await auth.protect();
    }
  },
  {
    authorizedParties: resolveClerkAuthorizedParties(),
  },
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Public forms must never enter Clerk's handshake. A shared parent-domain
  // session can carry a forms.jobing.site `azp`, which Clerk correctly rejects
  // for the main app and would otherwise turn a public form into a 307 loop.
  if (isPublicRoute(request)) return NextResponse.next();
  return authenticatedRoutes(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
