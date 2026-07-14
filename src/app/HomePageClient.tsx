"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Copy, FileText, FormInput, Globe2, Mail, Menu, Play, X } from "lucide-react";
import styles from "./home-v2.module.css";

const MCP_URL = "https://jobing.site/mcp";
const platformLogos = {
  chatgpt: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  claude: "https://cdn.simpleicons.org/claude/D97757",
} as const;

const platforms = {
  chatgpt: {
    label: "ChatGPT",
    playbackId: process.env.NEXT_PUBLIC_MUX_CHATGPT_PLAYBACK_ID,
    steps: ["Open ChatGPT Settings", "Choose Apps & Connectors", "Add the Jobing AI MCP URL"],
  },
  claude: {
    label: "Claude",
    playbackId: "owFFBz2hKX6GLXroqC9lK9v3E1VwXAe02g00ZQR02Cx00B8",
    steps: ["Open Claude Settings", "Choose Connectors", "Add the Jobing AI MCP URL"],
  },
} as const;

const useCases = [
  {
    label: "Launch a business",
    title: "Website + enquiries",
    prompt: "Create a website for my consulting business, add a project enquiry form, and publish it.",
    result: "A live website and a working enquiry inbox",
    icon: Globe2,
  },
  {
    label: "Validate an idea",
    title: "Waitlist + follow-up",
    prompt: "Create a waitlist page for my new product, collect email signups, and draft a welcome email.",
    result: "A launch page, captured leads, and an email ready to send",
    icon: Mail,
  },
  {
    label: "Run an event",
    title: "Registration page",
    prompt: "Publish a page for my Hyderabad workshop and add a registration form for 50 attendees.",
    result: "A shareable event page and organized registrations",
    icon: FormInput,
  },
  {
    label: "Share useful work",
    title: "Public note",
    prompt: "Turn this plan into a clean public note and give me a link I can share.",
    result: "A readable link instead of another document attachment",
    icon: FileText,
  },
];

function CopyConnector({ large = false }: { large?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`${styles.connectorUrl} ${large ? styles.connectorUrlLarge : ""}`}>
      <div><span>MCP connector URL</span><code>{MCP_URL}</code></div>
      <button type="button" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}<span>{copied ? "Copied" : "Copy URL"}</span></button>
    </div>
  );
}

