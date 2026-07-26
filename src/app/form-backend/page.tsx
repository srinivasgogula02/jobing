import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  Database,
  FileUp,
  Inbox,
  LockKeyhole,
  MessageSquareText,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  SiAirtable,
  SiFramer,
  SiGooglesheets,
  SiHtml5,
  SiJavascript,
  SiMeta,
  SiNextdotjs,
  SiReact,
  SiVuedotjs,
  SiWebflow,
  SiWordpress,
} from "react-icons/si";
import { FaSlack } from "react-icons/fa6";
import { DOCS_URL } from "@/lib/app-navigation";
import styles from "./form-backend.module.css";

const dashboardUrl = "/dashboard/forms";
const formDocsUrl = `${DOCS_URL}/forms/overview`;

export const metadata: Metadata = {
  title: "Form Backend for Custom HTML Forms | Jobing Forms",
  description:
    "Connect any custom HTML form to a secure response inbox without building a database. Create, publish, integrate, and analyze forms with Jobing AI.",
  alternates: { canonical: "/form-backend" },
  openGraph: {
    title: "Your website form does not need its own backend",
    description:
      "Keep your exact form design. Jobing handles submissions, files, spam, integrations, and the response inbox.",
    url: "https://jobing.site/form-backend",
    siteName: "Jobing Forms",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your website form does not need its own backend",
    description:
      "One secure endpoint for custom forms, response collection, integrations, and AI-assisted analysis.",
    images: ["/opengraph-image"],
  },
};

const technologies = [
  { name: "HTML", Icon: SiHtml5 },
  { name: "JavaScript", Icon: SiJavascript },
  { name: "React", Icon: SiReact },
  { name: "Next.js", Icon: SiNextdotjs },
  { name: "Vue", Icon: SiVuedotjs },
  { name: "Webflow", Icon: SiWebflow },
  { name: "Framer", Icon: SiFramer },
  { name: "WordPress", Icon: SiWordpress },
] as const;

const features = [
  {
    Icon: Inbox,
    label: "Response inbox",
    title: "Every answer arrives organized.",
    copy: "Search responses, switch between cards and a table, archive completed work, and export the answers visible on your plan.",
    fact: "Inbox · spam · archive · CSV",
  },
  {
    Icon: ShieldCheck,
    label: "Submission protection",
    title: "Block abuse without blocking people.",
    copy: "Jobing combines origin controls, a hidden honeypot, rate checks, and risk-based verification instead of forcing every visitor through a challenge.",
    fact: "Low-friction protection",
  },
  {
    Icon: FileUp,
    label: "Files and richer questions",
    title: "Collect more than name and email.",
    copy: "Use 15 field types, conditional questions, ratings, consent, dates, times, and private file uploads up to the configured limit.",
    fact: "15 field types",
  },
  {
    Icon: Workflow,
    label: "Integrations",
    title: "Send responses where work happens.",
    copy: "Connect Google Sheets, Airtable, Slack, Notion, HubSpot, Mailchimp, Zapier, webhooks, analytics, and file storage.",
    fact: "14 integration options",
  },
] as const;

