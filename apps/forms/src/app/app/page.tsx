import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listFormsForActor } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function FormsDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/forms");

  const forms = await listFormsForActor(userId);

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link className="brand" href="/" aria-label="Jobing Forms home">
          <span className="brand__jobing">Jobing</span>
          <span className="brand__product">Forms</span>
        </Link>
        <nav className="app-nav" aria-label="Forms navigation">
          <Link href="/app" aria-current="page">Forms</Link>
          <Link href="/app/activity">Activity</Link>
          <Link href="/app/system">System</Link>
        </nav>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <UserButton />
        </header>
        <section className="app-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Control plane</p>
              <h1>Your forms</h1>
            </div>
            <a className="button" href={`${process.env.NEXT_PUBLIC_JOBING_SITE_URL || "https://jobing.site"}/connector`}>Connect an AI</a>
          </div>
          <div className="ledger" role="table" aria-label="Forms">
            <div className="ledger-row ledger-row--header" role="row">
              <span role="columnheader">Form</span>
              <span role="columnheader">State</span>
              <span role="columnheader">Updated</span>
            </div>
            {forms.length === 0 ? (
              <div className="empty-state">
                <div>
                  <h2>No forms yet</h2>
                  <p>Ask your connected AI to <code>create a form draft</code>. It will appear here under your Jobing account.</p>
                </div>
              </div>
            ) : forms.map((form) => (
              <Link className="ledger-row" role="row" key={form.id} href={`/app/forms/${form.id}`}>
                <div role="cell">
                  <div className="ledger-title">{form.name}</div>
                  <div className="ledger-meta">{form.id}</div>
                </div>
                <span className="ledger-meta" role="cell">{form.status}</span>
                <time className="ledger-meta" role="cell" dateTime={form.updatedAt}>{new Date(form.updatedAt).toLocaleDateString("en-IN")}</time>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
