# Jobing AI: Complete Product Reference

- **Document status:** Current product source of truth
- **Last reviewed:** 17 July 2026
- **Audience:** Customers, collaborators, judges, marketers, support teams, product teams, and AI assistants that need accurate context about Jobing AI
- **Product website:** [jobing.site](https://jobing.site)
- **Connector URL:** `https://jobing.site/mcp`

> This document explains the product in normal language. It describes what is available today, what is coming soon, and what is only a possible future direction. It is not a legal policy or a technical implementation guide.

---

## The shortest explanation

### In one sentence

Jobing AI is one connector that lets the AI app you already use publish web pages, create custom forms, collect responses, and help you work with those responses.

### In three sentences

Jobing AI turns an AI conversation into finished, usable work instead of stopping at advice or code. Connect it once to a compatible AI app, then ask in normal language for a web page, a custom form, or help understanding the answers people submitted. Jobing publishes the page, runs the form, saves the responses, and keeps everything available in a dashboard where the user remains in control.

### In fewer than ten words

**Give your AI the tools to finish the work.**

---

## Copyable context for another person or AI

Use the following block when another person or AI needs a quick but accurate understanding of the product:

> Jobing AI is a connector for AI apps that support MCP, a common way for an AI to use outside tools with a user's permission. A user adds the Jobing connector URL once, signs in, and approves the abilities they want to give the AI. The user can then ask the AI to publish and update web pages, create and publish custom forms, embed forms as native website code, list and search form responses, summarize answers, and organize responses into inbox, spam, or archive. Jobing also provides a normal dashboard, so the user can manage pages, edit forms, view responses, copy form code, export visible responses, and disconnect AI apps without using AI. Published pages receive their own `jobing.online` address. Forms can be hosted by Jobing or placed directly inside another page without a generic iframe, while Jobing handles response collection. Form drafts remain private until published, live forms keep working while edits are prepared, responses continue being saved after a plan's monthly viewing allowance is reached, and uploaded file contents are not exposed to the AI. Jobing is not a full web-app builder, CRM, payment processor, scheduling system, or email marketing platform. Email follow-up is planned but is not a current connector ability.

---

## 1. What Jobing AI is

Jobing AI is the action layer between a person, their AI app, and the work they want to put on the internet.

AI apps are already good at understanding a request, writing copy, suggesting questions, and generating HTML. The usual problem begins after that. The person still has to choose a website tool, configure hosting, create a form, connect a database, test submissions, find the responses, and return to several dashboards whenever something changes.

Jobing reduces that handoff. It gives the AI approved tools that can actually perform the next step.

For example, instead of receiving a long answer explaining how to make a consultancy landing page, a user can ask:

> Create a marketing page for my consultancy. Add a project enquiry form that asks about budget, timeline, and goals. Match the form to the page, publish both, and give me the live link.

The intended result is not another tutorial. It is:

- a live web page;
- a working form that visually belongs on the page;
- a place where every valid response is saved;
- links to the relevant Jobing dashboards;
- the ability to return to the same AI conversation and ask for a change.

Jobing can also be used without AI after setup. The dashboard provides direct access to pages, forms, form editing, sharing, responses, billing, and connected AI apps.

---

## 2. The problem Jobing solves

### AI often stops before the useful outcome

An AI can generate a page or form, but users are often left with code, instructions, or a preview. The user still has to work out where to put it and how to make it operate reliably.

Jobing is designed for the point where an answer needs to become an action.

### Page builders and form builders live in separate places

A person may design a page in one product, create a form in another, collect responses in a third, and use a spreadsheet or another AI session to understand the results. Every additional tool introduces another login, another interface, another bill, and another place where the workflow can break.

Jobing combines the page, form, response inbox, and AI-assisted follow-up workflow behind one connection.

### Standard forms often do not look like the website

Standalone form products are useful when the form itself is the destination. They become less suitable when a form needs to feel like a natural part of a business website, campaign page, portfolio, or event page.

Jobing Forms can provide native form code. The page controls the fonts, colors, labels, spacing, layout, and buttons. The response collection still works in the background. This avoids forcing the visitor into a visibly separate form or a generic embedded frame.

### Custom forms normally require hidden setup

A custom-looking form is only the visible half of the job. It also needs a safe place to send answers, validation, duplicate protection, upload handling, an inbox, and a way for the owner to retrieve the results.

Jobing handles that operational side so the user can focus on what the form should ask and what should happen after a response arrives.

### Collected answers are useful only when someone acts on them

Form products commonly stop at a response list. Jobing lets the user ask their connected AI to find patterns, compare responses, prepare a summary, or help decide what to do next. The AI receives answers only when the user has approved response access and asks it to retrieve them.

---

## 3. The core product promise

Jobing is built around five ideas:

1. **Connect once.** The same Jobing connection can be used for pages, forms, and responses.
2. **Ask normally.** The user describes an outcome in plain language rather than learning a special command system.
3. **Keep control.** Drafts, publishing, permissions, destructive changes, and connected AI apps remain under the user's control.
4. **Finish the workflow.** A page should be live, a form should receive answers, and the answers should be usable.
5. **Return to one place.** Everything the AI creates is also available from the Jobing dashboard.

---

## 4. Who Jobing is for

### Small business owners

For people who need a professional online page and a reliable way to receive enquiries, but do not want to assemble a website stack.

Examples include:

- local services;
- consultancies;
- agencies;
- accountants;
- coaches;
- photographers;
- studios;
- restaurants taking reservation requests;
- home services collecting quote requests;
- independent professionals collecting project enquiries.

### Founders and product teams

For launching a waitlist, validating an idea, creating a campaign page, collecting beta feedback, or understanding repeated customer requests.

### Marketers

For publishing campaign pages, lead magnets, event registration pages, and lead forms without waiting for a separate engineering workflow.

### Recruiters and hiring managers

For creating application forms with role-specific questions, collecting uploaded documents, filtering responses by the answers, and building a shortlist from structured information.

The connected AI can work with answers entered into the form. It cannot open or read the contents of an uploaded résumé through the connector. The owner can securely download the file and review it separately.

### Consultants and agencies

For project intake, client discovery, campaign pages, quote requests, and repeated form setups for different engagements.

### Creators and independent professionals

For portfolios, launch pages, audience surveys, waitlists, collaboration enquiries, sponsorship enquiries, and simple public information pages.

### Event organizers and communities

For registrations, RSVPs, speaker applications, volunteer signups, sponsorship enquiries, post-event feedback, and community interest forms.

### Researchers and customer experience teams

For surveys, interviews, open-ended feedback, feature requests, and summaries of recurring themes.

### People who prefer AI to traditional software interfaces

The strongest fit is a person who is comfortable describing an outcome to an AI but does not want to learn several new products to complete it.

---

## 5. How the complete experience works

### Step 1: Connect Jobing to an AI app

The user copies this URL:

`https://jobing.site/mcp`

They add it to an AI app that supports MCP connectors, sign in to Jobing, and review the requested permissions.

MCP can be explained simply as a standard connection that lets an AI use outside tools on a person's behalf. The user does not need to understand the standard to use Jobing.

### Step 2: Approve only the abilities that are needed

Jobing shows what the connection is asking to do. Permissions are separated by product area, including pages, forms, responses, notes, and feedback.

Response access is separate from form creation. An AI that can create a form does not automatically receive permission to read the answers.

### Step 3: Ask in normal language

The user can ask for an outcome instead of issuing a rigid command. The AI decides which approved Jobing tools are required.

Examples:

- “Create a waitlist for my new fitness app.”
- “Publish a one-page site for Saturday's workshop.”
- “Add a budget question to my project form, but do not publish the change yet.”
- “Show the newest enquiries and summarize what each person needs.”

### Step 4: Review before sensitive actions

Forms are created as private drafts. The user can inspect or change them before publishing.

The AI may ask for confirmation when an action has meaningful consequences. Deleting a page permanently requires an explicit confirmation. Sending product feedback also requires confirmation.

### Step 5: Publish or share

A page receives a public `jobing.online` address. A published form receives a hosted form link and a submission address that can be used by native form code on another website.

The AI should return the live link and the matching dashboard link, not only announce that the action succeeded.

### Step 6: Collect responses

Visitors fill the form on a Jobing-hosted form page or directly inside the user's website. Valid submissions are stored in the form's response inbox.

### Step 7: Work with the results

The owner can use the dashboard or ask the connected AI to:

- find recent responses;
- search for a name, email, or answer;
- compare answers;
- summarize common requests;
- identify likely spam;
- move responses between inbox, spam, and archive;
- suggest follow-up priorities;
- export the responses visible on the current plan.

---

## 6. The Jobing product family

### Jobing AI Connector

The connector is the main entry point for AI-assisted work. It links the user's Jobing account to a compatible AI app and gives that AI only the abilities the user approves.

The connector can currently work with:

- web pages;
- form definitions;
- form publishing;
- form responses;
- public text notes;
- structured product feedback.

### Jobing Dashboard

The dashboard is the user's home inside Jobing. It provides the connector URL, setup help, and direct navigation to pages and forms.

Important areas include:

- [Dashboard](https://jobing.site/dashboard)
- [Pages](https://jobing.site/dashboard/pages)
- [Forms](https://jobing.site/dashboard/forms)
- [Connected AI apps](https://jobing.site/connector/manage)
- [Pricing](https://jobing.site/pricing)
- [Billing](https://jobing.site/billing)

### Jobing Pages

Jobing Pages publishes self-contained web pages. Each page receives a unique address such as:

`https://your-page-name.jobing.online`

The owner can view the live page, return to the editor, update it without changing its address, or delete it after confirmation.

### Jobing Forms

Jobing Forms creates, publishes, and runs custom forms. It includes:

- an AI-assisted creation flow;
- a familiar manual form builder;
- hosted forms;
- native form code for websites;
- response collection;
- file uploads;
- a private response inbox;
- table and list views;
- search and sorting;
- spam and archive organization;
- downloadable response files;
- CSV export of visible responses;
- AI-assisted response review when approved.

### Jobing Notes

Jobing can create a simple public text note and return a shareable link. This is a smaller utility for sharing text, instructions, a brief, a checklist, or other plain content. It is not the main product focus.

### Jobing Operations

Jobing's internal operations view helps the product team understand reliability, connector usage, failures, and confirmed feature requests. It is not a customer workspace and does not expose one customer's work to another.

---

## 7. What Jobing can do today

### 7.1 Connect an AI app to a Jobing account

- Use one connector URL.
- Sign in with the same Jobing account used for the dashboard.
- Review the AI app that is requesting access.
- Approve specific abilities.
- See when a connection was created;
- disconnect an AI app immediately from the manage connection page;
- reconnect when new permissions are required.

An older connection may have only page or note permissions. If the AI says it lacks form access, the user should reconnect Jobing and approve the relevant form permission.

### 7.2 Create and publish web pages

The connected AI can:

- create a complete page from a description;
- publish it to a unique public address;
- return the live page link;
- return the page dashboard and editor links;
- list existing pages;
- open the current page content;
- update the page while keeping the same public link;
- make focused edits instead of recreating the entire page;
- permanently delete a page after explicit confirmation.

The dashboard can:

- show all published pages;
- open a live page;
- open the page editor;
- create a new page;
- copy the public link;
- edit the page's HTML;
- preview the result before deploying.

#### Suitable page types

- business landing pages;
- campaign pages;
- portfolios;
- event information pages;
- launch pages;
- waitlist pages;
- menus and service pages;
- simple information tools;
- client-side calculators or interactive pages that can run in a browser;
- pages that include one or more Jobing forms.

#### Important page boundary

Jobing Pages publishes browser-based pages. It is not currently a system for building a complete custom application with arbitrary server logic, private databases, user roles, marketplaces, or complex account systems.

AI-generated pages may include third-party images, fonts, scripts, or links. The publisher is responsible for reviewing the content and ensuring they have the right to use it.

### 7.3 Create form drafts

The connected AI can create a form draft from a normal-language request. A draft can include:

- a name and description;
- questions and answer types;
- required and optional questions;
- help text and placeholders;
- answer choices;
- validation rules;
- hidden fields;
- success messages;
- a redirect after submission;
- visual presentation settings;
- a list of websites allowed to submit the form.

A draft is private. It does not have a public form link until it is published.

This distinction prevents a half-finished form from being shared accidentally. When an AI creates a draft, it should return the form editor and forms dashboard links rather than presenting a non-working public link.

### 7.4 Edit a form without interrupting the live form

When a published form is edited, Jobing prepares a new draft version. The current live version continues to work while the user reviews the changes.

The user can:

- add, edit, duplicate, move, or delete questions;
- change a question type;
- update required fields;
- change the design;
- change the thank-you message;
- add or remove a redirect;
- restrict which websites can submit;
- save automatically while editing;
- publish the new version when ready.

Existing responses stay attached to the form. Editing does not erase the inbox.

If the same form changes in another browser tab or AI conversation, Jobing avoids silently replacing the newer change and asks the user to refresh.

### 7.5 Duplicate a form

A form can be duplicated to create a separate private draft. This is useful for:

- reusing a client intake form;
- preparing a similar event registration form;
- creating a new campaign from a successful form;
- testing a variation without changing the original.

The original form's responses remain with the original. They are not copied into the duplicate.

### 7.6 Publish a form

Publishing makes a fixed version of the form live. Jobing returns:

- a hosted form link;
- the form's submission address;
- native HTML for a website;
- the form editor link;
- the response inbox link;
- the share page link;
- the forms dashboard link.

Future edits do not change the live form until the user publishes again.

### 7.7 Use a hosted form

Every published form can be opened on a Jobing-hosted page. This is useful when the user needs a form link immediately and does not yet have a website.

The hosted form can use:

- a light or dark style;
- custom accent, background, and text colors;
- clean sans, editorial serif, or monospaced type;
- compact, comfortable, or spacious question spacing;
- solid or outlined submit buttons;
- a custom success title and message;
- an optional redirect to another secure web page.

### 7.8 Add a native form to any website

Jobing Forms is designed to work as the response service behind a fully custom form.

The user or AI can place normal form code inside a page and style it like any other part of that page. The form is not required to look like Jobing, and it does not need to be shown inside a generic iframe.

This means the site can control:

- wording;
- layout;
- labels;
- colors;
- typography;
- spacing;
- mobile behavior;
- buttons;
- surrounding content;
- success and error presentation.

Jobing continues to receive and store the submitted answers in the background.

Jobing provides copyable examples for plain HTML and React. A nontechnical user can simply ask the connected AI to add the form to the page.

### 7.9 Collect and validate responses

When a person submits a form, Jobing checks that the form is published, the answers match the form, required information is present, values fit the allowed rules, and any website restriction is respected.

Jobing also uses quiet abuse protection, request limits, a hidden spam signal, duplicate protection, and an optional browser security check. The normal visitor should not have to solve a challenge simply to send an ordinary response.

If a submission fails, the form can show a useful error without sending the visitor away from the page. If it succeeds, the page can show a confirmation or use the owner's chosen redirect.

### 7.10 Accept file uploads

Forms can currently accept:

- JPEG images;
- PNG images;
- WebP images;
- PDF files;
- plain text files;
- Microsoft Word files;
- Microsoft Excel files.

The form owner can limit accepted file types and choose a maximum of 1 MB or 2 MB for a file field. A submission can include up to 3 MB across its files.

Uploaded files are private and available to the signed-in form owner. The connected AI receives file details such as the name, type, and size, but not the file's contents.

**Current limitation:** uploaded files are not malware-scanned. Owners should download and open files carefully, especially when the sender is unknown.

### 7.11 Use these question types

Jobing Forms supports twelve field types:

1. Short text
2. Email address
3. Phone number
4. Number
5. Long text
6. Dropdown
7. Checkboxes
8. Single-choice options
9. Date
10. File upload
11. Consent checkbox
12. Website address

Forms can contain up to 100 questions. Choice questions can contain up to 100 options.

Text answers can have minimum and maximum lengths. Number answers can have minimum and maximum values. File fields can restrict file types and size.

### 7.12 Manage the response inbox

Each form has three response states:

- **Inbox:** active responses that need review or action;
- **Spam:** responses the owner does not want in the main inbox;
- **Archived:** responses that are finished but should be kept.

Moving a response is reversible. A response can be restored to the inbox later.

The dashboard supports:

- list view;
- table view;
- newest-first or oldest-first sorting;
- searching visible responses;
- paging through results;
- opening a response's full details;
- downloading attached files;
- moving responses between inbox, spam, and archive;
- exporting visible responses as a CSV file.

### 7.13 Ask AI to understand the responses

With the separate response permission approved, the user can ask the connected AI to:

- show recent responses;
- find responses containing a word or value;
- summarize individual enquiries;
- group common themes;
- compare stated budgets, timelines, preferences, or goals;
- identify incomplete or low-quality responses;
- suggest which leads may deserve attention first;
- summarize survey results;
- prepare a shortlist from structured answers;
- move obvious spam out of the inbox;
- archive completed responses.

The AI does not continuously watch or automatically read the inbox. It retrieves answers when the user asks.

The AI should present any ranking or recommendation as assistance, not as an unquestionable decision. For hiring, lending, healthcare, education, or other high-impact decisions, a person should review the evidence and make the final decision.

### 7.14 Create a public text note

The connector can publish a simple text note and return a shareable link. Notes can be useful for:

- meeting summaries;
- briefs;
- checklists;
- instructions;
- plain-text announcements;
- snippets that need a stable public link.

Notes are public to anyone who has the link. They should not contain secrets or private customer information.

### 7.15 Send product feedback through the connector

If the user discovers a missing capability or problem, the AI can offer to send short, structured feedback to Jobing.

Feedback is sent only after the user confirms. The feedback tool rejects prompts, chat transcripts, page code, links, contact details, secrets, form responses, and other private content. It is meant for a short description of the need and why it matters.

---

## 8. Complete use-case library

The following examples show what Jobing can help complete today. They are starting points, not rigid templates.

### Lead generation

- Publish a service page with a consultation form.
- Ask about the visitor's problem, budget, timeline, and preferred contact method.
- Review new enquiries by urgency or fit.
- Keep low-quality submissions in spam and completed leads in archive.

### Quote requests

- Create a quote page for a photographer, contractor, studio, caterer, or local service.
- Collect the details needed to estimate the work.
- Request an optional reference image or document.
- Summarize each request before replying.

### Consultant or agency intake

- Collect company information, project goals, scope, budget, deadline, and decision-maker details.
- Prepare a summary before the first call.
- Duplicate the form for a new service or client type.

### Job applications

- Publish a job description page.
- Add role-specific application questions.
- Accept a résumé upload.
- Search and compare structured answers.
- Create a human-reviewed shortlist.

Remember that the AI cannot read the uploaded résumé file through Jobing. Ask candidates for key experience in form questions if the AI should compare it.

### Event registration

- Publish an event page with agenda, date, venue, and registration form.
- Collect attendee names, roles, dietary needs, or session choices.
- Review attendee totals and common requests.
- Export the visible attendee list.

Jobing does not currently issue tickets, process event payments, or guarantee seat inventory.

### Speaker, sponsor, or volunteer applications

- Collect proposals, availability, links, experience, and relevant documents.
- Search applications by topic or availability.
- Group submissions for manual review.

### Waitlists and product validation

- Publish a simple product idea page.
- Ask visitors what problem they want solved and how they handle it today.
- Measure interest before building.
- Ask AI to summarize the strongest repeated needs.

### Customer feedback

- Create a feedback survey.
- Ask rating, multiple-choice, and open-ended questions.
- Identify the most repeated complaints or requests.
- Separate actionable feedback from spam.

### Research surveys

- Collect demographic or screening information appropriate to the study.
- Ask structured and open-ended questions.
- Summarize patterns from the visible responses.
- Export data for further analysis.

The owner is responsible for consent, lawful collection, participant notices, and avoiding unnecessary sensitive data.

### Booking and reservation requests

- Collect a preferred date, time, party size, service type, and contact details.
- Show a custom confirmation message.
- Send the visitor to another page after submission.

This is a request workflow, not a live calendar. Jobing does not currently check availability or create calendar events.

### Newsletter interest

- Collect names, email addresses, and topic preferences.
- Build an audience list.
- Export visible signups.

Jobing does not currently send newsletters or manage email campaigns. Email follow-up is coming soon.

### Contact and support requests

- Add a branded contact form to a website.
- Ask the visitor to choose a topic or urgency.
- Search and organize incoming requests.

Jobing is not currently a full help desk with assignment, service-level timers, or multi-agent ticketing.

### Portfolio and creator pages

- Publish a portfolio or personal landing page.
- Add a collaboration, speaking, sponsorship, or commission enquiry form.
- Update the portfolio without changing the link.

### Restaurant and hospitality enquiries

- Publish a menu, private dining, or event enquiry page.
- Collect party size, preferred date, dietary needs, and contact details.
- Organize incoming requests.

This does not replace a real-time reservation or table-management system.

### Property and real-estate enquiries

- Publish a listing or campaign page.
- Collect viewing requests and buyer preferences.
- Summarize enquiry needs.

Jobing should not be used to make automated housing eligibility decisions.

### Education and community applications

- Collect workshop registrations, club applications, mentor requests, or program interest.
- Ask AI to summarize logistics or common needs.

Human review is essential for admissions or other high-impact decisions.

### Internal requests

- Create equipment, creative, event, or project request forms.
- Collect consistent information before work begins.
- Organize completed requests in the archive.

Forms use public submission links, so highly confidential internal workflows may require a different product with stricter access controls.

### Campaign experiments

- Duplicate a form for a new campaign.
- Publish multiple landing pages with different messages.
- Keep each page's form responses organized.

Jobing does not yet provide built-in split testing or campaign attribution reports.

### Simple interactive pages

- Publish a calculator, quiz, checklist, or other interaction that can run entirely in the visitor's browser.
- Add a form to collect the result or contact details.

Interactions that need private server processing or a custom database are outside the current page product.

---

## 9. Detailed example journeys

### Journey A: A consultant launches a lead page

1. The consultant connects Jobing to their AI app.
2. They describe the service, audience, tone, and desired questions.
3. The AI creates a form draft and a matching page.
4. The consultant reviews the questions.
5. The AI publishes the form, places the native form inside the page, and publishes the page.
6. The consultant receives the live page and dashboard links.
7. Enquiries arrive in Jobing Forms.
8. The consultant asks the AI to summarize this week's enquiries and identify who has a confirmed budget and deadline.
9. The consultant makes the final follow-up decision.

### Journey B: A recruiter improves a live application form

1. A published application form is already collecting responses.
2. The recruiter asks the AI to add a portfolio URL and expected salary.
3. Jobing updates a draft, leaving the live form unchanged.
4. The recruiter reviews the draft in the form editor.
5. The recruiter publishes the new version.
6. Existing responses remain in the inbox, and new candidates see the updated form.

### Journey C: A founder validates an idea

1. The founder asks for a simple launch page and waitlist.
2. The form asks what problem the visitor wants solved, what they use today, and their email.
3. The founder shares the public page.
4. Responses arrive over several days.
5. The founder asks the AI to group the repeated problems and quote the answers that explain them most clearly.
6. The founder uses that evidence to refine the product message.

### Journey D: A user works entirely from the dashboard

1. The user signs in at Jobing.
2. They open Forms from the dashboard.
3. They create a form manually.
4. They add questions, change colors, set a thank-you message, and publish.
5. They copy the hosted link or native form example.
6. They later return to view and export responses.

The AI connector is helpful but not mandatory for day-to-day management.

---

## 10. Prompt library

These prompts are written for a connected AI app. Users can replace the business, audience, content, style, fields, or goal.

### First connection

> Tell me what Jobing can do with the permissions I approved. Do not make any changes yet.

> List my existing pages and forms, then give me the dashboard links for both.

### Create a business page and form

> Create a marketing page for my accounting firm. Our audience is small business owners. Add a contact form that asks about company size, the accounting help they need, and their preferred start date. Keep the form as a draft and show me what you created.

> Create a one-page website for my photography studio. Add a quote request form for event type, date, location, budget, and contact details. Match the form to the page, publish both, and give me the live page and dashboard links.

### Create only a form

> Create a contact form for my consulting business. Ask for name, work email, company, project summary, budget range, and ideal launch date. Keep it private until I approve it.

> Create a customer feedback survey with a 1 to 5 rating, a multiple-choice question about the main reason they use the product, and an open question asking what we should improve.

> Create a job application form for a product designer. Ask for contact details, years of experience, portfolio URL, one example of a shipped product, salary expectation, and a résumé upload.

### Review and publish a draft

> Show me the questions in my newest form draft. Explain anything that may confuse a respondent.

> Change the budget question to these choices: under $1,000, $1,000 to $5,000, $5,000 to $15,000, and over $15,000. Do not publish yet.

> Publish the latest version of my project enquiry form. Give me the hosted form, response inbox, share page, and forms dashboard links.

### Add a form to a page

> Create a landing page for my Saturday workshop and add my registration form directly inside the page. Use native form code, not an iframe. Publish the page and give me the live link.

> Add my published contact form to my existing consultancy page. Match the current fonts, colors, spacing, and button style. Keep the visitor on the page after a successful submission.

### Update a page

> Open my latest published page and change the headline to “Clear books. Better decisions.” Keep the same public link and do not change anything else.

> Add an FAQ section to my workshop page. Keep the current registration form working and preserve the page address.

### Duplicate and adapt a form

> Duplicate my project enquiry form. Rename the copy “Website redesign enquiry,” remove the file upload, and add a question about the current website URL. Keep the copy as a draft.

### Review responses

> Show the newest responses from my contact form and summarize what each person is asking for.

> Search this month's project enquiries for people with a confirmed budget over $5,000 and a launch date within 60 days. Present the evidence, but let me decide who to contact.

> Group the open-ended answers in my feedback survey into common themes. Show how many visible responses mention each theme.

> Which questions are people leaving blank most often in the responses you can see?

> Find obvious junk responses in my contact form and ask me before moving them to spam.

> Move the responses I marked as completed into the archive.

### Event workflows

> Create an event page for a 50-person founder meetup. Add a registration form for name, company, role, dietary needs, and one topic they want discussed. Publish both and give me the links.

> Summarize the dietary needs and most requested discussion topics from my meetup registrations.

### Product validation

> Create a waitlist page for an AI bookkeeping assistant. Ask visitors what bookkeeping task takes the most time, what they use now, and whether they would pay for a faster solution.

> Read the visible waitlist responses and write a short evidence-based positioning brief. Separate what respondents actually said from your interpretation.

### Safe deletion

> List my pages with their live links. Do not delete anything.

> Permanently delete the page with ID `example-page-id`. I understand that this cannot be undone.

### Product feedback

> Jobing is missing a calendar-booking ability. Draft a short feedback report explaining that I want confirmed time slots rather than a simple booking request. Show it to me before sending.

---

## 11. What the connected AI can see and do

Permissions are intentionally separated. Depending on what the user approves, the AI may be able to:

- create public notes;
- view page names, content, and links;
- publish or update pages;
- permanently delete a page after confirmation;
- view form definitions and status without seeing responses;
- create and edit form drafts;
- publish forms;
- search and read form answers;
- see upload metadata, but not uploaded file contents;
- move responses between inbox, spam, and archive;
- send short confirmed product feedback.

The AI should not be treated as having unlimited account access. It can use only the tools and permissions available through the connection.

### Information deliberately excluded from AI response access

- uploaded file contents;
- private integration credentials;
- raw payment details;
- hidden internal security information;
- responses from another user's account.

### User controls

The user can:

- deny the initial connection;
- approve only the permissions shown;
- reconnect if new permissions are needed;
- inspect connected AI apps;
- disconnect an app immediately;
- use the dashboard without AI;
- decide when a form draft becomes public;
- approve permanent deletion;
- approve or reject a feedback report.

---

## 12. Plans, limits, and billing behavior

Prices and allowances below reflect the product on 17 July 2026 and may change. The [pricing page](https://jobing.site/pricing) is the current commercial source of truth.

### Free access

- Up to 5 total forms
- Up to 5 published forms
- View up to 50 responses each month

### Starter

- $9 per month
- Up to 25 total and published forms
- View up to 5,000 responses each month
- Unlimited published web pages
- Create and edit from the connected AI app
- Standard support

### Business

- $29 per month
- Up to 100 total and published forms
- View up to 25,000 responses each month
- Everything in Starter
- Priority support

### What happens at a form limit

If the account reaches its total or published form allowance, Jobing blocks the new creation or publish action. Existing published forms continue working. The connected AI should explain the limit and return the pricing page:

`https://jobing.site/pricing`

### What happens at a monthly response viewing limit

Jobing continues accepting and safely storing valid submissions after the monthly visible-response allowance is reached. It does not shut down the live form or show the visitor that the owner has reached a plan limit.

The owner can see the responses included in the current plan. Additional responses stay saved but remain locked until the account upgrades or the relevant allowance becomes available.

This design protects the visitor experience and prevents leads from being silently lost.

### Billing behavior

- Paid plans are monthly subscriptions.
- Checkout is handled through a secure payment provider.
- A successful purchase should update the Jobing account automatically.
- The billing page shows the current plan and management options.
- Users can cancel according to the billing terms shown during purchase and account management.

---

## 13. Trust, privacy, and safety in normal language

### One account, clear ownership

Pages, forms, and responses belong to the signed-in Jobing user. One user cannot list or manage another user's private workspace through the connector or dashboard.

### Drafts are private until published

A form draft does not receive a public form link. This gives the owner a review step before visitors can use it.

### Public pages are separated from the account dashboard

Published user pages run on the separate `jobing.online` domain. They do not receive the owner's Jobing sign-in cookies. This limits the connection between untrusted page content and the private account area.

### Response access needs separate permission

An AI can be allowed to create forms without being allowed to read submissions. This is useful when a user wants creation assistance but prefers to review customer answers only in the dashboard.

### Uploaded file contents stay outside the AI connection

The AI can see that a file exists and receive basic details, but the file itself is not returned through the connector.

### Sensitive actions require stronger intent

Permanent page deletion requires the exact page and explicit confirmation. Product feedback also requires the user's approval before sending.

### Quiet abuse controls protect the form

Jobing limits unusually frequent requests, validates answers, checks allowed websites, detects common automated patterns, and avoids storing a visitor's raw network address for abuse checks.

These controls are designed to avoid unnecessary security puzzles for normal visitors. No protection can remove all spam, so the owner also has a spam inbox and reversible response controls.

### Duplicate submissions are reduced

The form workflow uses a unique submission marker so a slow connection or repeated click is less likely to create several identical responses.

### Monitoring avoids customer content

Jobing records product events such as which ability was used, whether it succeeded, and how long it took. The monitoring setup is designed not to send prompts, page HTML, form answers, names, email addresses, cookies, request bodies, or credentials to analytics and error-reporting tools.

### The user remains responsible for what they collect and publish

Jobing provides tools, not automatic legal compliance. The form owner should:

- collect only information they genuinely need;
- explain why they collect it;
- obtain appropriate consent;
- avoid asking for passwords or payment card details;
- use additional safeguards for health, financial, identity, children's, or other sensitive information;
- review AI-generated pages for accuracy, rights, accessibility, and misleading claims;
- follow local privacy, advertising, employment, and consumer laws.

### Important launch-readiness note

The website's formal privacy and terms pages must be reviewed and updated so they accurately describe the current connector, Pages, and Forms products before a broad public launch. This document should not be used as a substitute for that legal work.

---

## 14. Usability and accessibility principles

Jobing should be understandable even if the user has never heard of MCP, APIs, endpoints, or databases.

The product experience should consistently:

- explain the connector as “one link that gives your AI approved tools”;
- show the connector URL where a new user can find it;
- return dashboard links after an AI creates something;
- distinguish private drafts from published work;
- explain what a form limit affects and what continues working;
- show progress when a connection or publish action takes time;
- keep primary actions visible on mobile;
- avoid sending visitors through unnecessary redirects;
- preserve entered form answers when a recoverable submission error occurs;
- show clear success and error messages;
- keep form controls keyboard accessible;
- use labels rather than relying only on placeholders;
- support readable contrast and responsive layouts;
- allow the user to complete core work without the connector.

The owner of an AI-generated page is responsible for reviewing the final page's accessibility. Jobing can provide a safe runtime, but the generated page's headings, color contrast, alternative text, focus order, and wording depend on the page content.

---

## 15. How Jobing compares with familiar product categories

This comparison describes the different jobs these products are usually chosen for. It is not a claim that one product is always better.

### Compared with Google Forms

Google Forms is familiar and effective for quickly collecting answers in a standalone form. Jobing Forms is a stronger fit when the form needs to look like part of a custom page, be created from an AI conversation, use native website code, and remain available to that AI for later response analysis.

### Compared with Typeform and other hosted form builders

Hosted form builders provide polished form experiences and established form workflows. Jobing's difference is the single AI connection, native page integration, and the ability to return to the same AI conversation to change the form or work with responses.

### Compared with AI page builders such as Lovable, Bolt, or v0

AI page builders are useful for generating interfaces and, in some cases, larger applications. A custom form inside a generated project may still require backend setup, storage, validation, and an inbox. Jobing focuses on finishing the page-and-form workflow behind one connector. It is not trying to replace every full application-building capability.

### Compared with Formspree and form backend services

Form backend services give developers a reliable place to send form submissions. Jobing provides the same basic outcome for custom website forms, then adds an AI connector, a manual form builder, hosted forms, publishing, response organization, and AI-assisted review.

### Compared with a CRM

Jobing can collect and organize leads, but it is not a complete CRM. It does not currently provide sales pipelines, shared account records, tasks, deal forecasting, or automated multistep outreach.

### Compared with an email marketing product

Jobing can collect email addresses with appropriate consent, but it does not currently send newsletters, sequences, or bulk campaigns.

### Compared with a full website platform

Jobing is designed for focused pages and forms. It does not yet provide a complete content management system, large multi-page site hierarchy, ecommerce catalogue, membership system, or arbitrary server application.

---

## 16. What Jobing replaces, combines, or reduces

Depending on the use case, Jobing can reduce the need to separately configure:

- a simple landing-page publishing service;
- a standalone hosted form for every campaign;
- a custom form database;
- a form submission endpoint;
- a basic response inbox;
- a spreadsheet used only to find recent form answers;
- repeated copying of response data into an AI chat;
- a separate workflow for small page edits;
- a developer handoff for every new lead form.

Jobing does not necessarily replace the user's main website, CRM, analytics platform, email system, calendar, payment system, or product database. It can sit alongside them and handle the focused page-and-form workflow.

---

## 17. What Jobing is not

Clear boundaries build trust and prevent the wrong expectations.

Jobing is not:

- an AI model or chat app of its own;
- compatible with an AI app that has no MCP connector support;
- a full custom web-application backend;
- a general-purpose database builder;
- a complete content management system;
- a customer relationship management suite;
- an email marketing or bulk mailing platform today;
- a live scheduling or calendar-availability system;
- a payment processor or ecommerce checkout;
- an event ticketing system;
- a malware scanning service for uploads today;
- an automatic résumé reader through the connector;
- an automatic decision-maker for hiring or other high-impact choices;
- a guarantee that AI-generated content is accurate, lawful, accessible, or free of third-party rights;
- an iframe-only form widget;
- an unlimited free service.

---

## 18. Current limitations and honest caveats

### Email follow-up is not yet available through the connector

The website may describe email follow-up as coming soon. Today, Jobing collects email addresses and helps the user understand responses, but it does not send the follow-up email from the connector.

### Uploaded files are not malware-scanned

Files remain private, but owners must use care when downloading files from unknown people.

### The AI cannot read uploaded files

Jobing returns only file details through the connector. If an AI must compare a piece of information, ask for it as a normal form answer.

### Jobing Pages is for focused browser-based pages

It cannot provide arbitrary private backend logic or a custom database for a full application.

### Booking forms do not confirm availability

They collect requests. They do not reserve a real calendar slot.

### Newsletter forms do not send campaigns

They collect consented signups. A separate sending product is currently required.

### Public pages and notes are public

Anyone with the link can view them. They should not include secrets or confidential data.

### Form response visibility depends on the plan

Responses beyond the monthly visible allowance stay saved but are not available to the owner or AI until unlocked.

### Form creation and publishing have plan limits

A new form or publish action can be blocked when the account reaches its allowance. Existing live forms remain available.

### AI outputs still need human review

The user should inspect published claims, contact information, questions, consent language, links, mobile layout, and high-impact recommendations.

### Legal pages require current product review

Formal privacy and terms content should be updated before broad launch to match the current product and data flows.

---

## 19. Coming soon and possible future directions

This section deliberately distinguishes announced work from ideas.

### Coming soon

#### Email follow-up

The intended direction is to let a user ask the connected AI to prepare or send a relevant follow-up based on a form response, with clear permission and user control.

No promise should be made yet about bulk campaigns, automated sequences, deliverability features, or launch date.

### Possible future directions, not current commitments

- calendar integration and confirmed appointment booking;
- user-approved response notifications;
- safe malware scanning for uploads;
- object storage suited to larger files and higher volume;
- team workspaces and shared ownership;
- comments, assignments, and response status workflows;
- CRM and email integrations;
- automatic but user-controlled follow-up rules;
- page templates and reusable brand systems;
- multi-page websites;
- custom domains for individual pages;
- version history and rollback for pages;
- form logic, branching, and multi-step experiences;
- payment-enabled forms;
- built-in analytics for form conversion and page performance;
- campaign attribution and experiments;
- webhooks and outside automation connections;
- deeper analysis of uploaded files with explicit consent;
- data retention controls and self-service deletion;
- regional storage choices;
- enterprise access and compliance features.

These are product opportunities, not features that customers should be told are already available.

---

## 20. Frequently asked questions

### Do I need to know how to code?

No. A user can describe the page or form to the connected AI and manage it through the dashboard. Jobing also provides native code for people who want direct control.

### Do I need to understand MCP?

No. The user only needs to know that the connector URL is added to a supported AI app and that Jobing will ask them to sign in and approve access.

### Which AI apps work with Jobing?

Jobing works with AI apps that support MCP connectors and can complete Jobing's sign-in and permission flow. The current website provides setup guidance for ChatGPT and Claude. Compatibility depends on the AI app's current connector support.

### Is Jobing a separate AI assistant?

No. It gives the user's existing AI app approved tools.

### Can I use the product without AI?

Yes. Pages and forms can be managed from the Jobing dashboard. The form builder, response inbox, sharing tools, and exports are available there.

### Is a form public as soon as the AI creates it?

No. A newly created form is a private draft. It becomes public only after publishing.

### Can I change a live form without losing responses?

Yes. Changes are prepared as a new draft. The existing form continues working until the new version is published, and existing answers remain saved.

### Can I put the form inside my own design?

Yes. Use the native HTML or ask the connected AI to add it directly to the page. Jobing runs the response service without forcing a branded iframe.

### Can I just share a form link?

Yes. Every published form has a hosted form page.

### Where do responses go?

They arrive in the form's private response inbox under the user's Jobing account.

### Can the AI read my responses?

Only if the connection has the separate response permission and the user asks the AI to retrieve them.

### Does the AI see uploaded files?

It sees basic file details but not the contents. The signed-in owner can download the file.

### What happens after I reach 50 free responses?

Valid submissions continue being accepted and saved. The free plan shows up to its monthly visible allowance. Upgrade to unlock the additional saved responses.

### Will a form stop working when I reach the response limit?

No. The limit affects what the owner can view, not whether the visitor can submit.

### What happens when I reach the form limit?

Jobing blocks a new form or publish action, keeps existing forms working, and directs the user to the pricing page.

### Can Jobing send a confirmation email?

Not through the current connector. Email follow-up is coming soon.

### Can Jobing book a real calendar slot?

Not currently. It can collect a preferred date and time as a request.

### Can Jobing take payments in a form?

Not currently. Do not collect payment card details in a Jobing form.

### Can Jobing build a full SaaS application?

No. It publishes focused web pages and runs custom forms. Complex accounts, databases, private server logic, and full applications require other tools.

### Can I remove an AI app's access?

Yes. Open the connected apps page and disconnect it.

### Does changing a page change its link?

No. Updating a page preserves its public address.

### Can a deleted page be restored?

No. Page deletion is permanent, which is why it requires explicit confirmation.

### Can I export responses?

Yes. The dashboard can export the responses visible on the current plan as CSV.

### Does Jobing automatically decide which applicants or leads are best?

No. It can summarize and compare the available answers. A person should review the evidence and make the decision.

---

## 21. Messaging and marketing reference

This section helps a marketer, collaborator, or AI communicate the product without turning it into a generic “AI connector.”

### Core positioning

**Jobing AI gives the AI app people already use the tools to publish the page, run the form, and help with the answers.**

### Primary category

AI action connector for web pages and forms.

### Primary customer outcome

Turn a conversation into a live page, a working custom form, and an organized response workflow.

### Main unique selling point

Jobing does not merely generate form code or tell a user how to deploy a page. One approved connection lets the AI complete the public page, form backend, response inbox, and later changes, while the user can still manage everything in a normal dashboard.

### Strong supporting points

- One connector for pages, forms, and responses.
- Native website forms, not a forced generic iframe.
- Private drafts before publishing.
- Live forms keep working while edits are reviewed.
- Responses keep saving after the viewing allowance is reached.
- AI reads answers only with separate permission and only when asked.
- Uploaded file contents are not exposed to the AI.
- Every AI action returns a useful public or dashboard link.
- The same public page link can be updated later.

### Human desires the product serves

- **Less delay:** launch the page or form without waiting for several handoffs.
- **Less confusion:** use one conversation and one dashboard.
- **More control:** review drafts and permissions before work becomes public.
- **More professional presentation:** use a form that matches the page.
- **Less lost opportunity:** keep valid responses even when the viewing allowance is reached.
- **Faster understanding:** ask the AI to summarize the answers instead of reading every row manually.

### The problem in the customer's words

- “My AI gave me code, but I still do not have a live page.”
- “The form works, but it looks like a different product.”
- “I do not want to set up a database for one contact form.”
- “I collected 100 answers and now I have to read every one.”
- “I should not need four tools to launch one campaign.”
- “I want to ask for a change without rebuilding everything.”

### Suggested headlines

- Give your AI the tools to finish the work.
- Ask for the page. Get the form and inbox too.
- One AI conversation. A live page and working form.
- Your AI can write the page. Jobing lets it publish it.
- Add any form to any website by asking your AI.
- Stop collecting code. Start collecting responses.
- From one prompt to the page, form, and answers.
- The form can match your website and still work.

### Suggested short descriptions

> Connect Jobing to the AI app you already use. Ask for a page or custom form, publish it, collect responses, and ask AI to help with the answers.

> Jobing turns AI-generated pages and forms into live, working customer experiences. It handles publishing, response collection, and the inbox behind one connection.

### Useful proof that can be shown in a demonstration

- Copy the connector URL and approve access.
- Ask for a page with a form in one prompt.
- Show that the form uses the page's design rather than an iframe.
- Submit a real response.
- Open the response inbox.
- Ask the AI to retrieve and summarize the response.
- Update the form as a draft while the old version remains live.
- Publish the update.
- Change a page headline while preserving the public link.
- Disconnect the AI app from the dashboard.

### Objections and honest answers

**“Why not use Google Forms?”**

Use Google Forms when a familiar standalone survey is enough. Use Jobing when the form should match a custom page, be created and changed from an AI conversation, and remain available for AI-assisted response work.

**“Why not ask my AI to write the code?”**

Writing the visible form is only part of the task. Jobing also provides publishing, response collection, storage, validation, uploads, an inbox, and later management.

**“Why not use a full AI app builder?”**

Use a full builder for a full application. Use Jobing when the goal is a focused page and a reliable custom form without creating a separate backend project.

**“Will the AI see all my customer data?”**

Not automatically. Response access is a separate permission, answers are retrieved only when requested, and uploaded file contents are excluded.

**“What if I stop paying?”**

The exact account behavior should follow the current billing terms. Product messaging should not promise permanent paid access after cancellation. Existing live-form and saved-response behavior should be explained clearly in the billing experience.

### Claims to avoid

Do not say:

- “works with every AI platform”;
- “builds any app”;
- “unlimited everything”;
- “completely spam-proof”;
- “automatically compliant”;
- “military-grade security”;
- “reads uploaded résumés”;
- “sends email campaigns”;
- “books calendar appointments”;
- “replaces your CRM”;
- “makes unbiased hiring decisions”;
- “all responses are visible forever on the free plan.”

Use the accurate language in this document instead.

### Content pillars

1. **From advice to action:** show an AI publishing rather than explaining.
2. **The form should belong to the page:** demonstrate native design freedom.
3. **The workflow after submit:** show summaries, patterns, and organization.
4. **One connection, less tool switching:** compare the number of handoffs.
5. **User control:** show drafts, permissions, confirmation, and disconnect.
6. **Real business outcomes:** leads, applications, registrations, research, and waitlists.

### Audience-specific messages

**Small business owner:** “Launch the page and start receiving enquiries without setting up several tools.”

**Marketer:** “Go from campaign idea to a live page, branded lead form, and response inbox in one conversation.”

**Recruiter:** “Create role-specific application forms and summarize structured answers without exposing uploaded files to the AI.”

**Founder:** “Test an idea with a page and waitlist, then ask the AI what the responses are actually saying.”

**Agency:** “Repeat a reliable page-and-form workflow across campaigns without rebuilding the backend each time.”

**Creator:** “Publish a page that looks like you, collect the right enquiries, and understand what your audience wants.”

---

## 22. Product vocabulary

### Connector

The single Jobing connection added to a compatible AI app.

### MCP

A standard way for an AI app to use outside tools with the user's permission. Customers do not need to learn the technical standard.

### Permission

An ability the user approves, such as creating forms or reading responses.

### Page

A public browser-based page published through Jobing Pages.

### Form draft

A private, editable form that is not yet public.

### Published form

The live form version currently accepting responses.

### Hosted form

A ready-to-share form page provided by Jobing.

### Native form

A form placed directly inside a website's own HTML and design, while Jobing receives the submission.

### Response

The answers submitted by one visitor.

### Inbox

The main view for active form responses.

### Spam

A reversible holding area for unwanted responses.

### Archive

A reversible holding area for completed responses.

### Visible response allowance

The number of saved responses the owner can view during the plan's monthly period.

### Dashboard

The signed-in Jobing area where pages, forms, responses, billing, and connections are managed.

---

## 23. Recommended product success measures

These measures help evaluate whether Jobing is delivering its promise without collecting customer content.

### Connection success

- people who copy the connector URL;
- people who complete authorization;
- time from opening setup to approving access;
- failed connection reasons;
- people who return after connecting.

### First-value success

- people who publish their first page;
- people who create their first form draft;
- people who publish their first form;
- time from signup to first live result;
- people who receive their first valid response.

### Workflow completion

- page created to page viewed;
- form draft created to form published;
- form published to first response;
- response received to response viewed;
- response viewed to searched, summarized, organized, or exported;
- AI-created resource to dashboard opened.

### Quality and reliability

- connector ability success rate;
- form submission success rate;
- slow operations;
- publishing failures;
- payment completed but plan not updated;
- response retrieval failures;
- repeated security-check failures;
- broken generated-page links;
- errors by product area without recording private content.

### Customer learning

- confirmed missing-capability reports;
- most common use-case categories;
- which AI apps users connect;
- where plan limits are reached;
- which form types receive real responses;
- repeated reasons people disconnect.

---

## 24. Questions another AI can answer using this document

This reference can be given to another AI to help with:

- a marketing strategy;
- landing-page copy;
- product positioning;
- customer personas;
- content ideas;
- demo scripts;
- hackathon explanations;
- investor or partner summaries;
- onboarding flows;
- FAQ writing;
- competitive positioning;
- objection handling;
- support answers;
- product roadmap suggestions;
- pricing experiments;
- activation and retention ideas;
- analytics plans;
- risk reviews;
- user research questions;
- launch checklists;
- sales enablement;
- audience-specific prompt libraries.

When using another AI, instruct it to preserve the distinction between current features, coming-soon work, and possible future ideas.

### Reusable instruction for another AI

> Read the attached Jobing AI Product Reference as the factual source of truth. Do not invent capabilities, prices, integrations, customer counts, testimonials, security certifications, or launch dates. Clearly separate features available today from coming-soon work and future ideas. Explain the product for the audience I name, using outcomes and everyday language instead of technical terms. When making recommendations, identify which statements are facts from the document and which are your suggestions.

---

## 25. Official links

- Main website: [https://jobing.site](https://jobing.site)
- Connector guide: [https://jobing.site/connector](https://jobing.site/connector)
- Connector URL: `https://jobing.site/mcp`
- Dashboard: [https://jobing.site/dashboard](https://jobing.site/dashboard)
- Pages dashboard: [https://jobing.site/dashboard/pages](https://jobing.site/dashboard/pages)
- Forms dashboard: [https://jobing.site/dashboard/forms](https://jobing.site/dashboard/forms)
- Jobing Forms website: [https://forms.jobing.site](https://forms.jobing.site)
- Connected AI apps: [https://jobing.site/connector/manage](https://jobing.site/connector/manage)
- Pricing: [https://jobing.site/pricing](https://jobing.site/pricing)
- Billing: [https://jobing.site/billing](https://jobing.site/billing)

---

## Final summary

Jobing AI exists to close the gap between asking an AI for something and receiving a usable result. One approved connector lets the user's existing AI publish focused web pages, create and run custom forms, preserve and organize responses, and help the user understand what people submitted. The strongest product story is not that Jobing is another AI assistant or another generic form builder. It is that Jobing gives the AI a safe, user-controlled way to finish the page-and-form workflow, while keeping every result visible and manageable in a normal dashboard.
