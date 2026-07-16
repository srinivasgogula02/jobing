# Jobing Forms — Phase 1 deployment runbook

Jobing Forms is a separate Next.js deployment backed by a separate Neon database.
It shares Jobing's Clerk identity but does not share the main application's Supabase
database, deployment environment, or runtime credentials.

## Phase 1 boundary

Implemented now:

- A dedicated Forms Next.js deployment served through `jobing.site/forms`.
- Shared Clerk authentication on the primary `jobing.site` origin.
- An isolated Neon schema with workspace, entitlement, draft, immutable version,
  endpoint reservation, audit, idempotency, nonce, and outbox foundations.
- HMAC-signed, replay-protected internal APIs for workspace projection, creating
  drafts, listing forms, and publishing definitions.
- MCP tools in the main deployment for creating, listing, and publishing definitions.
- A minimal authenticated dashboard and database-aware `/forms/api/health` endpoint.

Not implemented in Phase 1:

- Hosted respondent forms or a public `/f/{endpoint}` submission handler.
- A visual form builder or editable dashboard workflow.
- Response storage/inbox, analytics, uploads, notifications, integrations, or workers.
- Public embed routes, custom domains, or public-form observability.

An endpoint ID is reserved when a draft is created, but it is intentionally not a
working submission URL until the public ingestion phase is delivered.

## Deployment topology

Create two Vercel projects from this Git repository:

| Vercel project | Root Directory | Domain | Database |
| --- | --- | --- | --- |
| `jobing-web` | `.` | `jobing.site` | Existing Supabase |
| `jobing-forms` | `apps/forms` | `jobing.site/forms` via the main project rewrite | New Neon project |

Use Node.js 22 and the committed npm 11.6.2 lockfiles. Keep Git-based preview
deployments enabled for both projects. In the `jobing-forms` project, keep
"Include source files outside of the Root Directory" disabled; Forms has its own
lockfile and does not import from the repository root. The Forms build has
`basePath: "/forms"`;
the main deployment proxies `/forms` and `/forms/:path*` to the stable
`jobing-forms.vercel.app` production alias.

### Identity

Use the same Clerk instance and keys in both Vercel projects. Forms is reached on the
primary Jobing origin, so no paid Clerk satellite domain or cross-domain cookie is
required. Set these production values on Forms:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://jobing.site/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://jobing.site/sign-up
NEXT_PUBLIC_FORMS_SITE_URL=https://jobing.site/forms
CLERK_AUTHORIZED_PARTIES=https://jobing.site
```

Before rollout, verify that the primary deployment serves the configured `/sign-in`
and `/sign-up` URLs and returns users to Forms after authentication.
The primary Jobing project must set:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_AUTHORIZED_PARTIES=https://jobing.site
```

Forms sign-in buttons use Clerk's redirect flow. Both sign-in and sign-up completion
are forced back to `https://jobing.site/dashboard/forms`; the return path is fixed in code
and is never read from request input.

Retain the exact authorized parties:

```text
https://jobing.site
```

The browser remains on `jobing.site`, so its existing Clerk session is sent to the
Forms path automatically. Vercel proxies the request to the independently deployed
Forms application without exposing the child hostname to the user. Do not create a
custom `Domain=.jobing.site` session cookie.

### Authenticated previews

Do not treat the child project's `*.vercel.app` URL as an authenticated user-facing
origin. Test through a stable primary preview URL with its `/forms` rewrite and scope
all Forms URL and `CLERK_AUTHORIZED_PARTIES` values to that primary preview origin.
The matching main-app preview must also use a non-production Supabase project,
service-role key, and preview-specific `OAUTH_ISSUER`. Issuer binding prevents
cross-issuer authorization as defense in depth; it does not make production
database credentials safe to expose to preview code.

## Environment variables

### Forms Vercel project

Required:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://jobing.site/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://jobing.site/sign-up
NEXT_PUBLIC_JOBING_SITE_URL=https://jobing.site
NEXT_PUBLIC_FORMS_SITE_URL=https://jobing.site/forms
CLERK_AUTHORIZED_PARTIES=https://jobing.site
DATABASE_URL
FORMS_INTERNAL_KEY_ID
FORMS_INTERNAL_SECRET
```

`DATABASE_URL` must use a least-privileged Neon runtime login. It must not be the
Neon owner/migrator credential. The runtime is granted only the required
`forms_api` functions by the ordered migrations.

Optional during HMAC rotation:

```text
FORMS_INTERNAL_PREVIOUS_KEY_ID
FORMS_INTERNAL_PREVIOUS_SECRET
```

`DATABASE_MIGRATION_URL` belongs only in a protected operator or migration CI
environment. Do not add it to the Forms Vercel project.

### Main Jobing Vercel project

Keep all existing Clerk and Supabase variables. Add:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_AUTHORIZED_PARTIES=https://jobing.site
CLERK_WEBHOOK_SECRET
OAUTH_ISSUER=https://jobing.site
FORMS_SERVICE_URL=https://jobing.site/forms
FORMS_INTERNAL_KEY_ID
FORMS_INTERNAL_SECRET
CRON_SECRET
```

