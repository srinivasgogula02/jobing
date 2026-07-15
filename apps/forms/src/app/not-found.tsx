import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function FormsNotFound() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Jobing Forms home">
          <Image src="/forms/logo.png" alt="" width={38} height={38} priority />
          <strong>Jobing Forms</strong>
        </Link>
        <a className={styles.dashboard} href="https://jobing.site/forms/app">Forms dashboard</a>
      </header>

      <section className={styles.stage}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>404 · FORM NOT FOUND</p>
          <h1>This form left<br />no answers behind.</h1>
          <p>The link may be incomplete, the form may still be a draft, or its owner may have removed it.</p>
          <div className={styles.actions}>
            <Link href="/">Explore Jobing Forms <span aria-hidden="true">→</span></Link>
            <a href="https://jobing.site/forms/app">Open my forms</a>
          </div>
        </div>

        <div className={styles.art} aria-hidden="true">
          <div className={styles.browserBar}><i /><i /><i /><span>forms.jobing.site/…</span></div>
          <div className={styles.formPaper}>
            <span className={styles.question}>?</span>
            <b>We looked for this form.</b>
            <p>Nothing is published at this address.</p>
            <div className={styles.field} />
            <div className={styles.fieldShort} />
            <div className={styles.missingLine}><i /><span>missing endpoint</span><i /></div>
          </div>
          <div className={styles.note}>Try the dashboard</div>
          <svg className={styles.arrow} viewBox="0 0 90 48"><path d="M4 42c19-25 38-34 72-31m0 0-12-7m12 7-8 11" /></svg>
        </div>
      </section>

      <footer className={styles.footer}><span>Jobing Forms</span><span>Make the form. Understand the answer.</span></footer>
    </main>
  );
}
