import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Jobing — Ask for a website. Get a live URL.",
  description: "Connect Jobing to your AI and turn one conversation into a live page with a working form.",
  alternates: { canonical: "/" },
};

const cta = "Connect Jobing to your AI";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="Jobing home">
          <Image src="/logo.png" alt="" width={46} height={46} priority />
          <span>Jobing</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#demo">Product</a>
          <Link href="/pricing">Pricing</Link>
          <Link className={styles.headerCta} href="/connector">{cta}</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Your AI can talk. Jobing lets it ship.</p>
          <h1>Ask for a website.<br /><em>Get a live URL.</em></h1>
          <p className={styles.lede}>One Jobing connection turns a ChatGPT or Claude conversation into a published page with a working form.</p>
          <Link className={styles.cta} href="/connector">{cta} <span aria-hidden>→</span></Link>
          <p className={styles.micro}>Connect once · Publish from chat · Own the HTML</p>
        </div>

        <div className={styles.product} id="demo" aria-label="Jobing product demonstration">
          <div className={styles.browserBar}><i /><i /><i /><span>jobing-pages.vercel.app/ai-consultancy</span></div>
          <div className={styles.demoBody}>
            <div className={styles.chatPane}>
              <p className={styles.demoLabel}>CHATGPT + JOBING</p>
              <div className={styles.prompt}>Create an AI consultancy page with a contact form.</div>
              <div className={styles.reply}><span>✓</span> Page published<br /><span>✓</span> Form connected<br /><b>View the live page →</b></div>
            </div>
            <div className={styles.sitePane}>
              <span>AI CONSULTANCY</span>
              <strong>Turn AI into<br />business results.</strong>
              <button type="button" tabIndex={-1}>Book a consultation</button>
            </div>
          </div>
          <div className={styles.resultStrip}><span>1 prompt</span><span>1 page</span><span>1 working form</span><strong>LIVE</strong></div>
        </div>
      </section>

      <section className={styles.statement}>
        <p>YOU ALREADY HAVE THE IDEA.</p>
        <h2>Stop moving code from chat to editor to host to form backend.</h2>
        <div className={styles.strikeFlow} aria-label="The old workflow">
          <s>Copy code</s><s>Fix hosting</s><s>Wire forms</s><s>Debug redirects</s><b>Ask. Publish.</b>
        </div>
      </section>

      <section className={styles.outcome}>
        <div className={styles.number}>01</div>
        <div>
          <p className={styles.kicker}>One thing, done end to end</p>
          <h2>Your AI makes the page.<br />Jobing makes it real.</h2>
        </div>
        <dl>
          <div><dt>5</dt><dd>published forms per workspace</dd></div>
          <div><dt>500 KB</dt><dd>of HTML per page</dd></div>
          <div><dt>1</dt><dd>connection to your AI</dd></div>
        </dl>
      </section>

      <section className={styles.formsReveal}>
        <div>
          <p className={styles.kicker}>The part page builders leave unfinished</p>
          <h2>A form that actually receives responses.</h2>
          <p>Your AI gets native HTML, not an iframe. Change every label, field and pixel. Jobing keeps the endpoint working.</p>
        </div>
        <div className={styles.codeWindow}>
          <div><span>contact.html</span><span>POST</span></div>
          <pre><code>{`<form method="POST"\n  action="https://forms.jobing.site/forms/f/frm_contact">\n\n  <input name="email" type="email" required>\n  <button>Send my request</button>\n</form>`}</code></pre>
          <p><span>●</span> Responses arrive in Jobing Forms</p>
        </div>
      </section>

      <section className={styles.compare}>
        <p className={styles.kicker}>Why switch</p>
        <h2>Three jobs. One conversation.</h2>
        <div className={styles.table} role="table" aria-label="Publishing workflow comparison">
          <div role="row"><span role="columnheader">What happens next</span><span role="columnheader">DIY stack</span><span role="columnheader">Site builder</span><strong role="columnheader">Jobing</strong></div>
          <div role="row"><span>Publish from AI chat</span><span>Manual</span><span>Manual</span><strong>Yes</strong></div>
          <div role="row"><span>Own the page HTML</span><span>Yes</span><span>Sometimes</span><strong>Yes</strong></div>
          <div role="row"><span>Receive form responses</span><span>Add a backend</span><span>Platform form</span><strong>Included</strong></div>
          <div role="row"><span>Share one live URL</span><span>After setup</span><span>After setup</span><strong>From chat</strong></div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p>THE NEXT WEBSITE WON&apos;T BE CODED.</p>
        <h2>It&apos;ll be asked for.</h2>
        <Link className={styles.cta} href="/connector">{cta} <span aria-hidden>→</span></Link>
      </section>

      <footer className={styles.footer}>
        <span>Jobing · Built for the AI-made web</span>
        <span>Share this idea: <b>Ask → Publish → Live</b></span>
      </footer>
    </main>
  );
}
