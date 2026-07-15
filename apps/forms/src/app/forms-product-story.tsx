"use client";

/* eslint-disable @next/next/no-img-element */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "./forms-marketing.module.css";

const stages = [
  { id: "ask", label: "Ask", caption: "Describe the form" },
  { id: "collect", label: "Collect", caption: "Responses arrive" },
  { id: "understand", label: "Understand", caption: "Ask about answers" },
] as const;

export function AiAppMarks({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? styles.aiMarksCompact : styles.aiMarks} aria-hidden="true">
      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="" />
      <img src="https://cdn.simpleicons.org/claude/D97757" alt="" />
    </span>
  );
}

export function FormsProductStory() {
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setStage((value) => (value + 1) % stages.length), 4800);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const sceneTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className={styles.storyShell} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={styles.storyTabs} role="tablist" aria-label="How Jobing Forms works">
        {stages.map((item, index) => (
          <button key={item.id} type="button" role="tab" aria-selected={stage === index} onClick={() => setStage(index)}>
            <span>{index + 1}</span><b>{item.label}</b><small>{item.caption}</small>
          </button>
        ))}
      </div>

      <div className={styles.storyViewport} aria-live="polite">
        <div className={styles.storyBrowserBar}>
          <span className={styles.browserDots}><i /><i /><i /></span>
          <span className={styles.storyApp}><AiAppMarks compact /><b>Your AI app</b></span>
          <span className={styles.storyStatus}><i /> Jobing Forms connected</span>
        </div>

        <div className={styles.storyStage}>
          <AnimatePresence initial={false} mode="wait">
        {stage === 0 && (
          <motion.div animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className={styles.storyScene} exit={{ opacity: 0, y: -6, filter: "blur(2px)" }} initial={{ opacity: 0, y: 10, filter: "blur(3px)" }} key="ask" transition={sceneTransition}>
            <div className={styles.storyConversation}>
              <p className={styles.storyUser}>Create a project enquiry form for this page. Ask for budget, timeline, and goals. Make it match the design.</p>
              <div className={styles.storyReply}>
                <div className={styles.replyBrand}><img src="/forms/logo.png" alt="" /><b>Jobing Forms</b><span>working</span></div>
                <ul><li><i /> Creating form fields</li><li><i /> Publishing secure endpoint</li><li><i /> Adding native HTML to the page</li></ul>
                <strong>Done. Your form is live and matches the page.</strong>
              </div>
            </div>
            <div className={styles.storyFormPreview}>
              <span>PROJECT ENQUIRY</span><h3>Let&apos;s build something useful.</h3>
              <label>Work email<div>you@company.com</div></label>
              <div className={styles.previewSplit}><label>Budget<div>₹1L – ₹3L</div></label><label>Timeline<div>4–6 weeks</div></label></div>
              <label>What are you building?<div className={styles.previewTextarea}>Tell us about the project...</div></label>
              <button tabIndex={-1}>Send project details</button>
            </div>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className={styles.storyScene} exit={{ opacity: 0, y: -6, filter: "blur(2px)" }} initial={{ opacity: 0, y: 10, filter: "blur(3px)" }} key="collect" transition={sceneTransition}>
            <div className={styles.submissionMoment}>
              <div className={styles.submissionCheck}>✓</div>
              <span>FORM SUBMITTED</span>
              <h3>Thanks, Maya. We&apos;ll reply shortly.</h3>
              <p>The visitor stays on your page. Jobing saves the response securely.</p>
            </div>
            <div className={styles.storyInbox}>
              <div className={styles.inboxTitle}><div><span>PROJECT ENQUIRIES</span><b>Response inbox</b></div><em>3 new</em></div>
              <article className={styles.inboxActive}><span>MP</span><div><b>Maya Patel</b><small>₹1L–₹3L · 4–6 weeks</small><p>We need a launch site for our new product.</p></div><time>now</time></article>
              <article><span>DC</span><div><b>Daniel Cho</b><small>₹3L–₹5L · 8 weeks</small></div><time>4m</time></article>
              <article><span>AS</span><div><b>Arun Studio</b><small>Budget not decided</small></div><time>12m</time></article>
            </div>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className={styles.storyScene} exit={{ opacity: 0, y: -6, filter: "blur(2px)" }} initial={{ opacity: 0, y: 10, filter: "blur(3px)" }} key="understand" transition={sceneTransition}>
            <div className={styles.storyConversation}>
              <p className={styles.storyUser}>Read the new enquiries. Who should I contact first, and what do they care about?</p>
              <div className={styles.storyReply}>
                <div className={styles.replyBrand}><img src="/forms/logo.png" alt="" /><b>Jobing Forms</b><span>12 responses read</span></div>
                <strong>Contact Maya and Daniel first.</strong>
                <p>Maya has the clearest deadline. Daniel has the largest confirmed budget. Both described a specific outcome.</p>
                <div className={styles.replyActions}><span>1 · Reply to Maya today</span><span>2 · Send Daniel a scope question</span><span>3 · Ask Arun for a budget range</span></div>
              </div>
            </div>
            <div className={styles.insightCard}>
              <span>AI RESPONSE BRIEF</span><b>What 12 leads care about</b>
              <div><label>Fast launch</label><i><em style={{ width: "84%" }} /></i><small>8 mentions</small></div>
              <div><label>Clear pricing</label><i><em style={{ width: "66%" }} /></i><small>6 mentions</small></div>
              <div><label>Easy handoff</label><i><em style={{ width: "42%" }} /></i><small>4 mentions</small></div>
              <p>Suggested next step: add a pricing range to the page.</p>
            </div>
          </motion.div>
        )}
          </AnimatePresence>
        </div>
      </div>
      <div className={styles.storyProgress} aria-hidden="true"><span key={stage} /></div>
    </div>
  );
}
