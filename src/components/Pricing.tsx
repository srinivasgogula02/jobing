"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { createSubscriptionCheckout } from "@/app/actions/subscription";
import { getBillingPlans } from "@/lib/billing-plans";
import { track } from "@/lib/analytics";
import styles from "./pricing.module.css";

type PricingProps = {
  currentProductId?: string | null;
  limitReached?: boolean;
};

const oldWorkflow = ["Page builder", "Form builder", "Database setup", "Automation setup"] as const;

export function Pricing({ currentProductId, limitReached = false }: PricingProps) {
  const plans = getBillingPlans();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clerk = useClerk();

  async function choosePlan(productId: string, planKey: string) {
    track("pricing_plan_selected", {
      plan: planKey,
      source: limitReached ? "connector_limit" : "pricing_page",
    });

    if (currentProductId) {
      window.location.href = "/billing";
      return;
    }
    if (!productId) {
      setError("Checkout is temporarily unavailable. This plan has not been connected to a payment product.");
      return;
    }
    if (!clerk.user) {
      await clerk.redirectToSignIn({
        signInFallbackRedirectUrl: limitReached ? "/pricing?from=connector-limit" : "/pricing",
        signUpFallbackRedirectUrl: limitReached ? "/pricing?from=connector-limit" : "/pricing",
      });
      return;
    }

    const attemptId = crypto.randomUUID();
    try {
      setLoadingPlan(productId);
      setError(null);
      const result = await createSubscriptionCheckout(productId, attemptId);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
      } else {
        setError("Checkout could not be started. Try again in a moment.");
      }
    } catch {
      setError("Checkout could not be started. Try again in a moment.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        {limitReached ? (
          <div className={styles.limitNotice} role="status">
            <span>Your free workspace is full</span>
            <p>Choose a plan below, complete checkout, then ask your AI to retry.</p>
          </div>
        ) : null}
        <div className={styles.heroCopy}>
          <p>Simple pricing</p>
          <h1>{limitReached ? "Unlock your next form." : "Pay when Jobing AI becomes useful."}</h1>
          <span>Start free with 5 published forms. Upgrade for more forms and responses without rebuilding anything.</span>
        </div>
        <div className={styles.trustLine} aria-label="Purchase information">
          <span><ShieldCheck size={16} /> Secure checkout</span>
          <span>Cancel any time</span>
          <span>Upgrade applies automatically</span>
        </div>
      </section>

      <section className={styles.purchaseSection} aria-label="Paid plans">
        {error ? <div role="alert" className={styles.error}>{error}</div> : null}

        <div className={styles.planGrid}>
          {plans.map((plan) => {
            const isCurrent = currentProductId === plan.productId && Boolean(plan.productId);
            const isLoading = loadingPlan === plan.productId && Boolean(plan.productId);
            const primaryLimit = plan.key === "pro" ? "25 published forms" : "100 published forms";
            const responseLimit = plan.key === "pro" ? "5,000 responses / month" : "25,000 responses / month";
            return (
              <article key={plan.key} className={`${styles.planCard} ${plan.highlighted ? styles.featuredPlan : ""}`}>
                <div className={styles.planTopline}>
                  <span>{plan.highlighted ? "Best place to start" : "For higher volume"}</span>
                  {isCurrent ? <b>Current plan</b> : null}
                </div>
                <div className={styles.planHeading}>
                  <div>
                    <h2>{plan.name}</h2>
                    <p>{plan.description}</p>
                  </div>
                  <div className={styles.price}>
                    <sup>$</sup><strong>{plan.price}</strong><span>/ month</span>
                  </div>
                </div>

                <div className={styles.planOutcome}>
                  <strong>{primaryLimit}</strong>
                  <span>{responseLimit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => choosePlan(plan.productId, plan.key)}
                  disabled={isLoading || isCurrent}
                  className={styles.buyButton}
                >
                  {isLoading ? (
                    <><Loader2 size={17} className={styles.spinner} /> Opening secure checkout</>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : currentProductId ? (
                    <>Manage subscription <ArrowRight size={16} /></>
                  ) : (
                    <>Unlock {primaryLimit} for ${plan.price} <ArrowRight size={16} /></>
                  )}
                </button>

                <ul className={styles.features}>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={15} strokeWidth={3} />{feature}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className={styles.freeNote}>Not at the limit yet? Keep using the free tier. No card is required.</p>
      </section>

      <section className={styles.replacementSection}>
        <div className={styles.replacementCopy}>
          <p>Why the price stays low</p>
          <h2>You are buying the connection, not four more subscriptions.</h2>
          <span>Keep using the AI app you already know. Jobing AI handles the publishing, form backend, and response inbox behind the conversation.</span>
        </div>
        <div className={styles.replacementVisual} aria-label="Jobing AI replaces a multi-tool setup">
          <div className={styles.removedTools}>
            <small>Usually added separately</small>
            {oldWorkflow.map((tool) => <span key={tool}><X size={14} />{tool}</span>)}
          </div>
          <ArrowRight className={styles.replacementArrow} aria-hidden="true" />
          <div className={styles.singleConnector}>
            <small>With Jobing AI</small>
            <strong>One connector</strong>
            <span>One dashboard. One payment.</span>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div>
          <p>Before you pay</p>
          <h2>Three useful answers.</h2>
        </div>
        <div className={styles.faqList}>
          <details open={limitReached}>
            <summary>How quickly can I continue?</summary>
            <p>Checkout returns you to your dashboard. Your new form limits are applied automatically, then your AI can retry the same request.</p>
          </details>
          <details>
            <summary>What happens if I cancel?</summary>
            <p>You keep paid access until the end of the billing period. Your workspace then returns to the free limits, and existing work stays in your dashboard.</p>
          </details>
          <details>
            <summary>Do I need another form or website tool?</summary>
            <p>No. Your AI can publish web pages, create custom native forms, and send responses to your Jobing AI inbox through the same connector.</p>
          </details>
        </div>
      </section>

      <div className={styles.dashboardLink}><Link href="/dashboard">Return to dashboard <ArrowRight size={16} /></Link></div>
    </main>
  );
}
