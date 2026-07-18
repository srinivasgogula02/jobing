"use client";

/* eslint-disable @next/next/no-img-element -- remote brand marks are tiny, fixed-size UI icons */

import { Check, Copy, ExternalLink, MessageSquareText, PlugZap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { track } from "@/lib/analytics";
import styles from "./ConnectorSetupGuide.module.css";

export const JOBING_MCP_URL = "https://jobing.site/mcp";

export type ConnectorPlatform = "claude" | "chatgpt";

const logos: Record<ConnectorPlatform, string> = {
  chatgpt: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  claude: "https://cdn.simpleicons.org/claude/D97757",
};

const instructions = {
  chatgpt: {
    label: "ChatGPT",
    setup: [
      {
        title: "Open Apps settings and enable Developer mode",
        detail: <>Review the risk shown by ChatGPT before enabling it. <a href="https://chatgpt.com/#settings/Connectors/Advanced" target="_blank" rel="noreferrer">Open Apps settings <ExternalLink size={12} /></a>. If the option is missing, ask your ChatGPT workspace admin to enable it.</>,
      },
      {
        title: "Select Create app",
        detail: <>The button appears beside the back button after Developer mode is enabled.</>,
      },
      {
        title: "Name it Jobing AI and paste the MCP link",
        detail: <>Use the link shown above. Keeping the name “Jobing AI” makes it easy to find in future chats.</>,
      },
      {
        title: "Select Create and approve the connection",
        detail: <>Sign in to Jobing AI and review the permissions before allowing access.</>,
      },
      {
        title: "Enable Jobing AI in your chat",
        detail: <>Choose Jobing AI from the chat composer, then ask it to create a page, form, or review responses.</>,
      },
    ],
    refresh: [
      {
        title: "Open App Preferences",
        detail: <><a href="https://chatgpt.com/#settings/Connectors" target="_blank" rel="noreferrer">Open your enabled apps <ExternalLink size={12} /></a>.</>,
      },
      { title: "Choose Jobing AI under Enabled apps", detail: <>Open the app information screen.</> },
      { title: "Select Refresh beside Information", detail: <>ChatGPT will load Jobing AI’s latest available tools.</> },
      { title: "Confirm the MCP link", detail: <>If you previously used a different address, replace it with the link shown above.</> },
      { title: "Start a new chat", detail: <>Enable Jobing AI from the composer so the refreshed tools are available.</> },
    ],
  },
  claude: {
    label: "Claude",
    setup: [
      {
        title: "Open Claude’s Connectors page",
        detail: <><a href="https://claude.ai/customize/connectors" target="_blank" rel="noreferrer">Open Connectors <ExternalLink size={12} /></a> to create a custom connection.</>,
      },
      {
        title: "Select +, then Add custom connector",
        detail: <>The + button sits beside the Connectors heading. If it is missing, ask your Claude workspace admin to allow custom connectors.</>,
      },
      {
        title: "Name it Jobing AI and paste the MCP link",
        detail: <>Use the link shown above, then save the connector.</>,
      },
      {
        title: "Sign in and allow access",
        detail: <>Review exactly what Jobing AI can do before approving the connection.</>,
      },
      {
        title: "Enable Jobing AI in your chat",
        detail: <>Choose Jobing AI from the connector menu, then ask it to create or manage your work.</>,
      },
    ],
    refresh: [
      {
        title: "Open the Connectors page",
        detail: <><a href="https://claude.ai/customize/connectors" target="_blank" rel="noreferrer">Open Claude Connectors <ExternalLink size={12} /></a>.</>,
      },
      { title: "Select the Jobing AI connector", detail: <>Open the connector you added earlier.</> },
      { title: "Refresh or update its tools", detail: <>Claude will load Jobing AI’s latest available capabilities.</> },
      { title: "Confirm the MCP link", detail: <>If you previously used a different address, replace it with the link shown above.</> },
      { title: "Start a new chat", detail: <>Enable Jobing AI from the connector menu before sending your prompt.</> },
    ],
  },
} satisfies Record<ConnectorPlatform, {
  label: string;
  setup: Array<{ title: string; detail: React.ReactNode }>;
  refresh: Array<{ title: string; detail: React.ReactNode }>;
}>;

interface ConnectorSetupGuideProps {
  platform: ConnectorPlatform;
  onPlatformChange: (platform: ConnectorPlatform) => void;
  placement: "homepage" | "connector_page";
}

export function ConnectorSetupGuide({ platform, onPlatformChange, placement }: ConnectorSetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const current = instructions[platform];

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(JOBING_MCP_URL);
    } catch {
      window.prompt("Copy your Jobing AI MCP link", JOBING_MCP_URL);
    }
    track("mcp_url_copied", { placement: `${placement}_instructions`, platform });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function selectPlatform(nextPlatform: ConnectorPlatform) {
    onPlatformChange(nextPlatform);
    track("connector_platform_selected", { platform: nextPlatform, placement: `${placement}_instructions` });
  }

  return (
    <section className={styles.guide} aria-labelledby={`${placement}-connection-guide-title`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Exact connection guide</p>
          <h3 id={`${placement}-connection-guide-title`}>Paste one link. Connect once.</h3>
          <span>Choose your AI app to see every step, including how to refresh Jobing AI when new capabilities are added. The same link works in other AI apps that support remote MCP connectors.</span>
        </div>
        <div className={styles.platformTabs} role="tablist" aria-label="Choose an AI app">
          {(Object.keys(instructions) as ConnectorPlatform[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={platform === key}
              data-active={platform === key}
              onClick={() => selectPlatform(key)}
            >
              <img src={logos[key]} alt="" />
              {instructions[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.urlRow}>
        <div>
          <span>Your Jobing AI MCP link</span>
          <code>{JOBING_MCP_URL}</code>
        </div>
        <button type="button" onClick={copyUrl} aria-label={`Copy ${JOBING_MCP_URL}`}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>

      <div className={styles.columns}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <span className={styles.panelIcon}><PlugZap size={19} /></span>
            <div><h4>Connect to {current.label}</h4><p>Do this once before your first Jobing AI prompt.</p></div>
          </header>
          <ol className={styles.steps}>
            {current.setup.map((step) => (
              <li key={step.title}><div className={styles.stepCopy}><b>{step.title}</b><p>{step.detail}</p></div></li>
            ))}
          </ol>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <span className={styles.panelIcon}><RefreshCw size={19} /></span>
            <div><h4>Refresh after Jobing AI changes</h4><p>Use this when a new tool is released or an old tool is updated.</p></div>
          </header>
          <ol className={styles.steps}>
            {current.refresh.map((step) => (
              <li key={step.title}><div className={styles.stepCopy}><b>{step.title}</b><p>{step.detail}</p></div></li>
            ))}
          </ol>
        </article>
      </div>

      <div className={styles.firstPrompt}>
        <MessageSquareText size={19} />
        <div><span>Your first prompt</span><p>“Use Jobing AI and tell me what you can create and manage for me.”</p></div>
      </div>
    </section>
  );
}
