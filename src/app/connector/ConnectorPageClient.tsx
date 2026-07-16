"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FilePenLine,
  FormInput,
  Globe2,
  Inbox,
  Menu,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { track } from "@/lib/analytics";
import styles from "./connector-v2.module.css";

const CONNECTOR_URL = "https://jobing.site/mcp";

const platformLogos = {
  chatgpt: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  claude: "https://cdn.simpleicons.org/claude/D97757",
} as const;

const platforms = {
  claude: {
    label: "Claude",
    playbackId: "owFFBz2hKX6GLXroqC9lK9v3E1VwXAe02g00ZQR02Cx00B8",
    steps: ["Open Claude Settings", "Choose Connectors", "Add the Jobing AI URL"],
  },
  chatgpt: {
    label: "ChatGPT",
    playbackId: process.env.NEXT_PUBLIC_MUX_CHATGPT_PLAYBACK_ID,
    steps: ["Open ChatGPT Settings", "Choose Apps & Connectors", "Add the Jobing AI URL"],
  },
} as const;

const abilities = [
  {
    number: "01",
    icon: Globe2,
    title: "Publish and manage web pages",
    description: "Create a page, publish it to its own jobing.online address, edit it later without changing the link, or delete it after you confirm.",
    example: "Publish a page for my Saturday workshop with the agenda and venue.",
  },
  {
    number: "02",
    icon: FormInput,
    title: "Create forms that match the page",
    description: "Build contact, application, registration, waitlist, and enquiry forms with custom fields and native HTML that can be styled freely.",
    example: "Add a consultation form that looks like the rest of the page.",
  },
  {
    number: "03",
    icon: FilePenLine,
    title: "Improve forms without losing responses",
    description: "Edit a versioned draft, duplicate an existing form, and publish only when you are ready. The current live form keeps working until then.",
    example: "Add a budget field, but let me review the draft before it goes live.",
  },
  {
    number: "04",
    icon: Inbox,
    title: "Work with the responses",
    description: "Search new responses, summarize what people need, and organize each response into inbox, spam, or archive from the same conversation.",
    example: "Show this week’s enquiries and summarize the three strongest leads.",
  },
] as const;

const prompts = [
  {
    id: "launch",
    label: "Launch a business page",
    outcome: "Live page + custom form + response inbox",
    prompt: "Create a marketing page for my accounting firm. Add a contact form that matches the page, publish both, and give me the live link.",
  },
  {
    id: "edit-page",
    label: "Update a live page",
    outcome: "Same link, updated content",
    prompt: "Open my latest published page and change the main headline to ‘Clear books. Better decisions.’ Keep everything else the same.",
  },
  {
    id: "improve-form",
    label: "Improve a form safely",
    outcome: "New draft, current form stays live",
    prompt: "Update my application form to add a portfolio URL and expected salary. Keep the current live form unchanged until I approve the draft.",
  },
  {
    id: "responses",
    label: "Review new responses",
    outcome: "Lead summary + organized inbox",
    prompt: "Show me new responses from my contact form. Summarize what each person needs and move obvious spam out of the inbox.",
  },
] as const;

