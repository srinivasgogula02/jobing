import type { Metadata } from "next";
import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { getFormsSignInRedirectProps } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Jobing Forms — Your AI makes the form. You get the leads.",
  description: "Native HTML forms for AI-made pages. Five published forms and one response inbox.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Your AI makes the form. You get the leads.",
    description: "Keep your HTML. Jobing saves every response.",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

function PrimaryAction({ className = "marketing-cta" }: { className?: string }) {
  const signInRedirectProps = getFormsSignInRedirectProps();
  return (
    <>
      <Show when="signed-in"><Link className={className} href="/app">Open my response inbox <span>→</span></Link></Show>
      <Show when="signed-out"><SignInButton {...signInRedirectProps}><button className={className} type="button">Connect Jobing Forms <span>→</span></button></SignInButton></Show>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="marketing-logo" href="/" aria-label="Jobing Forms home"><b>Jobing</b><span>Forms</span></Link>
        <nav aria-label="Main navigation"><a href="#product">Product</a><a href="https://jobing.site/pricing">Pricing</a><PrimaryAction className="marketing-header-cta" /></nav>
      </header>

      <section className="marketing-hero">
        <div>
          <p className="marketing-kicker">The form backend built for AI-made pages</p>
          <h1>Your AI makes the form.<br /><em>You get the leads.</em></h1>
          <p className="marketing-lede">Ask ChatGPT or Claude for a page. Jobing creates the form endpoint, gives your AI native HTML, and puts every response in one inbox.</p>
          <PrimaryAction />
          <small>5 published forms · Native HTML · No iframe</small>
        </div>
        <div className="forms-product" id="product">
          <div className="forms-product__top"><span>CONTACT FORM</span><b>LIVE</b></div>
          <div className="forms-product__body">
            <div className="mini-form">
              <label>Name<input readOnly value="Priya Rao" /></label>
              <label>Work email<input readOnly value="priya@studio.co" /></label>
              <label>What do you need?<textarea readOnly value="A landing page for our launch." /></label>
              <button tabIndex={-1}>Send my request</button>
            </div>
            <div className="response-inbox">
              <p>RESPONSE INBOX</p>
              <strong>3 new</strong>
              <div><b>Priya Rao</b><span>12 sec ago</span><small>A landing page for our launch.</small></div>
              <div><b>Arun Mehta</b><span>4 min ago</span><small>Need an AI audit for our team.</small></div>
              <div><b>Maya Studio</b><span>18 min ago</span><small>Looking for a project quote.</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-pain">
        <p className="marketing-kicker">You should not need four products for one contact form.</p>
        <h2>The page looked finished.<br />Then the form did nothing.</h2>
        <div><s>Embed an iframe</s><s>Open another dashboard</s><s>Patch a redirect</s><b>Use the HTML your AI already wrote.</b></div>
      </section>

      <section className="marketing-code">
        <div>
          <p className="marketing-kicker">Formspree-simple. Built into Jobing.</p>
          <h2>Keep your design.<br />Change one action.</h2>
          <p>The endpoint receives the response. Your HTML controls everything people see.</p>
        </div>
        <pre><code>{`<form method="POST"\n  action="https://forms.jobing.site/forms/f/frm_contact">\n\n  <input name="email" type="email" required>\n  <textarea name="message"></textarea>\n  <button>Send my request</button>\n</form>`}</code><span>201 · RESPONSE SAVED</span></pre>
      </section>

      <section className="marketing-numbers">
        <p className="marketing-kicker">The limits are clear</p>
        <h2>Five live forms.<br />Zero mystery.</h2>
        <dl><div><dt>5</dt><dd>published forms</dd></div><div><dt>50</dt><dd>accepted responses</dd></div><div><dt>256 KB</dt><dd>per submission</dd></div></dl>
      </section>

      <section className="marketing-prompts">
        <p className="marketing-kicker">Say it the way you already say it</p>
        <h2>Prompts in. Responses out.</h2>
        <div>
          <blockquote>“Create a waitlist page and save every signup.”</blockquote>
          <blockquote>“Add a project enquiry form to this portfolio.”</blockquote>
          <blockquote>“Build a customer survey with five questions.”</blockquote>
        </div>
        <p className="prompt-disclosure">Example prompts, not customer testimonials.</p>
      </section>

      <section className="marketing-final">
        <p>YOUR FORM IS NOT A RECTANGLE IN AN IFRAME.</p>
        <h2>It&apos;s your HTML.<br /><em>We catch the answers.</em></h2>
        <PrimaryAction />
      </section>

      <footer className="marketing-footer"><span>Jobing Forms · forms.jobing.site</span><b>Make the page. Catch the answer.</b></footer>
    </main>
  );
}
