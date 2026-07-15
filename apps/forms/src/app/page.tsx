import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConnectorCopyButton } from "@/components/connector-copy-button";
import styles from "./forms-marketing.module.css";

const connectorUrl = "https://jobing.site/mcp";

export const metadata: Metadata = {
  title: "Jobing Forms | Forms your AI can build and understand",
  description:
    "Ask your AI to create a custom form, add it to any web page, collect responses, and analyze the answers through one Jobing AI connector.",
  alternates: { canonical: "https://forms.jobing.site/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your AI builds the form. Then understands the answers.",
    description: "Custom forms, native HTML, one response inbox, and AI analysis through one connector.",
    url: "https://forms.jobing.site/",
    siteName: "Jobing Forms",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your AI builds the form. Then understands the answers.",
    description: "Custom forms and an inbox your AI can work with.",
    images: ["/opengraph-image"],
  },
};

function PrimaryAction({ compact = false }: { compact?: boolean }) {
  const className = compact ? styles.headerCta : styles.primaryCta;

  return (
    <Link className={className} href="/app" prefetch={false}>
      {compact ? "Forms dashboard" : "Create or manage my forms"} <span aria-hidden="true">→</span>
    </Link>
  );
}

const useCases = [
  {
    person: "Consultants & agencies",
    prompt: "Create a project enquiry form that asks about budget, timeline, and goals.",
    result: "Qualify leads before the first call",
    marker: "01",
  },
  {
    person: "Recruiters & small teams",
    prompt: "Make a job application form with a résumé upload and role-specific questions.",
    result: "Review applicants in one inbox",
    marker: "02",
  },
  {
    person: "Local businesses",
    prompt: "Add a quote request form for my cleaning service and ask for the property size.",
    result: "Turn visits into useful requests",
    marker: "03",
  },
  {
    person: "Creators & communities",
    prompt: "Build a waitlist that matches this page and asks what people want me to launch.",
    result: "Collect demand and learn why",
    marker: "04",
  },
  {
    person: "Product teams",
    prompt: "Create a feedback survey with ratings, open answers, and a consent checkbox.",
    result: "Find patterns in customer feedback",
    marker: "05",
  },
  {
    person: "Events & education",
    prompt: "Make a registration form with session choices and dietary requirements.",
    result: "Keep every registration organized",
    marker: "06",
  },
];

const analysisPrompts = [
  "Summarize the last 30 responses in five bullets.",
  "Which enquiries look ready to buy, and why?",
  "What question or objection appears most often?",
  "Group these applicants by relevant experience.",
  "Find obvious spam and move it out of my inbox.",
  "Draft a personal reply for each qualified lead.",
];

const comparisonRows = [
  ["Made inside your AI conversation", "Yes", "No", "Partly"],
  ["Can look exactly like your website", "Yes", "No", "Limited"],
  ["Works as native HTML, not an iframe", "Yes", "No", "No"],
  ["No custom database to build", "Yes", "Yes", "Yes"],
  ["Your AI can read the responses", "Yes", "Extra setup", "Extra setup"],
  ["One connector creates and manages it", "Yes", "No", "No"],
];

