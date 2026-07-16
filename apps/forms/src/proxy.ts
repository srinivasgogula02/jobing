import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
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

export default clerkMiddleware(
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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