Production calls are pinned to `https://jobing.site/forms`. A stable preview Forms
base URL must be explicitly listed in the matching main-app preview environment:

```text
FORMS_SERVICE_ALLOWED_BASE_URLS=https://preview.jobing.site/forms
```

This server-only comma-separated allowlist accepts exact HTTPS `/forms` base URLs.
Do not add wildcard hosts or direct child deployment URLs, and leave it unset in the
main production environment unless another fixed primary origin is intentional.

The HMAC key ID and secret must match the Forms project's current pair. Generate a
different random secret of at least 32 bytes for development, preview, and production.
Never expose it through a `NEXT_PUBLIC_` variable.

In the same Clerk instance, configure a signed webhook endpoint at
`https://jobing.site/api/webhooks/clerk`, store its signing secret as
`CLERK_WEBHOOK_SECRET`, and subscribe to `user.created`, `user.updated`, and
`user.deleted`. The deletion event is mandatory: its Supabase transaction revokes
the user's connector grants, removes outstanding authorization codes, and durably
queues the Forms workspace tombstone. A failed Neon delivery remains in the outbox
for the authenticated cron route to retry.

## Database ownership and migration order

The connector authorization server continues to own OAuth clients, grants, and
tokens in the main Supabase project. Forms definitions and operational state live
only in Neon.

Before the matching application code is promoted:

1. Take a Supabase backup and create a disposable Neon branch for rehearsal.
2. Apply the three main Supabase migrations in lexical order. They are additive
   and all must land before the matching application code:
   `202607140001_connector_oauth_phase1.sql`,
   `202607140002_forms_projection_outbox.sql`, then
   `202607140003_oauth_rate_limits.sql`. Migration `001` intentionally aborts if
   its Clerk-user audit finds orphaned live OAuth state; investigate that state
   instead of bypassing the guard.

   From the repository root, use the protected direct database URL. The runner
   rejects missing or pooled URLs, takes a session advisory lock, stops on the
   first SQL error, and does not intentionally log the connection string:

   ```bash
   SUPABASE_MIGRATION_URL='postgresql://…direct…' npm run db:migrate:supabase:phase1
   ```

3. Create a Neon project. For the initial bootstrap, set `DATABASE_MIGRATION_URL`
   to its protected direct, non-pooled project-owner credential. Migration `000001`
   must create the NOLOGIN group roles and grant the owner role to the migrator, so
   an ordinary least-privilege login cannot bootstrap a new database. Never expose
   this credential to either application runtime.
4. From `apps/forms`, run `npm run db:migrate`.
5. Create a separate runtime login and grant it membership in
   `jobing_forms_control` and `jobing_forms_sync`; do not grant owner, worker,
   ingest, public, or auditor roles.
6. Set that runtime login as `DATABASE_URL`, run `npm run db:verify` with both
   database URLs present, then verify `/forms/api/health`. The verifier connects through
   the actual runtime URL and rejects owner, superuser, `BYPASSRLS`, object-owner,
   base-table, or over-broad function privileges.

The Forms runner applies these files in lexical order:

```text
000001_bootstrap.sql
000002_identity_entitlements.sql
000003_forms.sql
000004_operational_tables.sql
000005_domain_helpers.sql
000006_api_functions.sql
000007_rls_and_grants.sql
```

The runner takes a Postgres advisory lock, wraps each migration in its own transaction,
and records a SHA-256 checksum. Never edit, rename, or delete an applied migration;
add a new forward migration instead. The runner rejects pooled migration URLs.

The main connector automatically sends a stable, idempotent personal workspace,
owner membership, and free-entitlement projection before every Forms operation.
Higher `sourceVersion` projections can later apply paid or team state without a
cross-database transaction.

`create_form_draft` requires a stable caller-supplied `operationId`. Field UUIDs are
deterministically derived from that ID, field order, and field key, so a retry sends
the same signed body. Reusing an ID for changed input is an idempotency conflict. The
entire main-to-Forms JSON envelope is capped at 256 KiB and is checked before the
workspace-sync preflight. The database independently rejects definitions over
512 KiB as defense in depth; the smaller API envelope is the effective client limit.

