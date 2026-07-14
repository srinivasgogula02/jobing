# Jobing Pages Runtime

This is the isolated public renderer for user-generated Jobing pages. It serves saved HTML as the top-level document and intentionally has no Clerk session, application cookies, or access to the Supabase service-role key.

## Temporary URL

Before a wildcard domain is attached, pages are available at:

`https://jobing-pages.vercel.app/<page-id>`

## Attach the final domain

Use a registrable domain dedicated exclusively to untrusted generated pages. Do not host the Jobing dashboard, authentication, or other sensitive applications on its apex or sibling subdomains.

1. Add the apex and wildcard domain to the `jobing-pages` Vercel project, for example `pages.example` and `*.pages.example`.
2. Set `PAGES_ROOT_DOMAIN=pages.example` on `jobing-pages`.
3. Set `PAGES_RUNTIME_ROOT_DOMAIN=pages.example` on `jobing-forms`.
4. Set `NEXT_PUBLIC_PAGES_ROOT_DOMAIN=pages.example` on the main `jobing` project.
5. Redeploy all three projects.

A page named `launch` will then resolve at `https://launch.pages.example`.

Keep the domain dedicated to generated content. Avoid parent-domain cookies; if cookies are ever necessary elsewhere, use host-only cookies with the `__Host-` prefix.
