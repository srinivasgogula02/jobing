import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { reviewSubmissionAction } from "@/app/app/actions";
import { AppShell } from "@/components/app-shell";
import { FormNav } from "@/components/form-nav";
import { listBlockedSubmissions, listFormsForActor, listSubmissionsPage } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined, fallback = "") { return typeof value === "string" ? value : fallback; }
function pageLink(formId: string, input: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined && value !== "") query.set(key, String(value));
  return `/app/forms/${formId}?${query}`;
}

export default async function ResponsesPage({ params, searchParams }: { params: Promise<{ formId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { userId } = await auth();
  if (!userId) redirect("/forms");
  const { formId } = await params;
  const queryParams = await searchParams;
  const form = (await listFormsForActor(userId)).find((item) => item.id === formId);
  if (!form) notFound();
  const view = one(queryParams.view) === "blocked" ? "blocked" : "responses";
  const stateValue = one(queryParams.state, "inbox");
  const state = stateValue === "spam" || stateValue === "archived" ? stateValue : "inbox";
  const sort = one(queryParams.sort) === "oldest" ? "oldest" : "newest";
  const q = one(queryParams.q).slice(0, 200);
  const page = Math.max(1, Number(one(queryParams.page, "1")) || 1);
  const submissions = view === "responses" ? await listSubmissionsPage({ actorId: userId, formId, query: q, state, sort, page }) : null;
  const blocked = view === "blocked" ? await listBlockedSubmissions({ actorId: userId, formId, page }) : null;

  return <AppShell><section className="app-content"><div className="form-page-head"><Link className="back-link" href="/app">← All forms</Link><FormNav formId={form.id} current="responses" /></div>
    <div className="page-heading"><div><p className="eyebrow">Response inbox</p><h1>{form.name}</h1><p className="page-lede">Find a response, review spam, or export everything for your records.</p></div><div className="heading-actions">{form.status === "published" ? <a className="button" href={`/forms/f/${form.endpointId}`} target="_blank" rel="noreferrer">Open form</a> : <Link className="button" href={`/app/forms/${form.id}/edit`}>Finish draft</Link>}<a className="button button--primary" href={`/forms/api/app/forms/${form.id}/export?state=${state}&q=${encodeURIComponent(q)}&sort=${sort}`}>Export CSV</a></div></div>
    <div className="inbox-tabs"><Link aria-current={view === "responses" && state === "inbox" ? "page" : undefined} href={pageLink(form.id,{state:"inbox"})}>Inbox</Link><Link aria-current={view === "responses" && state === "spam" ? "page" : undefined} href={pageLink(form.id,{state:"spam"})}>Spam</Link><Link aria-current={view === "responses" && state === "archived" ? "page" : undefined} href={pageLink(form.id,{state:"archived"})}>Archived</Link><Link aria-current={view === "blocked" ? "page" : undefined} href={pageLink(form.id,{view:"blocked"})}>Blocked attempts</Link></div>
    {view === "responses" && submissions ? <>
      <form className="inbox-filters" method="get"><input type="hidden" name="state" value={state} /><label><span className="sr-only">Search responses</span><input type="search" name="q" defaultValue={q} placeholder="Search names, email addresses, or answers" /></label><label><span className="sr-only">Sort responses</span><select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><button className="button" type="submit">Search</button></form>
      <p className="result-count">{submissions.total} {state} response{submissions.total === 1 ? "" : "s"}</p>
      <div className="response-list">{submissions.items.length === 0 ? <div className="empty-state"><div><h2>{q ? "No matching responses" : state === "inbox" ? "No responses yet" : `Nothing in ${state}`}</h2><p>{q ? "Try a broader search." : state === "inbox" ? "Share the live form or connect its endpoint to your website. New responses appear here." : "Responses you move here will stay out of the inbox."}</p></div></div> : submissions.items.map((submission) => <article className="response-card" key={submission.id}><div className="response-card__head"><time dateTime={submission.receivedAt}>{new Date(submission.receivedAt).toLocaleString("en-IN")}</time><code>{submission.id.slice(0,8)}</code></div><dl>{Object.entries(submission.values).map(([key,value]) => <div key={key}><dt>{key.replaceAll("_"," ")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd></div>)}</dl>{submission.files.length ? <div className="response-files"><strong>Private files</strong>{submission.files.map((file) => <a key={file.id} href={`/forms/api/app/files/${file.id}`}>{file.fileName}<span>{Math.ceil(file.byteSize/1024)} KB · {file.scanStatus === "unscanned" ? "not malware-scanned" : file.scanStatus}</span></a>)}</div> : null}<div className="response-actions">{state !== "inbox" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"inbox"})}><button type="submit">Move to inbox</button></form> : null}{state !== "spam" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"spam"})}><button type="submit">Mark as spam</button></form> : null}{state !== "archived" ? <form action={reviewSubmissionAction.bind(null,{formId,submissionId:submission.id,state:"archived"})}><button type="submit">Archive</button></form> : null}</div></article>)}</div>
      <nav className="pagination" aria-label="Response pages"><Link aria-disabled={submissions.page <= 1} href={pageLink(form.id,{state,q,sort,page:Math.max(1,submissions.page-1)})}>Previous</Link><span>Page {submissions.page} of {submissions.pages}</span><Link aria-disabled={submissions.page >= submissions.pages} href={pageLink(form.id,{state,q,sort,page:Math.min(submissions.pages,submissions.page+1)})}>Next</Link></nav>
    </> : null}
    {view === "blocked" && blocked ? <><div className="blocked-explainer"><strong>Blocked attempts contain no submitted answers.</strong><p>Jobing stores only the reason, origin, time, and an anonymous count so you can spot abuse without keeping rejected personal data.</p></div><p className="result-count">{blocked.total} grouped blocked event{blocked.total === 1 ? "" : "s"}</p><div className="blocked-list">{blocked.items.length === 0 ? <div className="empty-state"><div><h2>No blocked attempts</h2><p>That is good. Rejected spam and security events will appear here.</p></div></div> : blocked.items.map((item) => <article key={item.id}><div><strong>{item.reason.replaceAll("_"," ")}</strong><span>{item.origin || "Direct or hosted form"}</span></div><div><b>{item.eventCount}×</b><time dateTime={item.lastOccurredAt}>{new Date(item.lastOccurredAt).toLocaleString("en-IN")}</time></div></article>)}</div><nav className="pagination" aria-label="Blocked event pages"><Link aria-disabled={blocked.page <= 1} href={pageLink(form.id,{view:"blocked",page:Math.max(1,blocked.page-1)})}>Previous</Link><span>Page {blocked.page} of {blocked.pages}</span><Link aria-disabled={blocked.page >= blocked.pages} href={pageLink(form.id,{view:"blocked",page:Math.min(blocked.pages,blocked.page+1)})}>Next</Link></nav></> : null}
  </section></AppShell>;
}