## Rollout

1. Run both CI jobs and rehearse all three Supabase migrations plus the seven Neon
   migrations against non-production data.
2. Apply Supabase migrations `001` through `003` in order, then the ordered Neon
   migrations. Do not deploy either new runtime until all required RPCs exist.
3. Configure the Clerk webhook and prove signed `user.created`, `user.updated`, and
   `user.deleted` preview deliveries before accepting users.
4. Deploy `jobing-forms` to a preview with Neon preview credentials.
5. Verify `GET /forms/api/health`, authentication, signed workspace sync, draft creation,
   list, publish, idempotent retry, and stale-revision rejection.
6. Promote Forms to production while the main app still has no Forms service URL.
7. Add the production `FORMS_SERVICE_URL` and matching HMAC key to `jobing-web`.
8. Deploy a main-app preview and repeat the connector smoke tests.
9. Promote the validated main preview. Confirm existing note/page tools still work.
10. Monitor Forms health, Neon connections, internal 401/409/5xx rates, OAuth errors,
   the Supabase projection-outbox backlog/oldest pending event, and cron failures.

Do not expose or advertise an `/f/{endpoint}` URL during this phase.

## HMAC secret rotation

Rotation is a two-deployment operation:

1. Generate a new random secret and key ID.
2. On Forms, set the new pair as current and the old pair as `PREVIOUS`; deploy Forms.
3. On the main app, replace its current pair with the new pair; deploy the main app.
4. Verify signed calls and retire old production and preview deployments.
5. Wait at least 15 minutes after the last old caller is retired, then remove the
   previous pair from Forms and deploy again.

Never replace both sides simultaneously without the overlap. Key IDs are identifiers,
not secrets, but both secret values must remain server-only.

## Rollback

Application rollback is alias-based and does not reverse database migrations:

1. Roll back or re-promote the last healthy `jobing-web` deployment first. This stops
   new connector traffic from reaching Forms.
2. Roll back `jobing-forms` to its last healthy deployment if necessary.
3. Keep additive Supabase and Neon migrations in place. Correct schema problems with a
   new forward migration; do not manually delete columns, functions, or migration rows.
4. If data integrity is compromised, stop Forms traffic, preserve logs, and restore a
   Neon branch/backup before promoting repaired code.

Removing `FORMS_SERVICE_URL` makes Forms tools fail closed, but promoting the previous
main deployment provides the cleanest user-visible rollback.

## Deletion and retention boundary

Clerk `user.deleted` atomically revokes connector credentials, removes outstanding
authorization codes, deletes the active main user row, and queues a durable Forms
tombstone. Database triggers provide the same credential revocation and tombstone
backstop if a pre-Phase-1 instance performs the deletion during a rolling deploy.
Access-token validation also requires a live `public.users` row.

This Phase 1 behavior is account deactivation, not yet a claim of complete erasure.
OAuth codes, grants, tokens, and rate-limit buckets are cascade-deleted with the main
user row. Delivered outbox events, deleted Neon workspace/form definitions, and
security audit rows still retain the Clerk user ID for anti-resurrection and incident
analysis. No respondent data exists in Phase 1. Before public form collection or a
user-facing “erase my data” promise ships, define the legal retention periods and add
a tested purge/anonymization workflow across Supabase, Neon, backups, Sentry, and
PostHog. Handle erasure requests manually until that workflow exists.

## Observability

Use the existing vendor organizations/accounts, with isolated projects:

- Sentry organization: existing; project: `jobing-forms-web`.
- PostHog organization: existing; project: `Jobing Forms` with its own project token.

The Phase 1 app currently reserves environment names but does not wire either SDK.
When instrumentation is added, restrict it to the authenticated creator surface and
internal operational metadata. Never capture form definitions containing sensitive
text, future respondent answers, request bodies, cookies, authorization headers, or
HMAC headers. Public respondent pages and session replay remain disabled by default.

## CI

The root GitHub Actions workflow has independent jobs and lockfile caches:

- Main: root install, repeatable PostgreSQL rehearsal of all three additive
  Supabase migrations (including deletion and orphan-token smoke tests), tests,
  TypeScript, Phase 1 lint, and a production build.
- Forms: `apps/forms/package-lock.json`, repeatable Postgres migration rehearsal,
  verification through a separately created least-privilege runtime login, tests,
  lint, TypeScript, and a production build.

CI uses a syntactically valid non-production Clerk placeholder only for compilation.
It receives no Supabase, Neon, HMAC, Sentry, PostHog, email, or production Clerk secrets.
