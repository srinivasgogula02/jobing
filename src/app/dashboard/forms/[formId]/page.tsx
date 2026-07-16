import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { reviewSubmissionAction } from "@/app/app/actions";
import { FormNav } from "@/components/forms/FormNav";
import { dashboardFormsActor, getDashboardForm } from "@/lib/dashboard-forms";
import { listConnectorFormResponses } from "@/lib/forms-service";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function pageLink(formId: string, input: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined && value !== "") query.set(key, String(value));
  return `/dashboard/forms/${formId}?${query}`;
}

export default async function ResponsesPage({ params, searchParams }: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const { formId } = await params;
  const queryParams = await searchParams;
  const form = await getDashboardForm(userId, formId);
  if (!form) notFound();
  const stateValue = one(queryParams.state, "inbox");
  const state = stateValue === "spam" || stateValue === "archived" ? stateValue : "inbox";
  const sort = one(queryParams.sort) === "oldest" ? "oldest" : "newest";
  const q = one(queryParams.q).slice(0, 200);
  const page = Math.max(1, Number(one(queryParams.page, "1")) || 1);
  const submissions = await listConnectorFormResponses(dashboardFormsActor(userId), formId, { query: q, state, sort, page, pageSize: 20 });
  const endpoint = `https://forms.jobing.site/forms/f/${form.endpointId}`;

  return <div className="forms-workspace"><section className="app-content"><div className="form-page-head"><Link className="back-link" href="/dashboard/forms">← All forms</Link><FormNav formId={form.id} current="responses" /></div>
    <div className="page-heading"><div><p className="eyebrow">Response inbox</p><h1>{form.name}</h1><p className="page-lede">Find a response, organize follow-up, or export the answers available on your plan.</p></div><div className="heading-actions">{form.status === "published" ? <a className="button" href={endpoint} target="_blank" rel="noreferrer">Open form</a> : <Link className="button" href={`/dashboard/forms/${form.id}/edit`}>Finish draft</Link>}<a className="button button--primary" href={`/forms/api/app/forms/${form.id}/export?state=${state}&q=${encodeURIComponent(q)}&sort=${sort}`}>Export visible responses</a></div></div>

    {submissions.hiddenTotal > 0 ? <aside className="response-limit-notice" role="status">
      <div><p className="eyebrow">Nothing was lost</p><strong>{submissions.hiddenTotal} response{submissions.hiddenTotal === 1 ? " is" : "s are"} saved and waiting.</strong><p>Your {submissions.planKey === "free" ? "free plan" : "current plan"} shows the first {submissions.visibilityLimit?.toLocaleString() ?? "unlimited"} responses each month. New responses keep arriving even after that.</p></div>
      <Link className="button button--primary" href="/pricing?reason=response_limit">Unlock every response</Link>
    </aside> : submissions.visibilityLimit !== null ? <p className="response-allowance-note">Your plan includes {submissions.visibilityLimit.toLocaleString()} visible responses each month. Valid responses continue saving after the limit.</p> : null}

    <div className="inbox-tabs"><Link aria-current={state === "inbox" ? "page" : undefined} href={pageLink(form.id,{state:"inbox"})}>Inbox</Link><Link aria-current={state === "spam" ? "page" : undefined} href={pageLink(form.id,{state:"spam"})}>Spam</Link><Link aria-current={state === "archived" ? "page" : undefined} href={pageLink(form.id,{state:"archived"})}>Archived</Link></div>
    <form className="inbox-filters" method="get"><input type="hidden" name="state" value={state} /><label><span className="sr-only">Search responses</span><input type="search" name="q" defaultValue={q} placeholder="Search visible responses" /></label><label><span className="sr-only">Sort responses</span><select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><button className="button" type="submit">Search</button></form>
    <p className="result-count">{submissions.total} visible {state} response{submissions.total === 1 ? "" : "s"}</p>
    <div className="response-list">{submissions.items.length === 0 ? <div className="empty-state"><div><h2>{q ? "No matching responses" : state === "inbox" ? "No visible responses yet" : `Nothing in ${state}`}</h2><p>{q ? "Try a broader search." : state === "inbox" ? "Share the live form or connect its endpoint to your website. New responses appear here." : "Responses you move here will stay out of the inbox."}</p></div></div> : submissions.items.map((submission) => <article className="response-card" key={submission.id}><div className="response-card__head"><time dateTime={submission.receivedAt}>{new Date(submission.receivedAt).toLocaleString("en-IN")}</time><code>{submission.id.slice(0,8)}</code></div><dl>{Object.entries(submission.values).map(([key,value]) => <div key={key}><dt>{key.replaceAll("_"," ")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd></div>)}</dl>{submission.files.length ? <div className="response-files"><strong>Private files</strong>{submission.files.map((file) => <a key={file.id} href={`/forms/api/app/files/${file.id}`}>{file.fileName}<span>{Math.ceil(file.byteSize/1024)} KB · {file.scanStatus === "unscanned" ? "not malware-scanned" : file.scanStatus}</span></a>)}</div> : null}<div className="response-actions">{state !== "inbox" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"inbox"})}><button type="submit">Move to inbox</button></form> : null}{state !== "spam" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"spam"})}><button type="submit">Mark as spam</button></form> : null}{state !== "archived" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"archived"})}><button type="submit">Archive</button></form> : null}</div></article>)}</div>
    <nav className="pagination" aria-label="Response pages"><Link aria-disabled={submissions.page <= 1} href={pageLink(form.id,{state,q,sort,page:Math.max(1,submissions.page-1)})}>Previous</Link><span>Page {submissions.page} of {submissions.pages}</span><Link aria-disabled={submissions.page >= submissions.pages} href={pageLink(form.id,{state,q,sort,page:Math.min(submissions.pages,submissions.page+1)})}>Next</Link></nav>
  </section></div>;
}
