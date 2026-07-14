# Jobing MCP connector

Jobing exposes one account-scoped MCP server:

```text
https://jobing.site/mcp
```

Users connect Jobing once. The main `jobing.site` deployment remains the OAuth
authorization server and calls the separate Forms deployment over an HMAC-signed
internal API. Users do not install a second Forms connector.

## Phase 1 tools

- `create_note` — creates a new public note.
- `deploy_page` — deploys a new public HTML page.
- `create_form_draft` — creates an idempotent, versioned form definition draft.
  It requires a caller-generated stable `operationId`; the connector must reuse the
  same ID and inputs for every retry of one logical creation.
- `list_forms` — lists form definitions and publishing state; it never reads responses.
- `publish_form` — publishes an immutable definition version after an explicit request.

The Forms tools use granular OAuth scopes:

```text
forms:read
forms:write
forms:publish
```

Historical grants containing only `mcp` retain their original note/page permissions.
They do not silently gain Forms access. A new authorization is required for Forms.

Before every Forms operation, the main application idempotently projects the
user's personal workspace, owner membership, and Phase 1 free entitlement into
Neon. A later paid or team projection can supersede it with a higher source version.

For `create_form_draft`, Jobing derives every field UUID from the stable
`operationId`, field position, and field key. Identical retries therefore produce
the exact same signed request body. Reusing an operation ID with different inputs
is rejected as an idempotency conflict. The complete internal request envelope —
operation ID, OAuth actor/grant provenance, metadata, and definition — must fit in
256 KiB. This is intentionally stricter than the Neon function's 512 KiB definition
backstop, so an oversized request is rejected before workspace sync or network I/O.

## Current boundary

Phase 1 provides the connector control path, isolated Neon schema, immutable form
versions, endpoint reservation, and authenticated dashboard listing. It does not
yet provide a hosted respondent form, `/f/{endpoint}` submission runtime, visual
builder, response inbox, uploads, notifications, or integrations. Publishing a
definition therefore does not make a respondent-facing form available yet.

## Discovery

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-authorization-server`

## OAuth rollout safety

Set `OAUTH_ISSUER=https://jobing.site` on the main deployment. It must be a
canonical HTTPS origin with no path, query, fragment, or credentials. Dynamic
client registrations are stored against this issuer, so preview registrations
cannot be authorized by production even in a database-sharing rehearsal. Actual
preview deployments must use a non-production Supabase project and service-role
key; never give preview code access to the production database.

Apply these migrations to the existing main Supabase project in order immediately
before deploying the matching code:

```text
202607140001_connector_oauth_phase1.sql
202607140002_forms_projection_outbox.sql
202607140003_oauth_rate_limits.sql
```

The first creates issuer-bound grants and granular scopes, the second makes Clerk
deletion revocation and Forms tombstones durable, and the third provides distributed
per-grant throttling for serverless MCP instances. Missing `002` breaks user deletion;
missing `003` makes authenticated MCP traffic fail closed.

Migration `001` permits historical grant-less `mcp` token inserts for at most 24
hours. Close that compatibility window as soon as the rollout is healthy:

```sql
update public.oauth_rollout_guards
set enabled_until = clock_timestamp()
where guard_name = 'legacy_grant_bridge';
```

Deployment order, environment variables, HMAC rotation, rollout, and rollback are
documented in [`apps/forms/README.md`](apps/forms/README.md).
