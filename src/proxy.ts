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

    // Retrieve metadata from JWT session claims
    const metadata = sessionClaims?.metadata as { is_paid?: boolean; has_credits?: boolean } | undefined;
    const isPaid = metadata?.is_paid === true;

    // Determine pricing mode from environment variable
    const pricingMode = process.env.NEXT_PUBLIC_PRICING_MODE || 'paywall';

    if (pricingMode === 'freemium') {
      // FREEMIUM MODE: Allow access if user is paid OR has remaining free credits
      const hasCredits = metadata?.has_credits === true;
      if (!isPaid && !hasCredits) {
        const pricingUrl = new URL('/pricing', req.url)
        return NextResponse.redirect(pricingUrl)
      }
    } else {
      // PAYWALL MODE (default): Only paid users get through
      if (!isPaid) {
        const pricingUrl = new URL('/pricing', req.url)
        return NextResponse.redirect(pricingUrl)
      }
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
