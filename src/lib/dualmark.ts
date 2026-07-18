/**
 * DualMark AEO configuration for Jobing AI.
 *
 * Public pages with a Markdown twin are declared here. The same configuration
 * powers the Markdown route, content negotiation in middleware, and alternate
 * discovery headers. Keep each renderer aligned with its current HTML page.
 */
import type { DualmarkNextConfig } from "@dualmark/nextjs";
import { toMarkdownPath } from "@dualmark/core";

/** Public origin, no trailing slash. Override locally with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://jobing.site"
).replace(/\/+$/, "");

const CONNECTOR_URL = `${SITE_URL}/mcp`;
const FORMS_SITE_URL = "https://forms.jobing.site";

function renderHome(): string {
  return `# Jobing AI

> Give your AI the tools to finish the work.

Jobing AI is one connector that lets the AI app you already use publish web
pages, create custom forms, collect responses, and help you work with those
responses. It turns a conversation into a live result instead of stopping at
instructions or code.

## Connect once

Add this connector URL to an AI app that supports MCP:

\`${CONNECTOR_URL}\`

Sign in to Jobing, review the requested permissions, and approve only the
abilities you want the AI to use. You can inspect or disconnect AI apps later
from [Manage connections](${SITE_URL}/connector/manage).

[See the connection guide](${SITE_URL}/connector) or open the
[Jobing dashboard](${SITE_URL}/dashboard).

## What Jobing can do today

- **Publish web pages.** Ask for a landing page, event page, portfolio, campaign
  page, or other focused browser-based page. Each page gets its own
  \`jobing.online\` address.
- **Keep page links stable.** Ask the AI to update a live page later without
  changing its public address.
- **Create custom forms.** Build contact, application, registration, waitlist,
  feedback, quote-request, and intake forms from normal-language instructions.
- **Use native website forms.** Put a form directly inside a page and control its
  wording, layout, colors, fonts, spacing, and buttons. Jobing handles response
  collection without forcing a generic iframe.
- **Manage responses.** Search answers, summarize common needs, and organize
  submissions into inbox, spam, or archive after approving response access.
- **Work without AI when needed.** Use the dashboard to manage pages, edit forms,
  view responses, copy form code, export visible responses, and disconnect apps.

## A typical request

> Create a marketing page for my consultancy. Add a project enquiry form that
> asks about budget, timeline, and goals. Match the form to the page, publish
> both, and give me the live page and dashboard links.

Jobing is designed to return the finished page, working form, response inbox, and
management links rather than another setup tutorial.

## Important boundaries

Jobing publishes focused web pages and runs custom forms. It is not currently a
full web-application backend, CRM, payment processor, live scheduling system, or
email marketing platform. Email follow-up is coming soon and is not a current
connector ability.

## Explore

- [Connect Jobing AI](${SITE_URL}/connector)
- [Jobing Forms](${FORMS_SITE_URL})
- [Pricing](${SITE_URL}/pricing)
- [About Jobing AI](${SITE_URL}/about)
- [Free utilities](${SITE_URL}/tools)
`;
}

function renderConnector(): string {
  return `# Connect Jobing AI to your AI app

Jobing AI gives a compatible AI app permission to publish web pages, create and
publish custom forms, and help with form responses. The user adds one connection,
signs in once, and remains in control of what the AI can do.

## Connector URL

\`${CONNECTOR_URL}\`

## How to connect

1. Open the connector or integrations settings in an AI app that supports MCP.
2. Add the Jobing AI connector URL shown above.
3. Sign in to Jobing.
4. Review the requested abilities and choose **Allow access** only if they match
   what you want the AI to do.
5. Return to the AI conversation and ask for a page, form, or response task.

The current website includes setup guidance for ChatGPT and Claude. Compatibility
depends on the AI app's current MCP connector support.

## Available abilities

- Create a public text note.
- List, open, publish, update, and manage web pages.
- Create, duplicate, and edit private form drafts.
- List form definitions without reading responses.
- Publish a form and return its hosted link, native website form code, response
  inbox, editor, share page, and dashboard links.
- Search and summarize form answers after the user approves separate response
  access.
- Move responses between inbox, spam, and archive.
- Send short product feedback only after the user confirms it.

## User control

Form creation and response reading use separate permissions. New forms remain
private drafts until published. Uploaded file contents are not returned to the
AI. Permanent page deletion requires explicit confirmation. Connected apps can
be reviewed or disconnected from [Manage connections](${SITE_URL}/connector/manage).

## Prompts to try

> Create a marketing page for my accounting firm. Add a contact form that matches
> the page, publish both, and give me the live link.

> Add a portfolio URL and expected salary to my application form. Keep the
> current live form unchanged until I approve the draft.

> Show me new responses from my contact form. Summarize what each person needs
> and move obvious spam out of the inbox.

[Open the visual connection guide](${SITE_URL}/connector) or
[go to the dashboard](${SITE_URL}/dashboard).
`;
}

function renderAbout(): string {
  return `# About Jobing AI

## Why Jobing exists

AI apps can understand a request, write copy, and generate code, but people are
often left to complete the difficult part themselves. A page still needs to be
published. A form still needs a reliable place to send answers. Responses still
need to be reviewed and turned into a decision.

Jobing AI exists to close that gap between an AI answer and a finished result.

## Our mission

Our mission is to let people complete useful online work from the AI app they
already know. One approved connector should be enough to publish a focused web
page, add a custom form, collect responses, and return to the same conversation
when something needs to change.

## Our product principles

- **Finish the workflow.** Return a live page, working form, response inbox, and
  useful links instead of another tutorial.
- **Keep the user in control.** Show permissions clearly, keep form drafts
  private, require confirmation for destructive actions, and make connections
  easy to revoke.
- **Let the design belong to the customer.** Forms can use native website code
  instead of a forced branded iframe.
- **Make the result manageable.** Everything created through AI is also available
  in a normal dashboard.
- **State boundaries honestly.** Jobing is focused on pages and forms today. It
  should not be presented as a complete application builder, CRM, scheduler, or
  mailing platform.

## The products

- **Jobing AI Connector:** the connection between a user's AI app and Jobing.
- **Jobing Pages:** publishing and management for focused public web pages.
- **Jobing Forms:** custom forms, response collection, uploads, an inbox, and
  user-approved AI assistance with answers.
- **Jobing Dashboard:** direct management for pages, forms, responses, billing,
  and connected apps.

Start with the [connection guide](${SITE_URL}/connector), visit
[Jobing Forms](${FORMS_SITE_URL}), or open [Pricing](${SITE_URL}/pricing).
`;
}

function renderPricing(): string {
  return `# Jobing AI pricing

Start free. Pay when Jobing becomes useful enough to need more forms or more
visible responses. A card is not required for the free allowance.

Prices and allowances below reflect the current product and may change. The
[visual pricing page](${SITE_URL}/pricing) is the checkout source of truth.

## Free

- Up to 5 total forms
- Up to 5 published forms
- View up to 50 responses each month
- Valid responses continue being accepted and saved after the viewing allowance
  is reached

## Starter: $9 per month

- Up to 25 total and published forms
- View up to 5,000 responses each month
- Unlimited published web pages
- Create and edit from a connected AI app
- One dashboard for responses
- Standard support

## Business: $29 per month

- Up to 100 total and published forms
- View up to 25,000 responses each month
- Everything in Starter
- Priority support

## What happens at a limit

If the account reaches its form allowance, Jobing blocks a new form or publish
action and directs the user to pricing. Existing published forms continue
working.

If the account reaches its monthly response viewing allowance, valid submissions
continue being accepted and saved. Additional responses remain locked until the
account has enough allowance. This prevents a visitor's enquiry from being lost
because the form owner reached a plan limit.

Paid plans are monthly subscriptions. Checkout is handled by Dodo Payments,
upgrades should apply automatically, and subscriptions can be managed from the
[billing page](${SITE_URL}/billing).
`;
}

function renderTools(): string {
  return `# Free Jobing utilities

Jobing also provides a small collection of focused browser tools. These are
separate from the main connector workflow.

## Available tools

- **Jobing Clipboard:** write, save, and share text with a short link. No login
  is required for basic use.
- **HTML Online Viewer:** edit HTML and preview the result in the browser.
- **LastMinute:** turn a study PDF into a concise revision sheet inside ChatGPT.

Explore the collection at [${SITE_URL}/tools](${SITE_URL}/tools).

## Main Jobing product

To publish web pages, create custom forms, and work with responses from your AI
app, use the [Jobing AI connector](${SITE_URL}/connector).
`;
}

function renderOnlineNotepad(): string {
  return `# Jobing Online Notepad

Jobing's online notepad is a free browser editor for writing or pasting up to
100,000 characters and turning the text into a shareable short link. No account
or installation is required for basic use.

## What it does

- Opens directly into a writing area.
- Saves text to a link such as \`${SITE_URL}/c/my-notes\`.
- Supports memorable custom link names when available.
- Lets the recipient copy the note or its link.
- Works across phones, tablets, and computers.

## How to use it

1. Open [the editor](${SITE_URL}/copy).
2. Write or paste the text.
3. Choose **Create Share** and copy the resulting link.

A low-profile \`/p/\` version of a note link is available, but it is not access
control. Anyone who receives a public note link can open it, so notes should not
contain passwords, secrets, or confidential customer information.

[Open the online notepad](${SITE_URL}/online-notepad).
`;
}

function renderOnlineClipboard(): string {
  return `# Jobing Online Clipboard

Jobing's online clipboard moves text between devices through a short browser
link. Paste on one device, create a share link, open it on another device, and
copy the text back out. No account or installed app is required for basic use.

## Common uses

- Move a URL from a computer to a phone.
- Share a code snippet or paragraph.
- Keep a temporary browser-based scratchpad.
- Give another person a block of text without creating a document.

## How to use it

1. Open [the clipboard editor](${SITE_URL}/copy).
2. Paste the text and choose **Create Share**.
3. Open the resulting link on another device and copy the contents.

Each link is public to anyone who receives it. Do not use the clipboard for
passwords, access tokens, payment details, or other confidential information.

[Open the online clipboard](${SITE_URL}/online-clipboard).
`;
}

function renderShareText(): string {
  return `# Share text online with Jobing

Turn a block of text into a short browser link that can be opened on another
device or sent to another person. Basic use is free and does not require an
account.

## How it works

1. Open [the Jobing editor](${SITE_URL}/copy).
2. Paste or write up to 100,000 characters.
3. Choose **Create Share**.
4. Copy the resulting link and send it where it is needed.

Custom link names may be used when available. A low-profile \`/p/\` link is not a
private or password-protected note. Anyone with the link can view the text, so do
not publish secrets or confidential information.

[Open Share Text](${SITE_URL}/share-text).
`;
}

function renderPrivacy(): string {
  return `# Jobing AI Privacy Policy

_Last updated: July 18, 2026_

This summary explains the information Jobing handles when people use the Jobing
AI connector, Pages, Forms, the dashboard, billing, and public utilities. The
[visual privacy page](${SITE_URL}/privacy) contains the same current policy.

## Information Jobing handles

- **Account information:** sign-in details such as name, email address, and
  profile image supplied through the authentication provider.
- **Workspace content:** pages, page code, public notes, form definitions,
  settings, and publishing information created by the user or their approved AI.
- **Form responses:** answers and files submitted by people using a Jobing form.
  This information belongs to the form owner's workflow.
- **Connector records:** the connected AI app, approved permissions, connection
  status, and basic operation results. Jobing's product analytics are designed
  not to record full chat prompts or transcripts.
- **Billing records:** plan, subscription status, and provider references. Jobing
  does not receive full payment-card details.
- **Reliability and usage information:** events such as which product ability was
  used, whether it succeeded, broad use-case categories, timing, and errors.

## How Jobing uses information

Jobing uses this information to provide the requested product, authenticate the
user, publish and manage pages, run forms, store and return responses, prevent
abuse, process subscriptions, provide support, understand reliability, and
improve the product.

Jobing does not sell form responses, uploaded files, page content, or private
workspace content.

## AI connections

The user chooses an AI app and approves the Jobing permissions it requests. The
AI app has its own terms and privacy practices. Jobing returns only information
allowed by the approved permission and requested operation. Reading form answers
requires separate access. Uploaded file contents are not returned through the
connector, although basic file details may be shown.

## Public content

Published pages, hosted forms, and shared notes can be viewed by anyone with the
public link. Form owners decide what questions to ask and are responsible for
providing appropriate notices, collecting lawful consent, and avoiding
unnecessary sensitive information.

## Service providers and storage

Jobing uses service providers for authentication, hosting, databases, payments,
analytics, and error reporting. Information may be processed in the regions
where those providers operate. Jobing uses separate storage for the main account
and the Forms service to reduce unnecessary access between product areas.

## Analytics and error reporting

Product analytics and error reporting are configured to avoid prompts, form
answers, uploaded file contents, page HTML, names, email addresses, cookies,
credentials, and request bodies. No filter is perfect, so Jobing also limits what
the application sends to these services.

## Retention, access, and deletion

Jobing keeps information while it is needed to provide the service, prevent
abuse, meet legal obligations, and maintain reasonable backups. Users can delete
individual pages, manage forms and responses, revoke AI connections, and request
broader account or data assistance through the [feedback page](${SITE_URL}/feedback).
Some records may remain for a limited period in backups, security logs, payment
records, or where retention is legally required.

## Security

Jobing uses encrypted connections, account-based access controls, scoped
connector permissions, private response access, validation, request limits, and
other safeguards. No online service can promise absolute security. Uploaded
files are not currently malware-scanned and should be opened carefully.

## Contact

Questions or privacy requests can be sent through
[Jobing feedback](${SITE_URL}/feedback).
`;
}

function renderTerms(): string {
  return `# Jobing AI Terms of Service

_Last updated: July 18, 2026_

These terms apply to the Jobing AI connector, Pages, Forms, dashboard, billing,
and public utilities. By using Jobing, you agree to these terms. If you do not
agree, do not use the service.

## The service

Jobing lets users connect a compatible AI app, publish focused web pages, create
and run forms, collect responses, manage a response inbox, and use related
utilities. Features, limits, and availability may change as the product evolves.

Jobing is not a full application backend, CRM, payment processor, live scheduling
system, or professional legal, hiring, financial, or medical decision service.

## Accounts and AI connections

Users are responsible for their account, approved AI connections, and activity
performed with those permissions. Review requested permissions before allowing
access and disconnect an AI app that is no longer trusted or needed.

## User content

Users retain ownership of the pages, form content, notes, and other material they
provide, subject to any rights held by other people. Users grant Jobing the
limited permission needed to store, process, publish, transmit, and display that
content to operate the service.

Users must have the right to publish their content, including text, images,
scripts, fonts, trademarks, and other third-party material. Public pages and
notes may be viewed by anyone with the link.

## Forms and respondent information

Form owners choose the questions, purpose, and people who receive the form. They
are responsible for lawful collection, clear notices, appropriate consent,
response handling, and any decisions made from the information. Do not collect
passwords, payment-card details, or sensitive information that is not necessary
for the stated purpose.

The connected AI can read responses only when the user grants response access
and asks for them. AI summaries or rankings are assistance, not final decisions.
A person must review high-impact decisions such as hiring, education, housing,
credit, healthcare, or access to essential services.

## Acceptable use

Do not use Jobing to:

- break the law or another person's rights;
- publish malware, phishing, deceptive impersonation, or harmful code;
- collect passwords, full payment-card details, or authentication secrets;
- harass, exploit, discriminate against, or defraud people;
- send abusive traffic, bypass limits, or interfere with the service;
- publish content without the required rights or consent;
- make prohibited automated high-impact decisions;
- misrepresent Jobing pages as being reviewed or endorsed by Jobing.

Jobing may restrict or remove content, connections, or accounts that create risk,
violate these terms, or threaten the service or other people.

## AI-generated material

AI-generated pages, form questions, summaries, and recommendations can be
incorrect, incomplete, biased, inaccessible, or unsuitable. The user must review
the result before publishing it or relying on it. Jobing does not guarantee a
particular business, hiring, marketing, or financial outcome.

## Plans and payments

Free and paid plans have form and response allowances described on the
[pricing page](${SITE_URL}/pricing). Valid form submissions may continue being
saved after a response viewing allowance is reached, while access to additional
responses can remain locked until enough allowance is available.

Paid plans renew monthly unless cancelled. Checkout and payment details are
handled by the payment provider. Cancelling normally leaves paid access active
until the end of the current billing period, after which the workspace returns
to the applicable free limits. Fees already charged are non-refundable except
where required by law or explicitly stated during checkout.

## Availability and third-party services

Jobing depends on hosting, authentication, database, AI-app, payment, analytics,
and other providers. The service may be interrupted, changed, or discontinued,
and Jobing does not guarantee uninterrupted availability or compatibility with
every AI app.

## Disclaimers and liability

The service is provided on an “as is” and “as available” basis to the extent
permitted by law. Jobing disclaims warranties that are not expressly stated.
To the extent permitted by law, Jobing is not liable for indirect, incidental,
special, consequential, or punitive damages, or for lost profits, opportunities,
data, or goodwill arising from use of the service.

Nothing in these terms excludes rights or liability that cannot legally be
excluded. Users may have additional consumer rights under local law.

## Changes and contact

Jobing may update these terms as the service changes. The current version and
date will be published here. Questions can be sent through
[Jobing feedback](${SITE_URL}/feedback).
`;
}

export const dualmarkConfig: DualmarkNextConfig = {
  siteUrl: SITE_URL,
  internalNamespace: "md",

  staticPages: [
    { pattern: "/", render: renderHome },
    { pattern: "/connector", render: renderConnector },
    { pattern: "/about", render: renderAbout },
    { pattern: "/pricing", render: renderPricing },
    { pattern: "/tools", render: renderTools },
    { pattern: "/online-notepad", render: renderOnlineNotepad },
    { pattern: "/online-clipboard", render: renderOnlineClipboard },
    { pattern: "/share-text", render: renderShareText },
    { pattern: "/privacy", render: renderPrivacy },
    { pattern: "/terms", render: renderTerms },
  ],

  middleware: {
    injectLinkHeader: false,
    skipPaths: [
      "/api",
      "/sign-in",
      "/sign-up",
      "/billing",
      "/edit",
      "/copy",
      "/c",
      "/p",
      "/pages",
    ],
  },

  headers: {
    cacheControl: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    noindex: true,
  },
};

const STATIC_TWIN_PATHS = new Set(
  dualmarkConfig.staticPages?.map((page) => page.pattern) ?? [],
);

/** Does pathname have a Markdown twin that Jobing currently serves? */
export function hasMarkdownTwin(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return STATIC_TWIN_PATHS.has(clean);
}

/** Public twin path for an HTML path, for example /about to /about.md. */
export function markdownTwinPath(pathname: string): string {
  return toMarkdownPath(pathname);
}
