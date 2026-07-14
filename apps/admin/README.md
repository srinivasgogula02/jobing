# Jobing operations dashboard

`apps/admin` is an independent Next.js/Vercel deployment for product analytics,
connector feedback, and production reliability. It must stay on
`admin.jobing.site` (or its Vercel alias), never on `jobing.online`; that entire
registrable domain is reserved for untrusted generated pages.

## Free-tier design

- PostHog uses explicit, low-cardinality events. Main and Forms conversion events
  are exact; successful generated-page views are sampled at 10% and failures are
  retained. Session replay and autocapture are disabled.
- Sentry retains errors, samples traces at 1–2%, and strips request bodies,
  headers, cookies, prompts, HTML, form answers, names, and email addresses.
- Provider panels use 60-second caching and `Promise.allSettled`; unavailable or
  rate-limited providers never appear as a misleading zero.

## Production environment

Copy `.env.example` into the Vercel project. `ADMIN_DASHBOARD_PASSWORD` must be a
unique value of at least 24 characters. Use read-only PostHog and Sentry API
tokens. Supabase access is limited to the bounded `list_connector_feedback` RPC;
the underlying table remains inaccessible.

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
npx vercel deploy --prod
```
