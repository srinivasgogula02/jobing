# Testing Jobing AI

The test suite protects important behavior without adding JavaScript to the production website. Vitest is a development-only dependency and runs locally or on GitHub's temporary Actions computers.

## Commands

```bash
npm test             # run the suite once
npm run test:watch   # rerun affected tests while developing
npm run test:ci      # verbose output used by GitHub Actions
npm run typecheck    # verify TypeScript without creating a build
```

## What is covered

- OAuth PKCE verification, hashing, discovery URLs, and public-client metadata
- OAuth registration redirect safety, CORS, and controlled failures
- OAuth code exchange, client and redirect binding, refresh rotation, and invalid grants
- Connector note/page ID rules, ownership fields, size limits, duplicates, and storage errors
- Request limiting and forwarded IP extraction
- Email campaign batch and subscriber timing rules

## Where tests live

Tests sit beside the code they protect and end in `.test.ts`. For example:

```text
src/lib/oauth.ts
src/lib/oauth.test.ts
```

This makes it easy to find the behavior specification when changing a module.

## Development workflow

1. Describe the behavior or bug in one test.
2. Run that test and confirm it fails for the expected reason.
3. Make the smallest code change that fixes the behavior.
4. Run the test again.
5. Run `npm test` and `npm run typecheck` before pushing.

For a regression, keep the new test permanently so the bug cannot silently return.

## GitHub Actions

`.github/workflows/ci.yml` runs tests and TypeScript checks on every pull request and every push to `main`. It uses read-only repository permissions, cancels obsolete runs, and stops after ten minutes.

The workflow deliberately does not receive production secrets. Vercel remains responsible for the environment-backed production build. Add dedicated test-service credentials later only when database-backed end-to-end tests are introduced.

## Mocks and production data

Current tests replace Supabase and other external boundaries with controlled in-memory responses. They do not:

- write to production Supabase
- send analytics events
- send email
- trigger payments
- consume Clerk or Sentry quotas

When real database integration tests are added, use a separate Supabase test project—not the production project.
