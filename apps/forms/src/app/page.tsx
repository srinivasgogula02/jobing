import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { getFormsSignInRedirectProps } from "@/lib/clerk-config";

export default function HomePage() {
  const signInRedirectProps = getFormsSignInRedirectProps();

  return (
    <>
      <header className="site-header">
        <div className="shell site-header__inner">
          <Link className="brand" href="/" aria-label="Jobing Forms home">
            <span className="brand__jobing">Jobing</span>
            <span className="brand__product">Forms</span>
          </Link>
          <Show when="signed-out">
            <SignInButton {...signInRedirectProps}>
              <button className="button" type="button">Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link className="button button--primary" href="/app">Open Forms</Link>
          </Show>
        </div>
      </header>
      <main className="hero">
        <div className="shell hero__grid">
          <section>
            <p className="eyebrow">Phase 01 · Foundation</p>
            <h1>Forms your AI can finish.</h1>
            <p className="hero__lede">
              One Jobing connection creates owned, versioned form drafts in a dedicated Forms service. The public builder and response runtime arrive on this foundation next.
            </p>
            <div className="hero__actions">
              <Show when="signed-in">
                <Link className="button button--primary" href="/app">View your forms</Link>
              </Show>
              <Show when="signed-out">
                <SignInButton {...signInRedirectProps}>
                  <button className="button button--primary" type="button">Continue with Jobing</button>
                </SignInButton>
              </Show>
              <a className="button" href={`${process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site"}/connector`}>Connector details</a>
            </div>
          </section>
          <aside className="phase-rail" aria-label="Foundation status">
            <div className="phase-row" data-state="ready">
              <span className="status-label">Identity</span>
              <strong>Shared Clerk session</strong>
            </div>
            <div className="phase-row" data-state="ready">
              <span className="status-label">Data</span>
              <strong>Isolated Neon database</strong>
            </div>
            <div className="phase-row" data-state="ready">
              <span className="status-label">Control</span>
              <strong>Signed internal API</strong>
            </div>
            <div className="phase-row" data-state="ready">
              <span className="status-label">History</span>
              <strong>Immutable publish versions</strong>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