export function HomePageClient() {
  const [platform, setPlatform] = useState<keyof typeof platforms>("claude");
  const [menuOpen, setMenuOpen] = useState(false);
  const current = platforms[platform];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Jobing AI home"><Image src="/logo.png" alt="" width={36} height={36} priority /><span>Jobing AI</span></Link>
          <nav className={styles.desktopNav} aria-label="Main navigation">
            <a href="#connect">How to connect</a><a href="#use-cases">What it can do</a><Link href="/pages">My pages</Link><Link href="/forms/app">Forms inbox</Link><Link href="/pricing">Pricing</Link>
            <a className={styles.navCta} href="#connect">Connect Jobing AI</a>
          </nav>
          <button className={styles.menuButton} type="button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className={styles.mobileNav} aria-label="Mobile navigation"><a href="#connect" onClick={() => setMenuOpen(false)}>How to connect</a><a href="#use-cases" onClick={() => setMenuOpen(false)}>What it can do</a><Link href="/pages">My pages</Link><Link href="/forms/app">Forms inbox</Link><Link href="/pricing">Pricing</Link></nav>}
      </header>

      <section className={styles.hero}>
        <div className={styles.badge} aria-label="Connects to ChatGPT, Claude, and other supported AI apps"><img src={platformLogos.chatgpt} alt="ChatGPT" /><img src={platformLogos.claude} alt="Claude" /><span>Connects to the AI app you already use</span></div>
        <h1>Give your AI the tools<br className={styles.desktopBreak} /> to finish the work.</h1>
        <p className={styles.heroText}>Jobing AI is one connector that lets your AI publish websites, create custom forms, collect customer enquiries, and follow up by email. It does the work instead of only giving you instructions.</p>
        <div className={styles.heroConnector}><CopyConnector large /></div>
        <p className={styles.heroHint}>Copy this URL into your AI app. Sign in once. Then ask for what you need.</p>
      </section>

      <section id="connect" className={styles.connectSection}>
        <div className={styles.videoHeading}><h2>Connect Jobing AI to {current.label} in 2 minutes.</h2></div>
        <div className={styles.videoShell}>
          <div className={styles.videoTabs} role="tablist" aria-label="Connection guides">
            {(Object.keys(platforms) as Array<keyof typeof platforms>).map(key => <button key={key} role="tab" aria-selected={platform === key} onClick={() => setPlatform(key)}><img src={platformLogos[key]} alt="" />{platforms[key].label}{platform === key && <Check size={15} />}</button>)}
          </div>
          <div className={styles.videoFrame}>
            {current.playbackId ? <iframe key={current.playbackId} src={`https://player.mux.com/${current.playbackId}`} title={`How to connect Jobing AI to ${current.label}`} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className={styles.videoPlaceholder}><span><Play fill="currentColor" /></span><strong>{current.label} connection video</strong><p>Add the Mux playback ID to show your screen recording here.</p></div>}
          </div>
          <ol className={styles.setupSteps}>{current.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
        </div>
      </section>

      <section className={styles.afterConnect}>
        <div><p>After connecting</p><h2>You do not open another builder. You just ask.</h2></div>
        <div className={styles.conversation}>
          <span>You</span><p>Create a website for my interior design studio. Add a form so people can request a consultation. Publish it.</p>
          <span>Jobing AI</span><div><b><Check size={15} /> Website published</b><b><Check size={15} /> Form connected</b><b><Check size={15} /> Enquiry inbox ready</b><a href="#use-cases">See more things you can ask <ChevronRight size={16} /></a></div>
        </div>
      </section>

      <section id="use-cases" className={styles.useCases}>
        <div className={styles.sectionIntro}><p>Copy a prompt and try it</p><h2>Start with a real job you need done.</h2><span>Jobing AI chooses the right tools and returns the finished result inside your AI conversation.</span></div>
        <div className={styles.useCaseList}>{useCases.map(({ icon: Icon, ...item }) => <article key={item.title}><div className={styles.useCaseHeading}><span><Icon size={19} /></span><div><small>{item.label}</small><h3>{item.title}</h3></div></div><blockquote>“{item.prompt}”</blockquote><p><Check size={15} /> {item.result}</p></article>)}</div>
      </section>

      <section className={styles.findWork}>
        <div className={styles.sectionIntro}><p>Where your work lives</p><h2>Everything stays easy to find.</h2><span>Your AI creates the work. Jobing AI gives you a dashboard to manage what happens next.</span></div>
        <div className={styles.destinationGrid}>
          <Link href="/pages"><span><Globe2 /></span><div><small>JOBING AI PAGES</small><h3>Open my pages</h3><p>View, edit, and share every website your AI has published.</p></div><ChevronRight /></Link>
          <Link href="/forms/app"><span><FormInput /></span><div><small>JOBING AI FORMS</small><h3>Open my forms inbox</h3><p>See your forms and every customer response in one place.</p></div><ChevronRight /></Link>
        </div>
      </section>

      <section className={styles.finalCta}><div><p>One connection. Real outcomes.</p><h2>Give your AI a way to act.</h2><span>Copy the MCP URL and connect Jobing AI to the AI app you already use.</span></div><CopyConnector /></section>

      <footer className={styles.footer}><div><Image src="/logo.png" alt="" width={24} height={24} /><span>Jobing AI · The connector that finishes the work</span></div><nav><Link href="/pages">Pages</Link><Link href="/forms/app">Forms</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
    </main>
  );
}
