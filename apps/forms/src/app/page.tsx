import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConnectorCopyButton } from "@/components/connector-copy-button";
import { AiAppMarks, FormsProductStory } from "./forms-product-story";
import styles from "./forms-marketing.module.css";

const connectorUrl = "https://jobing.site/mcp";
const formsDashboardUrl = "https://jobing.site/forms/app";

export const metadata: Metadata = {
  title: "Jobing Forms | Custom forms your AI can create and understand",
  description: "Connect Jobing Forms once. Ask your AI to create custom forms, collect responses, and analyze the answers without building a database.",
  alternates: { canonical: "https://forms.jobing.site/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Ask your AI for a form. It handles the rest.",
    description: "Custom design, secure responses, and an inbox your AI can understand.",
    url: "https://forms.jobing.site/",
    siteName: "Jobing Forms",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image", title: "Ask your AI for a form. It handles the rest.", description: "Custom forms and an inbox your AI can work with.", images: ["/opengraph-image"] },
};

function PrimaryAction({ compact = false }: { compact?: boolean }) {
  return <a className={compact ? styles.headerCta : styles.primaryCta} href={formsDashboardUrl}>{compact ? "Forms dashboard" : "Open my forms"}<span aria-hidden="true">→</span></a>;
}

const useCases = [
  { role: "Consultant", prompt: "Create a project enquiry form that asks about budget, timeline, and goals.", result: "Walk into the first call with context.", tone: "lime" },
  { role: "Recruiter", prompt: "Make a job application form with a résumé upload and role-specific questions.", result: "Compare applicants without a spreadsheet maze.", tone: "blue" },
  { role: "Local business", prompt: "Add a quote request form and ask for the property size and preferred date.", result: "Receive requests you can actually price.", tone: "orange" },
  { role: "Product team", prompt: "Build a feedback survey, then summarize the most common complaints.", result: "Turn open answers into a clear product decision.", tone: "purple" },
  { role: "Creator", prompt: "Create a waitlist that asks what people want me to launch next.", result: "Measure demand before doing the work.", tone: "pink" },
  { role: "Event host", prompt: "Make a registration form with session choices and dietary requirements.", result: "Keep every attendee detail in one place.", tone: "yellow" },
];

const comparisonRows = [
  ["Created from your AI conversation", "Yes", "No", "No"],
  ["Looks native to your website", "Yes", "No", "Limited"],
  ["Works without an iframe", "Yes", "No", "No"],
  ["No database or backend setup", "Yes", "Yes", "Yes"],
  ["Your AI can analyze responses", "Yes", "Extra setup", "Extra setup"],
];

export default function FormsMarketingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Jobing Forms home"><Image src="/forms/logo.png" alt="" width={38} height={38} priority /><strong>Jobing Forms</strong></Link>
        <nav className={styles.nav} aria-label="Forms navigation"><a href="#how-it-works">How it works</a><a href="#use-cases">Use cases</a><a href="#compare">Compare</a><a href="https://jobing.site/pricing">Pricing</a></nav>
        <PrimaryAction compact />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBadge}><AiAppMarks /><span>Works inside the AI app you already use</span></div>
        <h1>Ask your AI for a form.<br /><span>It handles the rest.</span></h1>
        <p className={styles.heroText}>Your AI creates a form that matches your page, Jobing Forms saves every response, and the same AI can help you understand what people said.</p>
        <div className={styles.heroConnector} id="connector">
          <div><small>MCP CONNECTOR URL</small><code>{connectorUrl}</code></div><ConnectorCopyButton value={connectorUrl} />
          <div className={styles.handNote} aria-hidden="true"><span>connect once</span><svg viewBox="0 0 76 38"><path d="M3 6c22 0 42 5 58 21m0 0-2-11m2 11-12-2" /></svg></div>
        </div>
        <p className={styles.heroHint}>Paste the URL into your AI app. Sign in once. Then ask for any form.</p>
        <FormsProductStory />
      </section>

      <section className={styles.replaces} id="how-it-works">
        <div className={styles.sectionIntro}><p>One connector instead of five separate tools</p><h2>Stay in the conversation.<br />Skip the setup tabs.</h2><span>Other tools solve one piece. Jobing Forms gives your AI the complete form workflow.</span></div>
        <div className={styles.toolRail} aria-label="Tools Jobing Forms can replace in a form workflow"><div><span>Google Forms</span><i>+</i><span>Typeform</span><i>+</i><span>Airtable</span><i>+</i><span>Zapier</span><i>+</i><span>Custom code</span><b>→</b><strong><Image src="/forms/logo.png" alt="" width={28} height={28} />Jobing Forms</strong></div></div>
        <div className={styles.workflowStrip}>
          <article><span>1</span><div><b>Ask</b><p>Describe what you need in plain words.</p></div></article>
          <article><span>2</span><div><b>Publish</b><p>Your AI gets native HTML and a secure endpoint.</p></div></article>
          <article><span>3</span><div><b>Collect</b><p>Responses arrive in one private inbox.</p></div></article>
          <article><span>4</span><div><b>Understand</b><p>Ask questions about the answers.</p></div></article>
        </div>
      </section>

      <section className={styles.useCases} id="use-cases">
        <div className={styles.sectionIntro}><p>Start with the work in front of you</p><h2>Six people. Six forms.<br />No form builder lesson.</h2><span>Use these prompts as they are, or describe your own workflow.</span></div>
        <div className={styles.promptDeck}>{useCases.map((item) => <article key={item.role} data-tone={item.tone}><header><span>{item.role}</span><b>Copy prompt</b></header><blockquote>“{item.prompt}”</blockquote><p><i>✓</i>{item.result}</p></article>)}</div>
      </section>

      <section className={styles.analysis}>
        <div className={styles.analysisCopy}>
          <p className={styles.kicker}>The inbox can answer back</p>
          <h2>Do more than count submissions.</h2>
          <p>Ask the AI app you already use to search responses, find patterns, qualify leads, summarize feedback, or organize spam. It reads only when you ask and only with the permission you approved.</p>
          <div className={styles.analysisPrompts}><span>“What do these leads care about most?”</span><span>“Which applicants match the role?”</span><span>“Summarize every complaint from this week.”</span><span>“Move obvious spam out of my inbox.”</span></div>
        </div>
        <div className={styles.chatDemo}>
          <div className={styles.chatTop}><AiAppMarks compact /><div><b>Your AI app</b><span>Jobing Forms connected</span></div><i /></div>
          <div className={styles.chatBody}><div className={styles.userMessage}><span>You</span><p>Read my project enquiries. What should I change on the website?</p></div><div className={styles.aiMessage}><Image src="/forms/logo.png" alt="" width={28} height={28} /><div><b>Jobing Forms read 24 responses</b><p>Eight people asked whether you work with smaller budgets. Add a starting price near the project form. Five leads also asked about delivery time.</p><div><strong>Suggested page changes</strong><span>1. Add “Projects from ₹75,000”</span><span>2. Add a typical 4–6 week timeline</span><span>3. Keep the budget field required</span></div></div></div></div>
          <div className={styles.chatComposer}>Ask a follow-up…<span>↑</span></div>
          <div className={styles.handResult} aria-hidden="true"><svg viewBox="0 0 70 38"><path d="M67 4C45 6 27 13 10 29m0 0 3-11M10 29l12-1" /></svg><span>answers become decisions</span></div>
        </div>
      </section>

      <section className={styles.nativeSection}>
        <div><p className={styles.kicker}>Your site should still look like your site</p><h2>A custom form.<br />Not somebody else&apos;s template.</h2><p>Jobing Forms returns complete native HTML. Your AI can change every field, label, color, font, spacing choice, and button while Jobing keeps the response endpoint working.</p><div className={styles.capabilityTags}><span>12 field types</span><span>2 MB uploads</span><span>Custom redirects</span><span>Origin controls</span><span>CSV export</span></div></div>
        <div className={styles.designCanvas}>
          <div className={styles.designToolbar}><span>Same endpoint</span><i /><b>Any design</b></div>
          <div className={styles.formStyles}><div className={styles.styleCardA}><small>Studio enquiry</small><b>Start a project</b><label>Your email</label><i /><label>Tell us about it</label><i className={styles.tallField} /><button>Send enquiry</button></div><div className={styles.styleCardB}><small>DINNER / 07:30 PM</small><b>Book a table</b><label>Guests</label><i /><label>Date</label><i /><button>Reserve</button></div></div>
          <footer>Both forms submit to the same reliable Jobing Forms API</footer>
        </div>
      </section>

      <section className={styles.compare} id="compare">
        <div className={styles.sectionIntro}><p>Choose the tool that fits the job</p><h2>Google Forms collects answers.<br />Jobing Forms completes the workflow.</h2><span>Use a standard form builder for a standalone survey. Use Jobing Forms when the form must belong to your page and stay usable from your AI conversation.</span></div>
        <div className={styles.comparisonTable} role="table" aria-label="Jobing Forms comparison"><div className={styles.comparisonHead} role="row"><span>WHAT MATTERS</span><b>JOBING FORMS</b><span>GOOGLE FORMS</span><span>TYPEFORM</span></div>{comparisonRows.map(([feature, jobing, google, typeform]) => <div className={styles.comparisonRow} role="row" key={feature}><strong>{feature}</strong><b>{jobing}</b><span>{google}</span><span>{typeform}</span></div>)}</div>
      </section>

      <section className={styles.trustSection}>
        <div><p className={styles.kicker}>The unexciting parts matter</p><h2>Quietly ready for real responses.</h2></div>
        <div className={styles.trustList}><article><b>Drafts stay private</b><p>No public URL until you publish.</p></article><article><b>Edits keep responses</b><p>Update the form without losing answers.</p></article><article><b>Spam stays separate</b><p>Review, archive, or restore submissions.</p></article><article><b>Uploads stay private</b><p>Your AI sees metadata, not file contents.</p></article></div>
      </section>

      <section className={styles.faq}><div><p className={styles.kicker}>Questions before the first form</p><h2>What people want to know.</h2></div><div className={styles.faqList}><details><summary>Do visitors leave my website?<span>+</span></summary><p>No. The native form stays inside your page and can show a confirmation there.</p></details><details><summary>Can I build forms without the connector?<span>+</span></summary><p>Yes. The Forms dashboard includes manual creation, editing, publishing, responses, and CSV export.</p></details><details><summary>Can my AI read every response automatically?<span>+</span></summary><p>No. Response access requires a separate permission and your AI reads answers only when you ask.</p></details><details><summary>What happens at my plan limit?<span>+</span></summary><p>Your live forms keep working. Your AI receives the pricing page link when the limit blocks a new publish.</p></details></div></section>

      <section className={styles.finalCta}><p>One URL. One connection.</p><h2>Ask for the form.<br /><span>Keep the answer useful.</span></h2><div className={styles.finalActions}><div><small>MCP CONNECTOR URL</small><code>{connectorUrl}</code></div><ConnectorCopyButton value={connectorUrl} /></div><PrimaryAction /></section>

      <footer className={styles.footer}><Link className={styles.footerBrand} href="/"><Image src="/forms/logo.png" alt="" width={28} height={28} /><strong>Jobing Forms</strong></Link><p>Make the form. Understand the answer.</p><nav><a href="https://jobing.site">Jobing AI</a><a href={formsDashboardUrl}>Dashboard</a><a href="https://jobing.site/pricing">Pricing</a></nav></footer>
    </main>
  );
}
