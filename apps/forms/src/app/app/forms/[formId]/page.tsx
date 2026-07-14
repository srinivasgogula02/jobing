import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listFormsForActor, listSubmissionsForActor } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/forms");
  const { formId } = await params;
  const form = (await listFormsForActor(userId)).find((item) => item.id === formId);
  if (!form) notFound();
  const submissions = await listSubmissionsForActor(userId, formId);
  return <div className="app-layout">
    <aside className="app-sidebar"><Link className="brand" href="/" aria-label="Jobing Forms home"><span className="brand__jobing">Jobing</span><span className="brand__product">Forms</span></Link><nav className="app-nav" aria-label="Forms navigation"><Link href="/app" aria-current="page">Forms</Link><Link href="/app/activity">Activity</Link><Link href="/app/system">System</Link></nav></aside>
    <main className="app-main"><header className="app-topbar"><UserButton /></header><section className="app-content">
      <Link className="back-link" href="/app">← All forms</Link><div className="page-heading"><div><p className="eyebrow">Response inbox</p><h1>{form.name}</h1><p className="response-count">{submissions.length} recent response{submissions.length === 1 ? "" : "s"}</p></div><a className="button" href={`/f/${form.endpointId}`} target="_blank" rel="noreferrer">Open form</a></div>
      <div className="response-list">{submissions.length === 0 ? <div className="empty-state"><div><h2>No responses yet</h2><p>Share the hosted form or use its endpoint on your website. New responses will appear here.</p></div></div> : submissions.map((submission) => <article className="response-card" key={submission.id}><div className="response-card__head"><time dateTime={submission.receivedAt}>{new Date(submission.receivedAt).toLocaleString("en-IN")}</time><code>{submission.id.slice(0, 8)}</code></div><dl>{Object.entries(submission.values).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd></div>)}</dl></article>)}</div>
    </section></main>
  </div>;
}
