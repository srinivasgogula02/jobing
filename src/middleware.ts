import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ─── Route Tiers ──────────────────────────────────────────────────────────────
//
// TIER 1 — Fully Public: No auth required, no payment check.
//   Anyone (logged in or not, with or without credits) can always access these.
//   Includes legal/info pages, home, pricing, webhooks. Good for SEO & bots.
//
const isAlwaysPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/contact(.*)',
  '/pricing(.*)',
  '/blog(.*)',
  '/api/webhooks(.*)',
  '/api/email(.*)',
  '/api/cron(.*)',
  '/copy(.*)',
  '/c(.*)',
  '/p(.*)',
  '/tools(.*)',
  '/pages(.*)',
  '/sitemap(.*)',
  '/robots.txt'
])

// TIER 2 — Auth Required, No Payment Check:
//   User must be signed in, but no subscription/credit check applied.
//   Good for billing, account management, etc.
//
const isAuthOnlyRoute = createRouteMatcher([
  '/billing(.*)',
  '/create(.*)',
  '/profile(.*)',
  '/resumes(.*)'
])

// TIER 3 — Protected: Auth + payment/credit check applied to everything else.
// ──────────────────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // If logged-in user visits homepage, redirect them to /tools
  if (pathname === '/') {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL('/tools', req.url));
    }
    return NextResponse.next();
  }

  // TIER 1: Always accessible — skip all checks immediately
  if (isAlwaysPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all non-public routes, require authentication
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // TIER 2: Auth-only routes — signed in but no payment check
  if (isAuthOnlyRoute(req)) {
    return NextResponse.next();
  }

  // API routes should never receive an HTML redirect — let the endpoint handle auth
  const isApiRequest = pathname.startsWith('/api');
  if (isApiRequest) {
    return NextResponse.next();
  }

  // TIER 3: Payment / credit check for all remaining protected routes
  const metadata = sessionClaims?.metadata as { is_paid?: boolean; has_credits?: boolean } | undefined;
  const isPaid = metadata?.is_paid === true;
  const pricingMode = process.env.NEXT_PUBLIC_PRICING_MODE || 'paywall';

  if (pricingMode === 'freemium') {
    const hasCredits = metadata?.has_credits === true;

    if (!isPaid && !hasCredits) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
  } else {
    // PAYWALL mode: only paid users pass through
    if (!isPaid) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
