"use client";

import Image from "next/image";
import { type KeyboardEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  FormInput,
  Globe2,
  Inbox,
  Mail,
  MessageSquareText,
} from "lucide-react";
import { track } from "@/lib/analytics";
import styles from "./toolchain-showcase.module.css";

const toolLogos = {
  googleForms: "https://cdn.simpleicons.org/googleforms/7248B9",
  typeform: "https://cdn.simpleicons.org/typeform/262627",
  lovable: "https://lovable.dev/favicon.svg",
  bolt: "https://bolt.new/static/favicon.svg",
  webflow: "https://cdn.simpleicons.org/webflow/146EF5",
  airtable: "https://cdn.simpleicons.org/airtable/18BFFF",
  zapier: "https://zapier.com/favicon.ico",
} as const;

const tools = [
  { name: "Google Forms", logo: toolLogos.googleForms },
  { name: "Typeform", logo: toolLogos.typeform },
  { name: "Lovable", logo: toolLogos.lovable },
  { name: "Bolt", logo: toolLogos.bolt },
  { name: "Webflow", logo: toolLogos.webflow },
  { name: "Airtable", logo: toolLogos.airtable },
  { name: "Zapier", logo: toolLogos.zapier },
] as const;

const roles = [
  {
    id: "founder",
    tab: "Founder",
    title: "Launch the idea while it is still exciting.",
    prompt:
      "Create a launch page for my meal planning app, add a branded waitlist form, and publish it.",
    oldTools: ["Lovable", "Typeform", "Airtable"],
    result: "Launch page + waitlist + response inbox",
    detail:
      "Change the words, fields, colors, or layout by asking again. No database setup between prompts.",
  },
  {
    id: "recruiter",
    tab: "Recruiter",
    title: "Turn a job brief into an application flow.",
    prompt:
      "Publish a hiring page for a store manager and collect CV links, availability, and phone numbers.",
    oldTools: ["Google Forms", "Webflow", "Airtable"],
    result: "Job page + custom application form + applicants",
    detail:
      "The form looks like the employer, not a generic survey, and every application stays organized.",
  },
  {
    id: "agency",
    tab: "Agency",
    title: "Ship the campaign without a developer handoff.",
    prompt:
      "Create a campaign page for my client’s summer offer with a lead form that matches their brand.",
    oldTools: ["Webflow", "Typeform", "Zapier"],
    result: "Client-ready page + on-brand lead form + enquiries",
    detail:
      "Build a different design for every client without wiring a new form backend each time.",
  },
  {
    id: "organizer",
    tab: "Organizer",
    title: "Open registration before the group chat gets messy.",
    prompt:
      "Create a page for my Hyderabad workshop, add a registration form for 50 people, and publish it.",
    oldTools: ["Google Forms", "Lovable", "Zapier"],
    result: "Event page + registration form + attendee list",
    detail:
      "Share one professional link and update the page or questions later from the same AI conversation.",
  },
] as const;

function ToolLogo({
  name,
  logo,
  compact = false,
}: {
  name: string;
  logo: string;
  compact?: boolean;
}) {
  return (
    <span className={compact ? styles.compactTool : styles.toolChip}>
      <img
        src={logo}
        alt=""
        width={compact ? 18 : 22}
        height={compact ? 18 : 22}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <span>{name}</span>
    </span>
  );
}

