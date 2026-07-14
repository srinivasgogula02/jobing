# Jobing Pages Runtime

This is the isolated public renderer for user-generated Jobing pages. It serves saved HTML as the top-level document and intentionally has no Clerk session, application cookies, or access to the Supabase service-role key.

## Production addresses

Each page uses its own origin:

`https://<page-id>.jobing.online`

The stable Vercel URL remains available for legacy links at
`https://jobing-pages.vercel.app/<page-id>`.

## Attach the final domain

`jobing.online` is dedicated exclusively to untrusted generated pages. Do not
host the Jobing dashboard, authentication, Forms, or another sensitive
application on its apex or sibling subdomains.

1. Add `jobing.online` and `*.jobing.online` to the `jobing-pages` Vercel project.
2. Point the registrar DNS configuration to the records or nameservers Vercel reports and wait for both domains to verify.
3. Set `PAGES_ROOT_DOMAIN=jobing.online` on `jobing-pages`.
4. Set `PAGES_RUNTIME_ROOT_DOMAIN=jobing.online` on `jobing-forms` while retaining the legacy Vercel origin in `PAGES_RUNTIME_ALLOWED_ORIGINS`.
5. Set `NEXT_PUBLIC_PAGES_ROOT_DOMAIN=jobing.online` on the main `jobing` project.
6. Redeploy Forms first, Pages Runtime second, and the main project last.

A page named `launch` resolves at `https://launch.jobing.online`.

Keep the entire domain dedicated to generated content. The runtime does not set,
read, or depend on cookies. Never introduce parent-domain cookies; if a future
runtime feature requires a cookie, use a host-only cookie with the `__Host-`
prefix. Only the subdomain root serves the generated document. Fixed runtime
assets such as `/favicon.ico`, `/robots.txt`, and `/_jobing/forms-client.js`
have explicit routes.
