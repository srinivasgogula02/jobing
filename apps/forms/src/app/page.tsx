import type { Metadata } from "next";
import { Show, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
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
      <Show when="signed-in"><Link className={className} href="/app">See my enquiries <span>→</span></Link></Show>
      <Show when="signed-out"><SignInButton {...signInRedirectProps}><button className={className} type="button">Create my first form <span>→</span></button></SignInButton></Show>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="marketing-logo" href="/" aria-label="Jobing AI Forms home"><Image src="/forms/logo.png" alt="" width={32} height={32} priority /><b>Jobing AI</b><span>Forms</span></Link>
        <nav aria-label="Main navigation"><a href="#product">Product</a><a href="https://jobing.site/pricing">Pricing</a><PrimaryAction className="marketing-header-cta" /></nav>
      </header>

      <section className="marketing-hero">
        <div>
          <p className="marketing-kicker">Turn website visitors into customers</p>
          <h1>Put a form on any page.<br /><em>Never miss a customer.</em></h1>
          <p className="marketing-lede">Ask your AI to add a contact, booking, waitlist, or quote form. Every response arrives in one simple inbox.</p>
          <PrimaryAction />
          <small>5 live forms · 1 response inbox · Works with your design</small>
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
        <p className="marketing-kicker">A beautiful website is not enough</p>
        <h2>If customers cannot reach you, the page is not finished.</h2>
        <div><s>Miss an enquiry</s><s>Check another tool</s><s>Fight a broken form</s><b>Keep every response together.</b></div>
      </section>

      <section className="marketing-code">
        <div>
          <p className="marketing-kicker">Your website still looks like yours</p>
          <h2>Any design.<br />One reliable inbox.</h2>
          <p>Your AI can match the form to your brand. Jobing AI quietly saves the answers and shows them in your dashboard.</p>
        </div>
        <pre><code>{`<form method="POST"\n  action="https://forms.jobing.site/forms/f/frm_contact">\n\n  <input name="email" type="email" required>\n  <textarea name="message"></textarea>\n  <button>Send my request</button>\n</form>`}</code><span>201 · RESPONSE SAVED</span></pre>
      </section>

      <section className="marketing-numbers">
        <p className="marketing-kicker">Enough to launch your first ideas</p>
        <h2>Five live forms.<br />One place to follow up.</h2>
        <dl><div><dt>5</dt><dd>forms ready for customers</dd></div><div><dt>50</dt><dd>customer responses included</dd></div><div><dt>1</dt><dd>inbox for every enquiry</dd></div></dl>
      </section>

      <section className="marketing-prompts">
        <p className="marketing-kicker">No form builder to learn</p>
        <h2>Just tell your AI what you want to collect.</h2>
        <div>
          <blockquote>“Create a waitlist page and save every signup.”</blockquote>
          <blockquote>“Add a project enquiry form to this portfolio.”</blockquote>
          <blockquote>“Build a customer survey with five questions.”</blockquote>
        </div>
        <p className="prompt-disclosure">Example prompts, not customer testimonials.</p>
      </section>

      <section className="marketing-final">
        <p>YOUR NEXT CUSTOMER COULD BE ON YOUR PAGE NOW.</p>
        <h2>Give them a simple way to say <em>“I&apos;m interested.”</em></h2>
        <PrimaryAction />
      </section>

      <footer className="marketing-footer"><span>Jobing AI Forms · forms.jobing.site</span><b>Every enquiry deserves a reply.</b></footer>
    </main>
  );
}