export function ToolchainShowcase() {
  const [activeRole, setActiveRole] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const role = roles[activeRole];

  useEffect(() => {
    if (!autoRotate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveRole((current) => (current + 1) % roles.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoRotate]);

  function selectRole(index: number) {
    setActiveRole(index);
    setAutoRotate(false);
    track("homepage_role_selected", { role: roles[index].id });
  }

  function handleRoleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? roles.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % roles.length
            : (index - 1 + roles.length) % roles.length;
    selectRole(nextIndex);
    window.requestAnimationFrame(() =>
      document.getElementById(`role-tab-${roles[nextIndex].id}`)?.focus(),
    );
  }

  return (
    <section id="use-cases" className={styles.section}>
      <div className={styles.intro}>
        <p>Stop stitching tools together</p>
        <h2>One conversation replaces the handoff between five apps.</h2>
        <span>
          A form tool gives you a form. A site builder gives you a site. Jobing
          AI lets the AI you already use create the whole customer journey and
          keep it working.
        </span>
      </div>

      <div
        className={styles.machine}
        aria-label="Jobing AI replaces a multi-tool website and form workflow"
      >
        <div className={styles.usualSide}>
          <div className={styles.machineLabel}>
            <span>The usual setup</span>
            <b>Open. Build. Connect. Repeat.</b>
          </div>
          <div className={styles.toolWindow} aria-hidden="true">
            <div className={styles.toolTrack}>
              {[...tools, ...tools].map((tool, index) => (
                <ToolLogo key={`${tool.name}-${index}`} {...tool} />
              ))}
            </div>
          </div>
          <p>
            Website builder <ArrowRight size={13} /> form builder{" "}
            <ArrowRight size={13} /> database <ArrowRight size={13} />{" "}
            automation
          </p>
        </div>

        <div className={styles.connectorCore}>
          <span className={styles.corePulse} aria-hidden="true" />
          <Image src="/logo.png" alt="" width={54} height={54} />
          <b>Jobing AI</b>
          <span>one connector</span>
        </div>

        <div className={styles.outputSide}>
          <div className={styles.machineLabel}>
            <span>What comes back</span>
            <b>Finished work, not instructions.</b>
          </div>
          <div className={styles.outputCards}>
            <span>
              <Globe2 size={18} />
              <b>Live page</b>
              <small>Published</small>
            </span>
            <span>
              <FormInput size={18} />
              <b>Custom form</b>
              <small>On-brand</small>
            </span>
            <span>
              <Inbox size={18} />
              <b>Responses</b>
              <small>Organized</small>
            </span>
            <span className={styles.soon}>
              <Mail size={18} />
              <b>Follow-up</b>
              <small>Coming soon</small>
            </span>
          </div>
        </div>
      </div>

      <div
        className={styles.roleStage}
        onMouseEnter={() => setAutoRotate(false)}
        onFocusCapture={() => setAutoRotate(false)}
      >
        <div
          className={styles.roleTabs}
          role="tablist"
          aria-label="See Jobing AI use cases by role"
        >
          <span>See it for a</span>
          {roles.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`role-tab-${item.id}`}
              aria-selected={index === activeRole}
              aria-controls="role-use-case"
              tabIndex={index === activeRole ? 0 : -1}
              onClick={() => selectRole(index)}
              onKeyDown={(event) => handleRoleKeyDown(event, index)}
            >
              {item.tab}
            </button>
          ))}
        </div>

        <div
          id="role-use-case"
          role="tabpanel"
          aria-labelledby={`role-tab-${role.id}`}
          className={styles.rolePanel}
          key={role.id}
        >
          <div className={styles.roleCopy}>
            <p>{role.tab}</p>
            <h3>{role.title}</h3>
            <div className={styles.oldStack}>
              <span>You would usually open</span>
              <div>
                {role.oldTools.map((toolName) => {
                  const tool = tools.find(
                    (candidate) => candidate.name === toolName,
                  );
                  return tool ? (
                    <ToolLogo key={tool.name} {...tool} compact />
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <div className={styles.promptScene}>
            <div className={styles.promptTop}>
              <MessageSquareText size={17} />
              <span>Ask in your AI app</span>
            </div>
            <blockquote>“{role.prompt}”</blockquote>
            <div className={styles.resultCard}>
              <div>
                <Image src="/logo.png" alt="" width={26} height={26} />
                <span>
                  <b>Jobing AI finished it</b>
                  <small>{role.result}</small>
                </span>
              </div>
              <ul>
                <li>
                  <Check size={14} /> Page published
                </li>
                <li>
                  <Check size={14} /> Form connected
                </li>
                <li>
                  <Check size={14} /> Inbox ready
                </li>
              </ul>
            </div>
          </div>

          <p className={styles.roleDetail}>{role.detail}</p>
        </div>
      </div>
    </section>
  );
}
