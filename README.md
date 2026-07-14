# Jobing

This repository contains four independently installed and deployed Next.js applications:

| Application | Repository root | Production domain | Database |
| --- | --- | --- | --- |
| Main Jobing app and MCP connector | `.` | `jobing.site` | Existing Supabase project |
| Jobing Forms control plane | `apps/forms` | `jobing.site/forms` | Separate Neon project |
| Jobing Pages public runtime | `apps/pages-runtime` | `*.jobing.online` | Read-only access to public Supabase pages |
| Jobing operations dashboard | `apps/admin` | `admin.jobing.site` | Read-only provider APIs + bounded Supabase feedback RPC |

The main app and Forms use the same Clerk instance so users connect and sign in
once. Pages Runtime deliberately has no authentication or application cookies.
All four use separate Vercel projects, environment variables, build outputs, and
lockfiles. Forms is not an npm workspace and never imports the main Supabase client.

The primary Jobing project must serve Clerk at `/sign-in` and `/sign-up`:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_AUTHORIZED_PARTIES=https://jobing.site
```

Forms uses redirect-mode Clerk CTAs and always returns completed sign-in or sign-up
to the fixed `https://jobing.site/forms/app` destination. It does not accept a return
URL from the visitor.

## Local development

```bash
npm ci --legacy-peer-deps
npm run dev

npm --prefix apps/forms ci
npm --prefix apps/forms run dev
```

The main app runs on port 3000 and Forms runs on port 3001. Open Forms through
`http://localhost:3000/forms`; the main development server proxies it to port 3001.

## Checks

```bash
npm run test:ci
npm run typecheck
npm run lint:phase1
npm run build

npm --prefix apps/forms run test:ci
npm --prefix apps/forms run lint
npm --prefix apps/forms run typecheck
npm --prefix apps/forms run build

npm --prefix apps/pages-runtime run test
npm --prefix apps/pages-runtime run lint
npm --prefix apps/pages-runtime run typecheck
npm --prefix apps/pages-runtime run build

npm --prefix apps/admin run test
npm --prefix apps/admin run lint
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run build
```

See [CONNECTOR.md](CONNECTOR.md) for connector capabilities and
[`apps/forms/README.md`](apps/forms/README.md) for the Forms deployment runbook,
and [`apps/pages-runtime/README.md`](apps/pages-runtime/README.md) for the isolated
generated-pages deployment. The private metrics deployment is documented in
[`apps/admin/README.md`](apps/admin/README.md).
