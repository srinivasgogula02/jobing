import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { resolveClerkAuthorizedParties } from "@/lib/clerk-config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/forms",
  "/api/health",
  "/forms/api/health",
  "/api/internal(.*)",
  "/forms/api/internal(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
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
