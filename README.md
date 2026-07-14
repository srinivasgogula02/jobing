# Jobing

This repository contains two independently installed and deployed Next.js applications:

| Application | Repository root | Production domain | Database |
| --- | --- | --- | --- |
| Main Jobing app and MCP connector | `.` | `jobing.site` | Existing Supabase project |
| Jobing Forms control plane | `apps/forms` | `forms.jobing.site` | Separate Neon project |

They use the same Clerk instance so users connect and sign in once. They use separate
Vercel projects, environment variables, database credentials, build outputs, and
lockfiles. Forms is not an npm workspace and never imports the main Supabase client.

The primary Jobing project must serve Clerk at `/sign-in` and `/sign-up`:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_AUTHORIZED_PARTIES=https://jobing.site,https://forms.jobing.site
```

Forms uses redirect-mode Clerk CTAs and always returns completed sign-in or sign-up
to the fixed `https://forms.jobing.site/app` destination. It does not accept a return
URL from the visitor.

## Local development

```bash
npm ci --legacy-peer-deps
npm run dev

npm --prefix apps/forms ci
npm --prefix apps/forms run dev
```

The main app runs on port 3000 and Forms runs on port 3001.

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
```

See [CONNECTOR.md](CONNECTOR.md) for connector capabilities and
[`apps/forms/README.md`](apps/forms/README.md) for the Phase 1 deployment runbook.
