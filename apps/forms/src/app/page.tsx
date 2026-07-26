import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConnectorCopyButton } from "@/components/connector-copy-button";
import { AiAppMarks, FormsProductStory } from "./forms-product-story";
import { FormsPositioning } from "./forms-positioning";
import styles from "./forms-marketing.module.css";

const connectorUrl = "https://jobing.site/mcp";
const formsDashboardUrl = "https://jobing.site/dashboard/forms";
const docsUrl = "https://docs.jobing.site/forms/overview";

export const metadata: Metadata = {
  title: "Jobing Forms | Add any form to any website by asking your AI",
  description: "Ask your AI for a form that matches your website. Jobing handles responses, spam, uploads, and the inbox without a separate backend project.",
  alternates: { canonical: "https://forms.jobing.site/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Add any form to any website by asking your AI.",
    description: "Get the design, working response collection, and an inbox without an iframe or a separate backend project.",
    url: "https://forms.jobing.site/",
    siteName: "Jobing Forms",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image", title: "Add any form to any website by asking your AI.", description: "Custom website forms and an inbox your AI can work with.", images: ["/opengraph-image"] },
};

function PrimaryAction({ compact = false }: { compact?: boolean }) {
  return <a className={compact ? styles.headerCta : styles.primaryCta} href={formsDashboardUrl}>{compact ? "Forms dashboard" : "Open my forms"}<span aria-hidden="true">→</span></a>;
}

const useCases = [
  { role: "Consultant", prompt: "Create a project enquiry form that asks about budget, timeline, and goals.", result: "Start the first call with context.", tone: "lime" },
  { role: "Recruiter", prompt: "Make a job application form with a résumé upload and role-specific questions.", result: "Ask AI which applicants match.", tone: "blue" },
  { role: "Local business", prompt: "Add a quote request form and ask for property size and preferred date.", result: "Receive requests you can price.", tone: "orange" },
  { role: "Product team", prompt: "Build a feedback survey, then summarize the most common complaints.", result: "Turn feedback into a decision.", tone: "purple" },
  { role: "Creator", prompt: "Create a waitlist that asks what people want me to launch next.", result: "Measure demand before building.", tone: "pink" },
];

const comparisonRows = [
  ["Create it from an AI conversation", "Yes", "No", "No"],
  ["Match every part of your website", "Yes", "No", "Limited"],
  ["Use native HTML instead of an iframe", "Yes", "No", "No"],
  ["Collect responses without a database", "Yes", "Yes", "Yes"],
  ["Ask your AI to analyze responses", "Yes", "Manual setup", "Manual setup"],
];

export default function FormsMarketingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Jobing Forms home"><Image src="/forms/logo.png" alt="" width={38} height={38} priority /><strong>Jobing Forms</strong></Link>
        <nav className={styles.nav} aria-label="Forms navigation"><a href="#create">Create</a><a href="#after-submit">After submit</a><a href="#design">Custom design</a><a href="#compare">Compare</a><a href={docsUrl}>Docs</a><a href="https://jobing.site/pricing">Pricing</a></nav>
        <PrimaryAction compact />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBadge}><AiAppMarks /><span>One connector for the AI app you already use</span></div>
        <h1>Add any form to any website<br />by asking your AI.</h1>
        <p className={styles.heroText}>Tell the AI app you already use what the form should ask and how it should look. Jobing adds it to your website, keeps every response, and lets your AI help with the answers.</p>
        <div className={styles.heroConnector} id="connector">
          <div><small>MCP CONNECTOR URL</small><code>{connectorUrl}</code></div><ConnectorCopyButton value={connectorUrl} />
          <div className={styles.handNote} aria-hidden="true"><span>connect once</span><svg viewBox="0 0 76 38"><path d="M3 6c22 0 42 5 58 21m0 0-2-11m2 11-12-2" /></svg></div>
        </div>
        <p className={styles.heroHint}>Copy this URL into your AI app. Sign in once. Then create forms without leaving the conversation.</p>
        <FormsProductStory />
        <div className={styles.factRail} aria-label="Jobing Forms product capabilities">
          <span><b>Native HTML</b><small>No iframe</small></span>
          <span><b>12 field types</b><small>Including file uploads</small></span>
          <span><b>Private inbox</b><small>Every response saved</small></span>
          <span><b>AI-readable</b><small>Only when you ask</small></span>
        </div>
      </section>

      <FormsPositioning />

      <section className={styles.createSection} id="create">
        <div className={styles.createCopy}>
          <p className={styles.kicker}>FROM A SENTENCE TO A PUBLISHED FORM</p>
          <h2>Build the exact form your page needs.</h2>
          <p>Normal form builders make you learn their editor. Jobing Forms lets you describe the outcome in plain words. Your AI handles the fields, design, endpoint, and page code.</p>
          <div className={styles.promiseList}>
            <article><span>01</span><div><b>Ask normally</b><p>Say who the form is for and what you need to learn.</p></div></article>
            <article><span>02</span><div><b>Review the result</b><p>Your AI shows the fields and keeps the form private as a draft.</p></div></article>
            <article><span>03</span><div><b>Publish when ready</b><p>Get a hosted form or native HTML for your own page.</p></div></article>
          </div>
        </div>
        <div className={styles.buildCanvas}>
          <div className={styles.buildTop}><AiAppMarks compact /><b>Your AI app</b><span><i /> Jobing Forms connected</span></div>
          <div className={styles.buildPrompt}>Create a contact form for my consultancy page. Ask about the project, budget, and ideal launch date. Use the page&apos;s black and lime design.</div>
          <div className={styles.buildResult}>
            <div className={styles.buildSteps}><span><i />Form created</span><span><i />Endpoint secured</span><span><i />HTML added</span><strong>Published</strong></div>
            <div className={styles.miniForm}><small>START A PROJECT</small><h3>Tell us what you&apos;re building.</h3><label>WORK EMAIL<i /></label><div><label>BUDGET<i /></label><label>LAUNCH DATE<i /></label></div><label>PROJECT DETAILS<i className={styles.textarea} /></label><button>Send project details</button></div>
          </div>
          <div className={styles.buildNote} aria-hidden="true">prompt in, working form out</div>
        </div>
      </section>

      <section className={styles.afterSection} id="after-submit">
        <div className={styles.afterIntro}><p>THE PART MOST FORM BUILDERS LEAVE TO YOU</p><h2>When the form ends,<br /><em>the next decision begins.</em></h2><span>A response is not the finish line. Ask the same AI conversation to find the people, patterns, and next actions hidden inside your inbox.</span></div>

        <div className={styles.outcomeFlow}>
          <div className={styles.responseStack}>
            <article><span>MP</span><div><b>Maya Patel</b><small>Project enquiry · ₹1L–₹3L</small></div><time>now</time></article>
            <article><span>DC</span><div><b>Daniel Cho</b><small>Project enquiry · ₹3L–₹5L</small></div><time>4m</time></article>
            <article><span>AS</span><div><b>Arun Studio</b><small>Project enquiry · no budget yet</small></div><time>12m</time></article>
          </div>
          <div className={styles.flowConnector}><i /><i /><i /><b>AI reads<br />on request</b></div>
          <div className={styles.decisionCard}><header><Image src="/forms/logo.png" alt="" width={28} height={28} /><div><b>Lead brief</b><small>12 responses analyzed</small></div></header><h3>Contact Maya and Daniel first.</h3><p>Maya has the clearest deadline. Daniel has the largest confirmed budget.</p><ul><li>Reply to Maya today</li><li>Send Daniel one scope question</li><li>Ask Arun for a budget range</li></ul></div>
        </div>

        <div className={styles.outcomeGrid}>
          <article><span>SALES</span><h3>Know which lead to call first.</h3><p>Ask AI to compare fit, urgency, budget, and intent across every enquiry.</p><div><i>“Which three leads should I contact today?”</i></div></article>
          <article><span>HIRING</span><h3>Turn applications into a shortlist.</h3><p>Find candidates who match the role without manually reading every answer.</p><div><i>“Who has the skills and project proof?”</i></div></article>
          <article><span>RESEARCH</span><h3>Find the pattern behind open answers.</h3><p>Group recurring complaints, requests, objections, or ideas into a useful summary.</p><div><i>“What should we improve first?”</i></div></article>
        </div>

        <div className={styles.promptChapter} id="use-cases"><p>START WITH A PROMPT THAT SOUNDS LIKE YOU</p><h2>One connector. Different work.</h2><div className={styles.promptDeck}>{useCases.map((item) => <article key={item.role} data-tone={item.tone}><header><span>{item.role}</span><b>EXAMPLE PROMPT</b></header><blockquote>“{item.prompt}”</blockquote><p><i>✓</i>{item.result}</p></article>)}</div></div>
      </section>

      <section className={styles.nativeSection} id="design">
        <div><p className={styles.kicker}>YOUR PAGE SHOULD STILL LOOK LIKE YOUR PAGE</p><h2>One reliable backend.<br />Any form design.</h2><p>Jobing Forms gives your AI complete native HTML, not a generic iframe. Change every label, field, color, font, spacing choice, and button while the response endpoint keeps working.</p><div className={styles.capabilityTags}><span>Native HTML</span><span>Hosted option</span><span>Custom redirects</span><span>Origin controls</span><span>CSV export</span></div></div>
        <div className={styles.designCanvas}>
          <div className={styles.designToolbar}><span>Same Jobing endpoint</span><i /><b>Two completely different designs</b></div>
          <div className={styles.formStyles}><div className={styles.styleCardA}><small>STUDIO ENQUIRY</small><b>Start a project</b><label>Your email</label><i /><label>Tell us about it</label><i className={styles.tallField} /><button>Send enquiry</button></div><div className={styles.styleCardB}><small>DINNER / 07:30 PM</small><b>Book a table</b><label>Guests</label><i /><label>Date</label><i /><button>Reserve</button></div></div>
          <footer>Different designs. The same secure Jobing Forms API.</footer>
        </div>
      </section>

      <section className={styles.compare} id="compare">
        <div className={styles.sectionIntro}><p>USE THE RIGHT TOOL FOR THE WORK</p><h2>Google Forms collects answers.<br />Jobing Forms completes the workflow.</h2><span>Choose a standard form builder for a standalone survey. Choose Jobing Forms when the form must match your page and stay usable from your AI conversation.</span></div>
        <div className={styles.comparisonTable} role="table" aria-label="Jobing Forms comparison"><div className={styles.comparisonHead} role="row"><span>WHAT MATTERS</span><b>JOBING FORMS</b><span>GOOGLE FORMS</span><span>TYPEFORM</span></div>{comparisonRows.map(([feature, jobing, google, typeform]) => <div className={styles.comparisonRow} role="row" key={feature}><strong>{feature}</strong><b>{jobing}</b><span>{google}</span><span>{typeform}</span></div>)}</div>
      </section>

      <section className={styles.trustSection}>
        <div><p className={styles.kicker}>BUILT FOR REAL RESPONSES</p><h2>The quiet parts are already handled.</h2></div>
        <div className={styles.trustList}><article><b>Drafts stay private</b><p>No public URL until you publish.</p></article><article><b>Edits keep responses</b><p>Change the form without losing answers.</p></article><article><b>Spam stays separate</b><p>Review, archive, or restore submissions.</p></article><article><b>Uploads stay private</b><p>Your AI sees metadata, not file contents.</p></article></div>
      </section>

      <section className={styles.faq}><div><p className={styles.kicker}>BEFORE YOUR FIRST FORM</p><h2>What people want to know.</h2></div><div className={styles.faqList}><details><summary>Do visitors leave my website?<span>+</span></summary><p>No. Native forms remain inside your page and can show a confirmation there.</p></details><details><summary>Can I create forms without using AI?<span>+</span></summary><p>Yes. The Forms dashboard includes manual creation, editing, publishing, responses, and CSV export.</p></details><details><summary>Can my AI read every response automatically?<span>+</span></summary><p>No. Response access requires a separate permission and your AI reads answers only when you ask.</p></details><details><summary>What happens at my plan limit?<span>+</span></summary><p>Your live forms keep working. Your AI receives the pricing page link if the limit blocks a new publish.</p></details></div></section>

      <section className={styles.finalCta}><p>ONE URL. ONE CONNECTION.</p><h2>Ask for the form.<br /><span>Keep the answer useful.</span></h2><div className={styles.finalActions}><div><small>MCP CONNECTOR URL</small><code>{connectorUrl}</code></div><ConnectorCopyButton value={connectorUrl} /></div><PrimaryAction /></section>

      <footer className={styles.footer}><Link className={styles.footerBrand} href="/"><Image src="/forms/logo.png" alt="" width={28} height={28} /><strong>Jobing Forms</strong></Link><p>Make the form. Understand the answer.</p><nav><a href="https://jobing.site">Jobing AI</a><a href="https://jobing.site/form-backend">Form backend</a><a href={formsDashboardUrl}>Dashboard</a><a href={docsUrl}>Docs</a><a href="https://jobing.site/pricing">Pricing</a></nav></footer>
    </main>
  );
}
