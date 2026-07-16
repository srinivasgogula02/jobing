import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyBox } from "@/components/forms/CopyBox";
import { FormNav } from "@/components/forms/FormNav";
import { getDashboardForm } from "@/lib/dashboard-forms";
import { htmlSnippet, reactSnippet } from "@/lib/builder-utils";

export const dynamic = "force-dynamic";

export default async function ShareFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const { formId } = await params;
  const form = await getDashboardForm(userId, formId);
  if (!form) notFound();
  const endpoint = `https://forms.jobing.site/forms/f/${form.endpointId}`;
  return <div className="forms-workspace"><section className="app-content"><div className="form-page-head"><Link href="/dashboard/forms" className="back-link">← All forms</Link><FormNav formId={form.id} current="share" /></div>
    <div className="page-heading"><div><p className="eyebrow">Share and connect</p><h1>{form.name}</h1><p className="page-lede">Use the hosted form as it is, or keep your website design and send its data to Jobing Forms.</p></div>{form.status === "published" ? <a className="button button--primary" href={endpoint} target="_blank" rel="noreferrer">Open live form</a> : <Link className="button button--primary" href={`/dashboard/forms/${form.id}/edit`}>Publish to get a URL</Link>}</div>
    {form.status !== "published" ? <div className="draft-warning"><strong>This is still a private draft.</strong><p>Publish it when you are ready. Then this page will show the live link and copy-ready code.</p></div> : <div className="share-grid">
      <section><p className="eyebrow">Hosted form</p><h2>Send this link.</h2><p>Jobing hosts a responsive version using the design you chose.</p><CopyBox label="Live form URL" value={endpoint} /></section>
      <section><p className="eyebrow">Your website</p><h2>Keep every pixel yours.</h2><p>Change the labels, layout, and CSS. Keep only the action URL and field names.</p><CopyBox label="Form endpoint" value={endpoint} /><CopyBox label="Plain HTML" value={htmlSnippet(endpoint)} code /><CopyBox label="React" value={reactSnippet(endpoint)} code /></section>
    </div>}
  </section></div>;
}
