import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CopyBox } from "@/components/copy-box";
import { FormNav } from "@/components/form-nav";
import { htmlSnippet, reactSnippet } from "@/lib/builder-utils";
import { listFormsForActor } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function ShareFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/forms");
  const { formId } = await params;
  const form = (await listFormsForActor(userId)).find((item) => item.id === formId);
  if (!form) notFound();
  const base = process.env.NEXT_PUBLIC_FORMS_API_URL || "https://forms.jobing.site/forms";
  const endpoint = `${base}/f/${form.endpointId}`;
  return <AppShell><section className="app-content"><div className="form-page-head"><Link href="/app" className="back-link">← All forms</Link><FormNav formId={form.id} current="share" /></div>
    <div className="page-heading"><div><p className="eyebrow">Share and connect</p><h1>{form.name}</h1><p className="page-lede">Use the hosted form as-is, or keep your own design and send its data to the endpoint.</p></div>{form.status === "published" ? <a className="button button--primary" href={endpoint} target="_blank" rel="noreferrer">Open live form</a> : <Link className="button button--primary" href={`/app/forms/${form.id}/edit`}>Publish to get a URL</Link>}</div>
    {form.status !== "published" ? <div className="draft-warning"><strong>This is still a private draft.</strong><p>Draft previews have no public link. Publish it when you are ready, then this page will show the live endpoint and copy-ready code.</p></div> : <div className="share-grid">
      <section><p className="eyebrow">Hosted form</p><h2>Send this link.</h2><p>Jobing hosts a responsive version using the design from your builder.</p><CopyBox label="Live form URL" value={endpoint} /></section>
      <section><p className="eyebrow">Custom website</p><h2>Keep every pixel yours.</h2><p>Change the fields and CSS in your page. Only the action URL needs to stay the same.</p><CopyBox label="Form endpoint" value={endpoint} /><CopyBox label="Plain HTML" value={htmlSnippet(endpoint)} code /><CopyBox label="React" value={reactSnippet(endpoint)} code /></section>
    </div>}
  </section></AppShell>;
}
