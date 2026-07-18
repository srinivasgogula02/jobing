# Jobing Forms product audit against HeyForm

Audited against HeyForm's `next` branch at commit `4bfca60` on 18 July 2026. HeyForm is AGPL-3.0; this document records product observations only. No HeyForm source code is copied into Jobing.

## Jobing's position

HeyForm is a broad standalone form builder. Jobing Forms should not become a smaller clone. Its advantage is that one AI connector can create the form, put native HTML into a custom web page, publish the page, collect responses, and help the owner understand those responses without an iframe or a separate database setup.

## What Jobing already does better for its target workflow

- Returns native HTML with a stable form endpoint instead of making an iframe the primary integration.
- Lets an AI create, update, duplicate, publish, and link forms from the same conversation used to create a page.
- Keeps published versions immutable while edits remain drafts.
- Accepts valid responses after the owner's monthly viewing allowance is reached, so customer leads are not lost.
- Returns the editor, response inbox, share page, and Forms dashboard links after connector operations.
- Uses origin controls, idempotency, payload limits, file limits, rate limits, and least-privilege database functions.

## Important gaps found and addressed

### Adaptive forms

Added conditional questions using earlier answers. Rules support equality, inequality, text containment, empty state, and numeric comparisons. The same rules run in the hosted form, the AI-returned native HTML, and server-side validation. Hidden conditional fields are disabled and ignored server-side, preventing spoofed answers from being stored.

### Better answer types

Added rating, yes/no, and time questions to the schema, editor, hosted renderer, native HTML generator, MCP tools, and submission validation.

### Response controls

Added pause/resume, opening and closing times, an exact owner-defined lifetime response cap, a custom closed message, custom submit text, and optional completion progress. The database serializes cap checks under concurrency; idempotent retries still succeed after a form closes.

### Hidden context

Changed hidden questions from discarded fields into bounded context fields. They can attach campaign, source, product, or workflow labels to every response. They remain declared in the form definition, are escaped in generated HTML, and are never treated as a visible required question.

### Rollout safety

The Forms deployment calls the new database function when available and temporarily falls back to the previous function during a rolling migration. This avoids an outage if web and database deployments finish in different orders.

## Gaps that should not be copied directly

- iframe-first embed modes conflict with Jobing's native, fully branded HTML promise.
- custom CSS inside the hosted builder is less valuable when Jobing can generate the complete surrounding page.
- payments, quizzes, signatures, and complex input tables add large validation and compliance surfaces before the core website-lead workflow is proven.
- full multi-team project management duplicates the account/workspace system and is not a phase-one acquisition advantage.
- passwords and mandatory CAPTCHA add respondent friction and should remain opt-in, risk-based features.

## Strong next investments

1. Form funnel analytics: privacy-preserving views, starts, per-question abandonment, completion rate, and device breakdown.
2. Outbound workflows: signed webhooks, retry history, Slack/Sheets/CRM destinations, and email follow-up when the email product is ready.
3. Multi-language forms: translated labels, validation, and confirmation screens while preserving stable response keys.
4. Reusable templates: industry and goal-based templates that an AI can adapt rather than generic blank forms.
5. Collaboration: invitation, role, comment, and change history only after team demand is demonstrated.
6. Advanced form modes: quiz scoring, calculations, payment, signatures, and conversational one-question screens as separate, explicit products rather than default complexity.

## Success criteria

- A non-technical owner can ask an AI for a form and receive a working page plus the relevant dashboard links.
- A respondent can submit without an account, iframe, mandatory challenge, or unexpected redirect.
- The visible form, native HTML, API validation, and database rules agree on which answers are valid.
- Closing or capping a form is race-safe and never converts a retry into a duplicate or a false failure.
- New features do not expose prompts, response content, contact details, or uploaded files to product analytics.
