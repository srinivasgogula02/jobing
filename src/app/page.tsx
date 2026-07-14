import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Jobing AI — Turn an idea into a live business website",
  description: "Tell your AI what your business needs. Jobing AI publishes the website and collects every customer enquiry.",
  alternates: { canonical: "/" },
};

const cta = "Build my website";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="Jobing home">
          <Image src="/logo.png" alt="" width={46} height={46} priority />
          <span>Jobing AI</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#demo">Product</a>
          <Link href="/pricing">Pricing</Link>
          <Link className={styles.headerCta} href="/connector">{cta}</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>From business idea to live website</p>
          <h1>Tell your AI what you need.<br /><em>Jobing AI makes it real.</em></h1>
          <p className={styles.lede}>Describe your business in ChatGPT or Claude. Get a complete website that is online, ready to share, and able to collect customer enquiries.</p>
          <Link className={styles.cta} href="/connector">{cta} <span aria-hidden>→</span></Link>
          <p className={styles.micro}>Connect once · Ask in plain English · Share your website</p>
        </div>

        <div className={styles.product} id="demo" aria-label="Jobing product demonstration">
          <div className={styles.browserBar}><i /><i /><i /><span>jobing-pages.vercel.app/ai-consultancy</span></div>
          <div className={styles.demoBody}>
            <div className={styles.chatPane}>
              <p className={styles.demoLabel}>CHATGPT + JOBING</p>
              <div className={styles.prompt}>Create a website for my AI consultancy and let people book a call.</div>
              <div className={styles.reply}><span>✓</span> Website is live<br /><span>✓</span> Enquiry form is ready<br /><b>Open your website →</b></div>
            </div>
            <div className={styles.sitePane}>
              <span>AI CONSULTANCY</span>
              <strong>Turn AI into<br />business results.</strong>
              <button type="button" tabIndex={-1}>Book a consultation</button>
            </div>
          </div>
          <div className={styles.resultStrip}><span>One request</span><span>One website</span><span>Ready for customers</span><strong>LIVE</strong></div>
        </div>
      </section>

      <section className={styles.statement}>
        <p>YOU HAVE A BUSINESS TO RUN.</p>
        <h2>Your website should not become another project to manage.</h2>
        <div className={styles.strikeFlow} aria-label="The old workflow">
          <s>Find a developer</s><s>Wait for changes</s><s>Set up hosting</s><s>Fix broken forms</s><b>Describe it. Share it.</b>
        </div>
      </section>

      <section className={styles.outcome}>
        <div className={styles.number}>01</div>
        <div>
          <p className={styles.kicker}>Everything needed to start</p>
          <h2>Go from an idea to a website customers can use.</h2>
        </div>
        <dl>
          <div><dt>1</dt><dd>conversation to create your website</dd></div>
          <div><dt>5</dt><dd>live forms for customer enquiries</dd></div>
          <div><dt>1</dt><dd>inbox for every new lead</dd></div>
        </dl>
      </section>

      <section className={styles.formsReveal}>
        <div>
          <p className={styles.kicker}>Never lose an enquiry</p>
          <h2>Every interested customer lands in one inbox.</h2>
          <p>Add contact, booking, waitlist, or quote forms to your website. When someone responds, their details are waiting for you in Jobing Forms.</p>
        </div>
        <div className={styles.codeWindow}>
          <div><span>NEW ENQUIRY</span><span>JUST NOW</span></div>
          <div className={styles.leadPreview}><span>SR</span><div><strong>Sarah Rao</strong><small>sarah@northstar.co</small><p>We need a new website for our consulting firm.</p></div></div>
          <p><span>●</span> Saved in your Jobing Forms inbox</p>
        </div>
      </section>

      <section className={styles.compare}>
        <p className={styles.kicker}>Less waiting. More selling.</p>
        <h2>One conversation replaces weeks of back and forth.</h2>
        <div className={styles.table} role="table" aria-label="Publishing workflow comparison">
          <div role="row"><span role="columnheader">What you need</span><span role="columnheader">Developer</span><span role="columnheader">Site builder</span><strong role="columnheader">Jobing AI</strong></div>
          <div role="row"><span>Time to first website</span><span>Days or weeks</span><span>Several hours</span><strong>One conversation</strong></div>
          <div role="row"><span>Ask for changes in plain English</span><span>Back and forth</span><span>Edit it yourself</span><strong>Yes</strong></div>
          <div role="row"><span>Collect customer enquiries</span><span>Extra setup</span><span>Depends on plan</span><strong>Included</strong></div>
          <div role="row"><span>Get a link ready to share</span><span>After launch</span><span>After setup</span><strong>From your chat</strong></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>YOUR BUSINESS IDEA IS ENOUGH.</p>
        <h2>Ask for it.<br />Share it.<br />Grow it.</h2>
        <Link className={styles.cta} href="/connector">{cta} <span aria-hidden>→</span></Link>
      </section>

      <footer className={styles.footer}>
        <span>Jobing AI · Websites made through conversation</span>
        <span><b>Your idea deserves a live URL.</b></span>
      </footer>
    </main>
  );
}