export default function FormsMarketingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Jobing AI Forms home">
          <Image src="/forms/logo.png" alt="" width={38} height={38} priority />
          <span><strong>Jobing AI</strong><small>Forms</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Forms navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#use-cases">Use cases</a>
          <a href="#compare">Compare</a>
          <a href="https://jobing.site/pricing">Pricing</a>
        </nav>
        <PrimaryAction compact />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Forms made and managed through your AI</p>
          <h1>Your AI builds the form.<br /><em>Then understands the answers.</em></h1>
          <p className={styles.heroText}>
            Ask for a contact form, application, survey, waitlist, or quote request. Jobing AI gives your page a form that matches its design, saves every response, and lets your AI help you make sense of them.
          </p>
          <div className={styles.heroActions}>
            <PrimaryAction />
            <a className={styles.textLink} href="#connector">Already use an AI app? Connect it in 2 minutes ↓</a>
          </div>
          <ul className={styles.proofLine} aria-label="Product highlights">
            <li>Native HTML</li><li>No iframe</li><li>No database setup</li>
          </ul>
        </div>

        <div className={styles.productDemo} aria-label="A form response becoming an AI summary">
          <div className={styles.demoBar}>
            <span><i /> LIVE FORM</span>
            <span>RESPONSE → INSIGHT</span>
          </div>
          <div className={styles.demoCanvas}>
            <div className={styles.demoForm}>
              <div className={styles.demoLabel}>PROJECT ENQUIRY</div>
              <h2>Tell us what you need.</h2>
              <label>Name<input readOnly value="Maya Patel" tabIndex={-1} /></label>
              <label>Budget<select defaultValue="₹1L – ₹3L" tabIndex={-1} aria-label="Budget"><option>₹1L – ₹3L</option></select></label>
              <label>Project<textarea readOnly value="We need a launch site in four weeks." tabIndex={-1} /></label>
              <button tabIndex={-1}>Send project details</button>
            </div>
            <div className={styles.demoFlow} aria-hidden="true"><span>1</span><i /><span>2</span><i /><span>3</span></div>
            <div className={styles.demoInbox}>
              <div className={styles.inboxTop}><span>AI RESPONSE BRIEF</span><b>12 answers read</b></div>
              <p className={styles.aiQuestion}>“Which leads should I contact first?”</p>
              <div className={styles.aiAnswer}>
                <strong>Start with Maya and Daniel.</strong>
                <p>Both have a clear timeline, stated budget, and an urgent launch date.</p>
              </div>
              <div className={styles.leadRow}><b>01</b><span>Maya Patel<small>Strong fit · 4 week timeline</small></span><em>READY</em></div>
              <div className={styles.leadRow}><b>02</b><span>Daniel Cho<small>Clear scope · budget confirmed</small></span><em>READY</em></div>
              <div className={styles.leadRow}><b>03</b><span>8 more responses<small>Need more information</small></span><em>REVIEW</em></div>
            </div>
          </div>
          <div className={styles.demoFooter}><span>FORM CREATED</span><span>ANSWERS SAVED</span><span>AI BRIEF READY</span></div>
        </div>
      </section>

      <section className={styles.connector} id="connector">
        <div>
          <p className={styles.eyebrow}>One connector for the whole workflow</p>
          <h2>Connect once. Ask your AI for forms from then on.</h2>
          <p>Paste this MCP URL into your AI app, approve access once, then create and work with forms without opening another builder.</p>
        </div>
        <div className={styles.connectorBox}>
          <span>MCP CONNECTOR URL</span>
          <code>{connectorUrl}</code>
          <ConnectorCopyButton value={connectorUrl} />
        </div>
      </section>

      <section className={styles.process} id="how-it-works">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>The full loop, not another form builder</p>
          <h2>From one sentence to a useful answer.</h2>
        </div>
        <ol className={styles.processTrack}>
          <li><span>01</span><strong>Ask</strong><p>Describe the form and the page it belongs on.</p></li>
          <li><span>02</span><strong>Publish</strong><p>Your AI gets native HTML and a secure Jobing endpoint.</p></li>
          <li><span>03</span><strong>Collect</strong><p>Every valid response arrives in your Forms inbox.</p></li>
          <li><span>04</span><strong>Understand</strong><p>Ask your AI to search, summarize, compare, or organize the answers.</p></li>
        </ol>
        <div className={styles.promptRibbon}>
          <span>TRY THIS</span>
          <p>“Create a quote form for my photography site, publish it, and give me the complete HTML.”</p>
        </div>
      </section>

      <section className={styles.useCases} id="use-cases">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Useful on the work you already do</p>
          <h2>Ask for the outcome.<br />Skip the setup.</h2>
          <p>Each form can have its own fields, validation, confirmation message, allowed websites, file uploads, and visual style.</p>
        </div>
        <div className={styles.useCaseLedger}>
          {useCases.map((item) => (
            <article key={item.marker} className={styles.useCaseRow}>
              <b>{item.marker}</b>
              <div><span>{item.person}</span><q>{item.prompt}</q></div>
              <p>{item.result}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.analysis}>
        <div className={styles.analysisPanel}>
          <div className={styles.analysisHeader}><span>YOUR FORMS INBOX</span><b><i /> CONNECTED TO YOUR AI</b></div>
          <div className={styles.analysisGrid}>
            <div className={styles.responseStack}>
              <div><span>NEW</span><b>Website enquiry</b><p>“Need a proposal before Friday...”</p></div>
              <div><span>NEW</span><b>Website enquiry</b><p>“Our current conversion rate...”</p></div>
              <div><span>NEW</span><b>Website enquiry</b><p>“Budget is approved for...”</p></div>
              <div><span>NEW</span><b>Website enquiry</b><p>“Just exploring options...”</p></div>
            </div>
            <div className={styles.analysisChat}>
              <div className={styles.chatUser}>Summarize these enquiries and tell me what to do next.</div>
              <div className={styles.chatAi}><b>3 actions</b><p>Reply to two high-intent leads today. One lead needs pricing details. Archive one low-context message after a follow-up.</p><small>Based only on the responses you asked me to read.</small></div>
            </div>
          </div>
        </div>
        <div className={styles.analysisCopy}>
          <p className={styles.eyebrow}>Your inbox can answer questions</p>
          <h2>Do more than count submissions.</h2>
          <p>With your approval, the connector can search submitted answers and use them in the current conversation. Uploaded file contents stay private and are not returned to the AI.</p>
          <ul>{analysisPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
          <p className={styles.boundaryNote}>Jobing can read answers, search them, and move responses between inbox, spam, and archive. It does not send emails or make decisions without you.</p>
        </div>
      </section>

      <section className={styles.compare} id="compare">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Why not another form tool?</p>
          <h2>Google Forms collects answers.<br />Jobing lets your AI finish the job.</h2>
          <p>Use the simple builders when a separate, standard form is enough. Use Jobing when the form must belong inside your page and remain usable from your AI conversation.</p>
        </div>
        <div className={styles.comparisonTable} role="table" aria-label="Jobing Forms comparison">
          <div className={styles.comparisonHead} role="row"><span role="columnheader">WHAT MATTERS</span><b role="columnheader">JOBING</b><span role="columnheader">GOOGLE FORMS</span><span role="columnheader">TYPEFORM</span></div>
          {comparisonRows.map(([feature, jobing, google, typeform]) => (
            <div className={styles.comparisonRow} role="row" key={feature}>
              <strong role="cell">{feature}</strong>
              <b role="cell">{jobing}</b>
              <span role="cell">{google}</span>
              <span role="cell">{typeform}</span>
            </div>
          ))}
        </div>
        <p className={styles.comparisonFootnote}>Comparison reflects the standard product experience without custom integrations or additional development.</p>
      </section>

      <section className={styles.nativeSection}>
        <div>
          <p className={styles.eyebrow}>A form that belongs to your page</p>
          <h2>Your design outside.<br />Jobing reliability underneath.</h2>
          <p>Your AI receives complete form HTML, so it can change every label, field, color, spacing choice, and button. Jobing handles the response endpoint, validation, duplicate protection, rate limits, and secure storage.</p>
          <div className={styles.capabilityTags}><span>12 field types</span><span>2 MB file uploads</span><span>Custom redirects</span><span>Origin controls</span><span>CSV export</span><span>Spam review</span></div>
        </div>
        <div className={styles.codeCard}>
          <div><span>contact.html</span><b>NATIVE HTML</b></div>
          <pre><code>{`<form method="POST"
  action="https://forms.jobing.site/forms/f/frm_...">

  <label>Your work email</label>
  <input name="email" type="email" required>

  <label>How can we help?</label>
  <textarea name="message" required></textarea>

  <button>Send my request</button>
</form>`}</code></pre>
          <footer><i /> Responses arrive in your private Forms inbox</footer>
        </div>
      </section>

      <section className={styles.reassurance}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Designed for real submissions</p>
          <h2>The quiet details are already handled.</h2>
        </div>
        <div className={styles.reassuranceGrid}>
          <article><span>01</span><h3>Drafts stay private</h3><p>A new form has no public URL until you choose to publish it.</p></article>
          <article><span>02</span><h3>Edits keep responses</h3><p>Change a draft without losing submissions or breaking the current live version.</p></article>
          <article><span>03</span><h3>Sites can be restricted</h3><p>Allow only the website origins you trust to submit through the endpoint.</p></article>
          <article><span>04</span><h3>Retries are safe</h3><p>Duplicate protection prevents an accidental retry from creating another response.</p></article>
          <article><span>05</span><h3>Spam has its own place</h3><p>Review blocked attempts and move responses between inbox, spam, and archive.</p></article>
          <article><span>06</span><h3>Uploads stay private</h3><p>Files are available to you in the dashboard, while the AI receives metadata only.</p></article>
        </div>
      </section>

      <section className={styles.faq}>
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>Before you publish</p><h2>Questions people ask first.</h2></div>
        <div className={styles.faqList}>
          <details><summary>Do visitors have to leave my website?<span>+</span></summary><p>No. Put the native HTML directly in your page. A valid submission can show your confirmation message or use your HTTPS redirect.</p></details>
          <details><summary>Can I create forms without using the connector?<span>+</span></summary><p>Yes. Open the Forms dashboard to create, edit, publish, duplicate, and review forms manually.</p></details>
          <details><summary>Can my AI see every response automatically?<span>+</span></summary><p>No. Response access requires its own approved permission, and the AI reads a form only when you ask it to. Public visitors cannot access your inbox.</p></details>
          <details><summary>What kinds of fields can I use?<span>+</span></summary><p>Text, email, phone, number, URL, date, long answers, dropdowns, radio choices, checkboxes, consent, and private file uploads are supported.</p></details>
          <details><summary>What happens when I reach my plan limit?<span>+</span></summary><p>Your existing live forms keep their current status. Jobing gives your AI the pricing page URL when a plan limit blocks a new publish.</p></details>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>One prompt can start it</p>
        <h2>Ask for the form.<br /><em>Keep the answers useful.</em></h2>
        <PrimaryAction />
        <p>5 published forms and 50 responses included with the current entry plan. See full terms on the <a href="https://jobing.site/pricing">pricing page</a>.</p>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="/"><Image src="/forms/logo.png" alt="" width={30} height={30} /><strong>Jobing AI Forms</strong></Link>
        <p>Make the form. Understand the answer.</p>
        <nav aria-label="Footer navigation"><a href="https://jobing.site">Jobing AI</a><Link href="/app" prefetch={false}>Forms dashboard</Link><a href="https://jobing.site/pricing">Pricing</a></nav>
      </footer>
    </main>
  );
}