const faqs = [
  {
    question: "Do I have to redesign my existing form?",
    answer:
      "No. Keep your current HTML, CSS, labels, layout, and button. Preserve the form action, POST method, and field names so Jobing can receive the response.",
  },
  {
    question: "Do visitors leave my website when they submit?",
    answer:
      "No. A native form can submit from your page and show a confirmation there. You can also set a secure redirect after a successful submission.",
  },
  {
    question: "Do I need to build a database or admin panel?",
    answer:
      "No. Jobing stores accepted responses and gives you a private response inbox with search, review states, table view, and export.",
  },
  {
    question: "Can I create the form without writing HTML?",
    answer:
      "Yes. Create it in the visual Forms dashboard or ask your connected AI to create, publish, and add it to a page. The AI returns the live links automatically.",
  },
  {
    question: "Can my AI read customer responses?",
    answer:
      "Only after you approve the response-reading permission and ask for the information. Uploaded file contents and integration credentials are not exposed to the AI.",
  },
  {
    question: "What happens after the free response allowance?",
    answer:
      "Valid responses continue saving. The free workspace shows 50 responses each month. Upgrade when you need to view and export more.",
  },
] as const;

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jobing Forms",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://jobing.site/form-backend",
  description:
    "A form backend, response inbox, and AI-connected workflow for custom website forms.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Create up to five published forms and view 50 responses per month.",
  },
  featureList: [
    "Custom HTML form endpoint",
    "Visual form builder",
    "Response inbox",
    "File uploads",
    "Conditional questions",
    "Spam protection",
    "Integrations",
    "AI-assisted response analysis",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function FormBackendPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Jobing AI home">
          <Image src="/logo.png" alt="" width={36} height={36} priority />
          <span>Jobing Forms</span>
        </Link>
        <nav className={styles.nav} aria-label="Form backend navigation">
          <a href="#why">Why Jobing</a>
          <a href="#how">How it works</a>
          <a href="#integrations">Integrations</a>
          <Link href="/pricing">Pricing</Link>
          <a href={formDocsUrl}>Docs</a>
        </nav>
        <Link className={styles.headerCta} href={dashboardUrl} prefetch={false}>
          Open Forms <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>FORM BACKEND + RESPONSE WORKSPACE</p>
        <h1>Your website form should not need its own backend.</h1>
        <p className={styles.heroCopy}>
          Keep the form design your customers see. Jobing handles what happens after
          they press send: secure submission, storage, files, integrations, and a
          private inbox your AI can help you understand.
        </p>
        <div className={styles.heroActions}>
          <Link href={dashboardUrl} prefetch={false}>
            Create a working form <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <a href="#how">See how it works</a>
        </div>
        <p className={styles.allowance}>Start with 5 published forms and 50 visible responses each month.</p>

        <div className={styles.pipeline} aria-label="A form submission moving through Jobing into the response inbox">
          <div className={styles.codePanel}>
            <div className={styles.panelTop}>
              <span>contact.html</span>
              <span>POST</span>
            </div>
            <pre>
              <code>
                <span className={styles.codeMuted}>&lt;form</span>{" "}
                <span className={styles.codeBlue}>method</span>=
                <span className={styles.codeLime}>&quot;POST&quot;</span>
                {"\n  "}
                <span className={styles.codeBlue}>action</span>=
                <span className={styles.codeLime}>
                  &quot;https://forms.jobing.site/forms/f/frm_your_form&quot;
                </span>
                <span className={styles.codeMuted}>&gt;</span>
                {"\n\n  "}
                <span className={styles.codeMuted}>&lt;input</span>{" "}
                <span className={styles.codeBlue}>name</span>=
                <span className={styles.codeLime}>&quot;email&quot;</span>{" "}
                <span className={styles.codeBlue}>type</span>=
                <span className={styles.codeLime}>&quot;email&quot;</span>{" "}
                <span className={styles.codeBlue}>required</span>
                <span className={styles.codeMuted}>&gt;</span>
                {"\n  "}
                <span className={styles.codeMuted}>&lt;textarea</span>{" "}
                <span className={styles.codeBlue}>name</span>=
                <span className={styles.codeLime}>&quot;message&quot;</span>
                <span className={styles.codeMuted}>&gt;&lt;/textarea&gt;</span>
                {"\n  "}
                <span className={styles.codeMuted}>&lt;button&gt;</span>
                Send enquiry
                <span className={styles.codeMuted}>&lt;/button&gt;</span>
                {"\n"}
                <span className={styles.codeMuted}>&lt;/form&gt;</span>
              </code>
            </pre>
            <p><Check size={14} /> Your design stays yours</p>
          </div>

          <div className={styles.route}>
            <span className={styles.routeDot} />
            <div>
              <Image src="/logo.png" alt="" width={34} height={34} />
              <small>JOBING ENDPOINT</small>
              <strong>Accepted just now</strong>
            </div>
            <i />
            <i />
            <i />
          </div>

          <div className={styles.resultPanel}>
            <div className={styles.panelTop}>
              <span>Response inbox</span>
              <span className={styles.live}><i /> LIVE</span>
            </div>
            <article>
              <span>NP</span>
              <div><strong>Nisha Patel</strong><small>New project enquiry</small></div>
              <time>now</time>
            </article>
            <dl>
              <div><dt>Budget</dt><dd>₹1L–₹3L</dd></div>
              <div><dt>Timeline</dt><dd>Within 30 days</dd></div>
              <div><dt>Message</dt><dd>“We need a launch page and lead form.”</dd></div>
            </dl>
            <div className={styles.aiNote}>
              <Bot size={18} />
              <p><b>Ask your AI next</b><span>“Is this lead ready for a call?”</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.technologyRail} aria-labelledby="technology-heading">
        <p id="technology-heading">Works wherever your page already lives</p>
        <div>
          {technologies.map(({ name, Icon }) => (
            <span key={name}><Icon aria-hidden="true" /><small>{name}</small></span>
          ))}
        </div>
      </section>

      <section className={styles.problem} id="why">
        <div className={styles.sectionHeading}>
          <p>THE HIDDEN COST OF “JUST ADD A FORM”</p>
          <h2>A custom form usually creates five more jobs.</h2>
          <span>
            The visible fields are the easy part. The real work begins after someone
            submits.
          </span>
        </div>
        <div className={styles.jobLedger}>
          <div className={styles.oldWay}>
            <p>WITHOUT JOBING</p>
            <ul>
              <li><Braces /><span>Build a submit API</span><b>another project</b></li>
              <li><Database /><span>Design a database</span><b>more maintenance</b></li>
              <li><LockKeyhole /><span>Protect it from abuse</span><b>more friction</b></li>
              <li><Inbox /><span>Build an admin inbox</span><b>more UI work</b></li>
              <li><Workflow /><span>Connect every tool</span><b>more credentials</b></li>
            </ul>
          </div>
          <div className={styles.jobingWay}>
            <p>WITH JOBING</p>
            <Image src="/logo.png" alt="" width={50} height={50} />
            <h3>Connect once.<br />Keep building the page.</h3>
            <span>
              Your form endpoint, response storage, review inbox, integrations, and AI
              tools are already connected.
            </span>
            <Link href={dashboardUrl} prefetch={false}>Create my form <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeadingDark}>
          <p>THE BACKEND PEOPLE EXPECT. THE WORKFLOW THEY DO NOT.</p>
          <h2>Receive the answer. Then do something with it.</h2>
        </div>
        <div className={styles.featureLedger}>
          {features.map(({ Icon, label, title, copy, fact }, index) => (
            <article key={title}>
              <span className={styles.featureNumber}>0{index + 1}</span>
              <div className={styles.featureIcon}><Icon aria-hidden="true" /></div>
              <div>
                <small>{label}</small>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <b>{fact}</b>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.how} id="how">
        <div className={styles.sectionHeading}>
          <p>THREE STEPS. THE ORDER ACTUALLY MATTERS.</p>
          <h2>From “I need a form” to a response you can use.</h2>
        </div>
        <ol className={styles.steps}>
          <li>
            <span>1</span>
            <div>
              <small>CREATE</small>
              <h3>Describe it or build it visually.</h3>
              <p>
                Ask your connected AI for a contact, application, registration,
                feedback, or waitlist form. Or use the familiar visual builder in the
                Forms dashboard.
              </p>
            </div>
            <div className={styles.promptCard}>
              <div><MessageSquareText size={18} /><b>In your AI app</b></div>
              <p>“Create a project enquiry form that asks about budget, timeline, and goals.”</p>
              <span><Sparkles size={14} /> Draft created</span>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <small>PUBLISH</small>
              <h3>Use native HTML, not an iframe.</h3>
              <p>
                Jobing returns the complete form markup and secure action URL. Match
                every font, color, field, and interaction to your website.
              </p>
            </div>
            <div className={styles.publishCard}>
              <MousePointerClick size={23} />
              <div><small>FORM STATUS</small><b>Published</b></div>
              <span>Native HTML ready</span>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <small>UNDERSTAND</small>
              <h3>Open the inbox or ask your AI.</h3>
              <p>
                Review individual responses, compare them in a table, export the
                visible set, or ask for a summary, shortlist, follow-up plan, or trend.
              </p>
            </div>
            <div className={styles.summaryCard}>
              <div><Bot size={18} /><b>Response summary</b></div>
              <strong>7 of 12 enquiries have a launch date inside 30 days.</strong>
              <p>Contact Nisha, Aaron, and Mira first.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.integrations} id="integrations">
        <div className={styles.integrationsCopy}>
          <p>WHEN THE RESPONSE SHOULD GO SOMEWHERE ELSE</p>
          <h2>Your inbox can be the start, not the destination.</h2>
          <span>
            Keep the response in Jobing and send it to the tools your team already
            checks.
          </span>
          <Link href={`${DOCS_URL}/integrations/overview`}>
            Explore integrations <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.integrationMap} aria-label="Available Jobing Forms integrations">
          <div className={styles.integrationHub}>
            <Image src="/logo.png" alt="" width={48} height={48} />
            <b>New response</b>
          </div>
          <span data-position="one"><SiGooglesheets /><b>Google Sheets</b></span>
          <span data-position="two"><SiAirtable /><b>Airtable</b></span>
          <span data-position="three"><FaSlack /><b>Slack</b></span>
          <span data-position="four"><SiMeta /><b>Meta Pixel</b></span>
          <i data-line="one" />
          <i data-line="two" />
          <i data-line="three" />
          <i data-line="four" />
        </div>
      </section>

      <section className={styles.trust}>
        <div>
          <p>BUILT FOR REAL CUSTOMER DATA</p>
          <h2>The quiet safeguards are already there.</h2>
        </div>
        <dl>
          <div><dt><ShieldCheck /> HTTPS submission</dt><dd>Responses are protected in transit.</dd></div>
          <div><dt><LockKeyhole /> Origin controls</dt><dd>Choose which websites can submit.</dd></div>
          <div><dt><FileUp /> Private uploads</dt><dd>Files stay behind authenticated access.</dd></div>
          <div><dt><Bot /> Permissioned AI</dt><dd>Your AI reads responses only after approval.</dd></div>
        </dl>
      </section>

      <section className={styles.faq}>
        <div className={styles.sectionHeadingDark}>
          <p>QUESTIONS BEFORE YOU POINT A FORM AT JOBING</p>
          <h2>Clear answers, before the first response.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}<span aria-hidden="true">+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p>YOUR FRONTEND IS FINISHED.</p>
          <h2>Let the form be finished too.</h2>
          <span>Create visually, ask your AI, or connect the HTML you already have.</span>
        </div>
        <Link href={dashboardUrl} prefetch={false}>
          Create a working form <ArrowRight size={18} />
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>
          <Image src="/logo.png" alt="" width={27} height={27} />
          <b>Jobing Forms</b>
        </Link>
        <nav aria-label="Form backend footer navigation">
          <Link href="/connector">AI connector</Link>
          <Link href="/pricing">Pricing</Link>
          <a href={formDocsUrl}>Docs</a>
          <Link href="/feedback">Feedback</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}
