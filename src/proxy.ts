import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Whitelist of public routes that don't require authentication or payment
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks(.*)',
  '/pricing',
  '/billing' // Allow billing so they can see existing subscriptions
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth()

    // If user is not signed in, redirect to sign in
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }

    // Retrieve the is_paid flag from the session claims metadata
    const metadata = sessionClaims?.metadata as { is_paid?: boolean } | undefined;
    const isPaid = metadata?.is_paid === true;

    // If they are logged in but not a paid user, redirect them to the pricing page
    if (!isPaid) {
      const pricingUrl = new URL('/pricing', req.url)
      return NextResponse.redirect(pricingUrl)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
