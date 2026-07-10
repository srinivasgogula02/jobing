# Jobing MCP connector

Jobing exposes an account-scoped MCP server at:

```text
https://jobing.site/mcp
```

The server uses Streamable HTTP and Clerk OAuth with Dynamic Client Registration.
Users connect from their AI client's connector settings, sign in to Jobing, and
approve access. The connector currently exposes:

- `create_note`: creates a new public note owned by the connected Jobing user.
- `deploy_page`: deploys a new public HTML page owned by the connected Jobing user.

Both operations only create new records. They reject existing IDs and do not
overwrite or delete content.

## Before deployment

1. Run `connector_migration.sql` against the production Supabase database.
2. Confirm `NEXT_PUBLIC_SITE_URL=https://jobing.site` in production.
3. Confirm Clerk Dynamic Client Registration remains enabled.
4. Deploy, then add `https://jobing.site/mcp` as a custom connector in Claude.

OAuth discovery endpoints:

- `/.well-known/oauth-protected-resource/mcp`
- `/.well-known/oauth-authorization-server`
