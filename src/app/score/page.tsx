import Link from "next/link";
import s from "./readiness.module.css";

// Landing — first 3 seconds for an anxious final-year who clicked an Instagram
// reel. Fear earned the click; this earns the start. Brand-first, one anchor,
// one CTA (DESIGN.md). UTM/referrer is captured client-side at assessment start.
export default function ScoreLanding() {
  return (
    <main className={s.root}>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": "AI-Readiness Score",
            "description":
              "A 2-minute assessment for final-year engineers to evaluate their AI-readiness, identify skill gaps, and discover their next role path for 2026 fresher hiring.",
            "educationalLevel": "Final year engineering",
            "about": {
              "@type": "Thing",
              "name": "Artificial Intelligence Career Readiness",
            },
            "provider": {
              "@type": "Organization",
              "name": "Jobing AI",
              "url": "https://jobing.site",
            },
            "isAccessibleForFree": true,
            "numberOfQuestions": 9,
          }),
        }}
      />
      <div className={s.shell}>
        <div className={s.heroWrap}>
          <div className={s.topbar}>
            <span className={s.wm}>
              Readiness<em>.</em>
            </span>
            <span className={s.eyebrow}>2 MIN</span>
          </div>

          <div className={s.hero}>
            <p className={s.eyebrow}>For final-year engineers</p>
            <h1 className={s.heroH}>
              Is AI coming
              <br />
              for your
              <br />
              first job?
            </h1>
            <p className={s.heroP}>
              Answer 9 questions. See your AI-Readiness Score, your skill gaps, and your next role
              path for 2026 fresher hiring.
            </p>
            <Link href="/score/assessment" className={`${s.btn} ${s.btnLime}`}>
              Check my score →
            </Link>
            <p className={s.trust}>Built for final-year engineers · No login · 8,200 checked</p>
          </div>
        </div>
      </div>
    </main>
  );
}
