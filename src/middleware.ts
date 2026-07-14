import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createDualmarkMiddleware } from '@dualmark/nextjs'
import { dualmarkConfig, hasMarkdownTwin, markdownTwinPath } from '@/lib/dualmark'
import { resolveClerkAuthorizedParties } from '@/lib/clerk-config'
import { isAuthOnlyProductPath } from '@/lib/app-navigation'

// ─── DualMark (AEO) ───────────────────────────────────────────────────────────
//
// Content negotiation for AI assistants. We run DualMark *before* Clerk's auth
// checks so that `.md` requests and known AI bots (GPTBot, ClaudeBot,
// PerplexityBot, …) are served clean markdown twins of our public pages without
// being bounced to a sign-in page. See src/lib/dualmark.ts for the config.
//
const dualmark = createDualmarkMiddleware(dualmarkConfig)

// DualMark "took over" the request when it rewrites to the /md namespace or
// returns a 406 (client accepts neither HTML nor Markdown). A plain passthrough
// (NextResponse.next) sets x-middleware-next instead and falls through to Clerk.
function dualmarkIntercepted(res: Response): boolean {
  return res.status === 406 || res.headers.has('x-middleware-rewrite')
}

// A request DualMark may negotiate: a real top-level document fetch. Excludes
// non-GET/HEAD methods (server actions, form posts) and React Server Component
// navigations/prefetches. Next strips the `RSC` request header before it reaches
// middleware, but those requests always carry `Accept: text/x-component`, which
// we use to identify them. Negotiating these internal payloads would 406 and
// break client-side navigation.
function isNegotiableDocumentRequest(req: { method: string; headers: Headers }): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('text/x-component')) return false;
  if (req.headers.has('rsc') || req.headers.has('next-router-prefetch')) return false;
  return true;
}

// Advertise the markdown twin on HTML responses that actually have one, so AI
// crawlers can discover it: `Link: <…/about.md>; rel="alternate"; type="text/markdown"`.
function withAlternate(res: NextResponse, pathname: string): NextResponse {
  if (hasMarkdownTwin(pathname)) {
    const twin = `${markdownTwinPath(pathname)}`
    res.headers.append('Link', `<${twin}>; rel="alternate"; type="text/markdown"`)
    const vary = res.headers.get('Vary')
    if (!vary) res.headers.set('Vary', 'Accept')
    else if (!vary.toLowerCase().split(',').map((s) => s.trim()).includes('accept'))
      res.headers.set('Vary', `${vary}, Accept`)
  }
  return res
}

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
  '/feedback(.*)',  // anyone — incl. anonymous & unpaid — must be able to give feedback
  '/pricing(.*)',
  '/blog(.*)',
  '/yc(.*)',         // YC companies explorer — public SEO surface, no login
  '/api/webhooks(.*)',
  '/api/email(.*)',
  '/api/cron(.*)',
  '/monitoring(.*)',
  '/mcp(.*)',
  '/sse(.*)',
  '/.well-known(.*)',
  '/oauth(.*)',
  '/api/oauth(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/copy(.*)',
  '/c(.*)',
  '/p(.*)',
  '/online-notepad(.*)',
  '/online-clipboard(.*)',
  '/share-text(.*)',
  '/tools(.*)',
  '/connector',
  '/forms',
  '/forms/api/health',
  '/forms/api/internal(.*)',
  '/pages(.*)',
  '/sitemap(.*)',
  '/robots.txt',
  '/llms.txt',      // AI-agent discovery manifest
  '/md(.*)'         // DualMark markdown twins (also reached via internal rewrite)
])

// Removed product surfaces must reach Next.js so they resolve to a real 404.
// Without this passthrough, Clerk treats them as protected routes and redirects
// anonymous visitors to sign-in before the router can report "not found".
const isRetiredRoute = createRouteMatcher([
  '/create(.*)',
  '/edit(.*)',
  '/resumes(.*)',
  '/profile(.*)',
  '/upskill(.*)',
  '/score(.*)',
  '/api/generate-resume(.*)',
  '/api/profile(.*)',
  '/api/resumes(.*)',
  '/api/chat/profile(.*)',
])

// TIER 2 — Auth Required, No Payment Check:
//   User must be signed in, but no subscription/credit check applied.
//   Good for billing, account management, etc.
//
const isAuthOnlyRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/billing(.*)',
  '/connector/manage(.*)',
  '/forms/app(.*)',
])

// TIER 3 — Protected: Auth + payment/credit check applied to everything else.
// ──────────────────────────────────────────────────────────────────────────────

export default clerkMiddleware(
  async (auth, req) => {
    const { pathname } = req.nextUrl;

    // AEO: serve markdown twins to AI bots / `.md` / `Accept: text/markdown`
    // BEFORE any auth check. If DualMark rewrites or returns 406, hand that back.
    //
    // Only negotiate top-level document GETs. RSC navigations/prefetches (which
    // send `Accept: text/x-component`) and server-action POSTs are internal Next
    // payloads — running content negotiation on them would 406 and break
    // client-side navigation.
    if (isNegotiableDocumentRequest(req)) {
      const dm = await dualmark(req);
      if (dualmarkIntercepted(dm)) {
        return dm;
      }
    }

    if (isRetiredRoute(req)) {
      return NextResponse.next();
    }

    // TIER 1: Always accessible — skip all checks immediately
    if (isAlwaysPublicRoute(req)) {
      return withAlternate(NextResponse.next(), pathname);
    }

    // For all non-public routes, require authentication
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // TIER 2: Auth-only routes — signed in but no payment check
    if (isAuthOnlyRoute(req) || isAuthOnlyProductPath(pathname)) {
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
  },
  {
    authorizedParties: resolveClerkAuthorizedParties(),
  },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
