"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { TextMorph } from "@/components/motion/text-morph";
import styles from "./forms-marketing.module.css";

const choices = [
  {
    id: "embed",
    label: "Embed a form tool",
    short: "Quick, but it looks added on",
    verdict: "Fast setup. Someone else’s design.",
  },
  {
    id: "custom",
    label: "Build everything yourself",
    short: "On-brand, but now you own a backend",
    verdict: "Your design. Six more systems to maintain.",
  },
  {
    id: "jobing",
    label: "Use Jobing Forms",
    short: "Your design, without the backend project",
    verdict: "Your website outside. Jobing underneath.",
  },
] as const;

export function FormsPositioning() {
  const [active, setActive] = useState(2);
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className={styles.positioningSection} id="why-jobing">
      <div className={styles.positioningIntro}>
        <p>WHY ADDING A FORM BECOMES A PROJECT</p>
        <h2>Your website is custom.<br />Its form should not feel borrowed.</h2>
        <span>Most people face two bad choices: paste in a generic form that does not match the page, or build a custom form and then discover they also need somewhere to save responses, stop spam, handle files, and manage an inbox.</span>
      </div>

      <div className={styles.positioningStage}>
        <div className={styles.positioningChoices} role="tablist" aria-label="Ways to add a form to a website">
          {choices.map((choice, index) => (
            <motion.button
              animate={{ y: active === index ? -3 : 0 }}
              aria-selected={active === index}
              key={choice.id}
              onClick={() => setActive(index)}
              role="tab"
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.985 }}
            >
              <span>0{index + 1}</span><div><b>{choice.label}</b><small>{choice.short}</small></div><i aria-hidden="true">→</i>
            </motion.button>
          ))}
        </div>

        <div className={styles.positioningVisual}>
          <div className={styles.positioningBrowser}><span><i /><i /><i /></span><code>yourwebsite.com/contact</code><b>LIVE PAGE</b></div>
          <div className={styles.positioningViewport}>
            <AnimatePresence initial={false} mode="wait">
              {active === 0 ? (
                <motion.div animate={{ opacity: 1, scale: 1 }} className={styles.embedState} exit={{ opacity: 0, scale: .98 }} initial={{ opacity: 0, scale: .98 }} key="embed" transition={transition}>
                  <div className={styles.exampleSite}><header><strong>NORTH / STAR</strong><span>Work · About · Contact</span></header><h3>Start something<br />worth talking about.</h3><p>A bold, minimal website with its own visual language.</p></div>
                  <div className={styles.foreignForm}><small>POWERED BY ANOTHER FORM TOOL</small><b>Contact us</b><label>Name<i /></label><label>Email<i /></label><button>Submit</button></div>
                  <div className={styles.problemBadge}>Looks like a different website</div>
                </motion.div>
              ) : null}

              {active === 1 ? (
                <motion.div animate={{ opacity: 1, y: 0 }} className={styles.customState} exit={{ opacity: 0, y: 8 }} initial={{ opacity: 0, y: 8 }} key="custom" transition={transition}>
                  <div className={styles.customFormCard}><small>YOUR CUSTOM FORM</small><b>Perfect design</b><span>Every field matches your page</span></div>
                  <div className={styles.systemOrbit}><span>Save responses</span><span>Stop spam</span><span>Store uploads</span><span>Send emails</span><span>Build an inbox</span><span>Export data</span><i>+</i></div>
                  <div className={styles.problemBadge}>A form became six new jobs</div>
                </motion.div>
              ) : null}

              {active === 2 ? (
                <motion.div animate={{ opacity: 1, y: 0 }} className={styles.jobingState} exit={{ opacity: 0, y: 8 }} initial={{ opacity: 0, y: 8 }} key="jobing" transition={transition}>
                  <div className={styles.nativePage}><header><strong>NORTH / STAR</strong><span>Work · About · Contact</span></header><div><small>PROJECT ENQUIRY</small><h3>Start something<br />worth talking about.</h3><label>Your email<i /></label><label>What are you building?<i /></label><button>Send project details</button></div></div>
                  <div className={styles.jobingBackend}><Image src="/forms/logo.png" alt="" width={34} height={34} /><div><b>Jobing Forms</b><span>Responses · spam · files · inbox</span></div><i>✓</i></div>
                  <div className={styles.problemBadge}>Native design. Working backend.</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className={styles.positioningVerdict}><span>THE DIFFERENCE</span><TextMorph as="b">{choices[active].verdict}</TextMorph></div>
        </div>
      </div>
    </section>
  );
}
