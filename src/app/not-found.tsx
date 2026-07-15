import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Jobing AI home">
          <Image src="/logo.png" alt="" width={38} height={38} priority />
          <strong>Jobing AI</strong>
        </Link>
        <Link className={styles.dashboard} href="/dashboard">Dashboard</Link>
      </header>

      <section className={styles.stage}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>404 · LOST BETWEEN PROMPT AND PUBLISH</p>
          <h1>This page never<br />made it live.</h1>
          <p>The address may be mistyped, the page may still be a draft, or its owner may have removed it.</p>
          <div className={styles.actions}>
            <Link href="/">Return home <span aria-hidden="true">→</span></Link>
            <Link href="/dashboard/pages">Open my pages</Link>
          </div>
        </div>

        <div className={styles.art} aria-hidden="true">
          <div className={styles.chatTop}><i /><span>AI conversation</span><b>Connected</b></div>
          <div className={styles.message}>Open the page I published yesterday.</div>
          <div className={styles.reply}>
            <div><Image src="/logo.png" alt="" width={27} height={27} /></div>
            <section><b>I can&apos;t find a live page at this address.</b><p>Check your Pages dashboard for the draft or published URL.</p><span>Open Pages dashboard →</span></section>
          </div>
          <div className={styles.status}><i /><span>404</span><strong>Page not found</strong></div>
          <div className={styles.note}>Your work may still be saved</div>
          <svg className={styles.arrow} viewBox="0 0 98 54"><path d="M4 46C25 16 50 7 85 12m0 0-12-8m12 8-10 12" /></svg>
        </div>
      </section>

      <footer className={styles.footer}><span>Jobing AI</span><span>Give your AI the tools to finish the work.</span></footer>
    </main>
  );
}