function ConnectorUrl({ placement }: { placement: "connector_hero" | "connector_footer" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONNECTOR_URL);
    } catch {
      window.prompt("Copy your Jobing AI connector URL", CONNECTOR_URL);
    }
    track("mcp_url_copied", { placement });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={styles.connectorUrl}>
      <div>
        <span>Jobing AI connector URL</span>
        <code>{CONNECTOR_URL}</code>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${CONNECTOR_URL}`}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
        <span>{copied ? "Copied" : "Copy URL"}</span>
      </button>
    </div>
  );
}

export function ConnectorPageClient() {
  const [platform, setPlatform] = useState<keyof typeof platforms>("claude");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const current = platforms[platform];

  async function copyPrompt(id: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      window.prompt("Copy this prompt", prompt);
    }
    setCopiedPrompt(id);
    track("connector_prompt_copied", { prompt_id: id });
    window.setTimeout(() => setCopiedPrompt(null), 1600);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Jobing AI home">
            <Image src="/logo.png" alt="" width={36} height={36} priority />
            <span>Jobing AI</span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Connector navigation">
            <a href="#setup">How to connect</a>
            <a href="#abilities">What it can do</a>
            <a href="#prompts">Prompts to try</a>
            <Link href="/connector/manage">Manage connection</Link>
            <Link className={styles.navCta} href="/dashboard">Dashboard</Link>
          </nav>
          <div className={styles.mobileActions}>
            <Link className={styles.mobileDashboard} href="/dashboard">Dashboard</Link>
            <button type="button" className={styles.menuButton} onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className={styles.mobileNav} aria-label="Mobile connector navigation">
            <a href="#setup" onClick={() => setMenuOpen(false)}>How to connect</a>
            <a href="#abilities" onClick={() => setMenuOpen(false)}>What it can do</a>
            <a href="#prompts" onClick={() => setMenuOpen(false)}>Prompts to try</a>
            <Link href="/connector/manage" onClick={() => setMenuOpen(false)}>Manage connection</Link>
          </nav>
        )}
      </header>

      <section className={styles.hero}>
        <div className={styles.compatibilityBadge}>
          <img src={platformLogos.chatgpt} alt="ChatGPT" />
          <img src={platformLogos.claude} alt="Claude" />
          <span>Add one link to the AI app you already use</span>
        </div>
        <h1>Connect Jobing AI.<br />Let your AI finish the work.</h1>
        <p className={styles.heroCopy}>
          Paste one link into your AI app and sign in once. Then your AI can <strong>publish web pages</strong>, <strong>create custom forms</strong>, and <strong>help you work with every response</strong> without sending you to another builder.
        </p>
        <div className={styles.heroUrl}><ConnectorUrl placement="connector_hero" /></div>
        <p className={styles.trustLine}><ShieldCheck size={15} /> No API keys. You choose the permissions. Disconnect whenever you want.</p>

        <div className={styles.outcomeRail} aria-label="One Jobing AI connection creates pages, forms, and a response inbox">
          <div className={styles.railApps}>
            <span><img src={platformLogos.chatgpt} alt="" /><img src={platformLogos.claude} alt="" /></span>
            <b>Your AI app</b>
          </div>
          <ArrowRight aria-hidden="true" />
          <div className={styles.railConnector}>
            <Image src="/logo.png" alt="" width={35} height={35} />
            <b>Jobing AI</b>
            <small>ONE CONNECTION</small>
          </div>
          <ArrowRight aria-hidden="true" />
          <div className={styles.railResults}>
            <span><Globe2 size={18} />Live page</span>
            <span><FormInput size={18} />Custom form</span>
            <span><Inbox size={18} />Responses</span>
          </div>
        </div>
      </section>

      <section id="setup" className={styles.setupSection}>
        <div className={styles.setupHeading}>
          <p>Watch the exact setup</p>
          <h2>
            <span>Connect Jobing AI to</span>
            <span className={styles.platformPicker}>
              <button type="button" onClick={() => setPlatformOpen((open) => !open)} aria-expanded={platformOpen}>
                <img src={platformLogos[platform]} alt="" />{current.label}<ChevronDown size={19} />
              </button>
              {platformOpen && (
                <span className={styles.platformMenu}>
                  {(Object.keys(platforms) as Array<keyof typeof platforms>).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setPlatform(key);
                        setPlatformOpen(false);
                        track("connector_platform_selected", { platform: key, placement: "connector_page" });
                      }}
                    >
                      <img src={platformLogos[key]} alt="" />
                      {platforms[key].label}
                      {platform === key && <Check size={15} />}
                    </button>
                  ))}
                </span>
              )}
            </span>
            <span>in 2 minutes.</span>
          </h2>
          <span>The same connector URL works in both. You only sign in once.</span>
        </div>

        <div className={styles.videoShell}>
          <div className={styles.videoFrame}>
            {current.playbackId ? (
              <iframe
                key={current.playbackId}
                src={`https://player.mux.com/${current.playbackId}?autoplay=muted&muted=true&metadata-video-title=Connect%20Jobing%20AI%20to%20${current.label}&accent-color=%23c1ff00`}
                title={`How to connect Jobing AI to ${current.label}`}
                loading="eager"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                onLoad={() => track("setup_video_loaded", { platform, placement: "connector_page" })}
              />
            ) : (
              <div className={styles.videoPlaceholder}>
                <span><Play fill="currentColor" /></span>
                <strong>{current.label} setup</strong>
                <p>Follow the three steps below. The connection link is the same.</p>
              </div>
            )}
          </div>
          <ol className={styles.setupSteps}>
            {current.steps.map((step, index) => (
              <li key={step}><span>{index + 1}</span><b>{step}</b></li>
            ))}
          </ol>
        </div>
      </section>

      <section id="abilities" className={styles.abilitiesSection}>
        <div className={styles.sectionIntro}>
          <p>What becomes possible after connecting</p>
          <h2>It does the next step, not just explains it.</h2>
          <span>Jobing AI gives your conversation a safe way to create, publish, update, and organize real work.</span>
        </div>
        <div className={styles.abilityList}>
          {abilities.map((ability) => {
            const Icon = ability.icon;
            return (
              <article key={ability.number}>
                <span className={styles.abilityNumber}>{ability.number}</span>
                <div className={styles.abilityIcon}><Icon size={23} /></div>
                <div className={styles.abilityCopy}>
                  <h3>{ability.title}</h3>
                  <p>{ability.description}</p>
                </div>
                <blockquote>“{ability.example}”</blockquote>
              </article>
            );
          })}
        </div>
        <div className={styles.soonStrip}>
          <Sparkles size={18} />
          <span><b>Email follow-up is coming soon.</b> Your AI will be able to draft and send replies using the same connection.</span>
        </div>
      </section>

      <section id="prompts" className={styles.promptsSection}>
        <div className={styles.sectionIntroLight}>
          <p>Try it after connecting</p>
          <h2>You do not need to learn commands.</h2>
          <span>Ask in normal language. Start with one of these prompts and change the business, words, fields, or design to match what you need.</span>
        </div>
        <div className={styles.promptGrid}>
          {prompts.map((item) => (
            <article key={item.id}>
              <div className={styles.promptTop}>
                <MessageSquareText size={18} />
                <span>{item.label}</span>
              </div>
              <blockquote>“{item.prompt}”</blockquote>
              <div className={styles.promptResult}>
                <span><Check size={15} />{item.outcome}</span>
                <button type="button" onClick={() => copyPrompt(item.id, item.prompt)} aria-label={`Copy prompt: ${item.label}`}>
                  {copiedPrompt === item.id ? <Check size={15} /> : <Copy size={15} />}
                  {copiedPrompt === item.id ? "Copied" : "Copy prompt"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.permissionSection}>
        <div className={styles.permissionCopy}>
          <p>You stay in control</p>
          <h2>Approve only what your AI can use.</h2>
          <span>Jobing AI shows every permission before connecting. New abilities need your approval, and deleting a page still requires an explicit confirmation.</span>
          <Link href="/connector/manage">Manage connected AI apps <ArrowRight size={17} /></Link>
        </div>
        <div className={styles.permissionReceipt}>
          <div className={styles.receiptHeader}>
            <span><Image src="/logo.png" alt="" width={32} height={32} /><b>Jobing AI connection</b></span>
            <ShieldCheck size={23} />
          </div>
          <ul>
            <li><Check size={16} /><span><b>Pages</b><small>View, publish, edit, and delete after confirmation</small></span></li>
            <li><Check size={16} /><span><b>Forms</b><small>View, create, edit drafts, duplicate, and publish</small></span></li>
            <li><Check size={16} /><span><b>Responses</b><small>Search answers and organize inbox, spam, or archive</small></span></li>
            <li><Check size={16} /><span><b>Notes</b><small>Save useful output as a shareable note</small></span></li>
          </ul>
          <p>Passwords, payment details, and uploaded file contents are never shared with the AI app.</p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p>One connection. Real outcomes.</p>
          <h2>Copy the link and give your AI a way to act.</h2>
        </div>
        <ConnectorUrl placement="connector_footer" />
      </section>

      <footer className={styles.footer}>
        <div><Image src="/logo.png" alt="" width={24} height={24} /><span>Jobing AI · The connector that finishes the work</span></div>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/pages">Pages</Link>
          <Link href="/dashboard/forms">Forms</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}
