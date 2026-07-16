import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, ExternalLink, LayoutList, Table2 } from "lucide-react";
import { reviewSubmissionAction } from "@/app/app/actions";
import { FormPageHeader } from "@/components/forms/FormPageHeader";
import { dashboardFormsActor, getDashboardForm } from "@/lib/dashboard-forms";
import { listConnectorFormResponses } from "@/lib/forms-service";

export const dynamic = "force-dynamic";

type ResponseState = "inbox" | "spam" | "archived";
type ResponseView = "list" | "table";

function one(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function pageLink(formId: string, input: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return `/dashboard/forms/${formId}?${query}`;
}

function fieldLabel(key: string) {
  return key.replaceAll("_", " ");
}

function answerText(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "Not answered";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function SubmissionActions({
  formId,
  submissionId,
  state,
  compact = false,
}: {
  formId: string;
  submissionId: string;
  state: ResponseState;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "response-actions response-actions--compact" : "response-actions"}>
      {state !== "inbox" ? <form action={reviewSubmissionAction.bind(null, { formId, submissionId, state: "inbox" })}><button type="submit">Inbox</button></form> : null}
      {state !== "spam" ? <form action={reviewSubmissionAction.bind(null, { formId, submissionId, state: "spam" })}><button type="submit">Spam</button></form> : null}
      {state !== "archived" ? <form action={reviewSubmissionAction.bind(null, { formId, submissionId, state: "archived" })}><button type="submit">Archive</button></form> : null}
    </div>
  );
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
  const state: ResponseState = stateValue === "spam" || stateValue === "archived" ? stateValue : "inbox";
  const sort = one(queryParams.sort) === "oldest" ? "oldest" : "newest";
  const view: ResponseView = one(queryParams.view) === "table" ? "table" : "list";
  const q = one(queryParams.q).slice(0, 200);
  const page = Math.max(1, Number(one(queryParams.page, "1")) || 1);
  const submissions = await listConnectorFormResponses(dashboardFormsActor(userId), formId, { query: q, state, sort, page, pageSize: 20 });
  const endpoint = `https://forms.jobing.site/forms/f/${form.endpointId}`;
  const tableColumns = Array.from(new Set(submissions.items.flatMap((submission) => Object.keys(submission.values))));
  const commonQuery = { state, q, sort, view };

  return (
    <div className="forms-workspace">
      <section className="app-content responses-page">
        <FormPageHeader formId={form.id} current="responses" />

        <div className="response-heading">
          <div>
            <p className="eyebrow">Responses</p>
            <h1>{form.name}</h1>
            <p><strong>{submissions.total}</strong> visible in {state}</p>
          </div>
          <div className="heading-actions">
            {form.status === "published" ? (
              <a className="button" href={endpoint} target="_blank" rel="noreferrer">Open form <ExternalLink aria-hidden="true" size={15} /></a>
            ) : (
              <Link className="button" href={`/dashboard/forms/${form.id}/edit`}>Finish draft</Link>
            )}
            <a className="button button--primary" href={`/forms/api/app/forms/${form.id}/export?state=${state}&q=${encodeURIComponent(q)}&sort=${sort}`}><Download aria-hidden="true" size={15} /> Export CSV</a>
          </div>
        </div>

        {submissions.hiddenTotal > 0 ? (
          <aside className="response-limit-notice" role="status">
            <div><p className="eyebrow">Nothing was lost</p><strong>{submissions.hiddenTotal} response{submissions.hiddenTotal === 1 ? " is" : "s are"} saved and waiting.</strong><p>Your {submissions.planKey === "free" ? "free plan" : "current plan"} shows the first {submissions.visibilityLimit?.toLocaleString() ?? "unlimited"} responses each month. New responses keep arriving.</p></div>
            <Link className="button button--primary" href="/pricing?reason=response_limit">Unlock all</Link>
          </aside>
        ) : submissions.visibilityLimit !== null ? (
          <p className="response-allowance-note">Showing up to {submissions.visibilityLimit.toLocaleString()} responses each month. New responses keep saving after the limit.</p>
        ) : null}

        <div className="response-organize">
          <div className="inbox-tabs" aria-label="Response folders">
            <Link aria-current={state === "inbox" ? "page" : undefined} href={pageLink(form.id, { ...commonQuery, state: "inbox", page: undefined })}>Inbox</Link>
            <Link aria-current={state === "spam" ? "page" : undefined} href={pageLink(form.id, { ...commonQuery, state: "spam", page: undefined })}>Spam</Link>
            <Link aria-current={state === "archived" ? "page" : undefined} href={pageLink(form.id, { ...commonQuery, state: "archived", page: undefined })}>Archived</Link>
          </div>
          <div className="response-view-switch" aria-label="Response layout">
            <Link aria-current={view === "list" ? "page" : undefined} aria-label="List view" href={pageLink(form.id, { ...commonQuery, view: "list", page: undefined })}><LayoutList aria-hidden="true" size={16} /><span>List</span></Link>
            <Link aria-current={view === "table" ? "page" : undefined} aria-label="Table view" href={pageLink(form.id, { ...commonQuery, view: "table", page: undefined })}><Table2 aria-hidden="true" size={16} /><span>Table</span></Link>
          </div>
        </div>

        <form className="inbox-filters" method="get">
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="view" value={view} />
          <label><span className="sr-only">Search responses</span><input type="search" name="q" defaultValue={q} placeholder="Search responses" /></label>
          <label><span className="sr-only">Sort responses</span><select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          <button className="button" type="submit">Search</button>
        </form>

        {submissions.items.length === 0 ? (
          <div className="empty-state response-empty"><div><h2>{q ? "No matching responses" : state === "inbox" ? "No responses yet" : `Nothing in ${state}`}</h2><p>{q ? "Try a broader search." : state === "inbox" ? "Share the form or connect its endpoint to your website. New responses appear here." : "Responses you move here will stay out of the inbox."}</p></div></div>
        ) : view === "table" ? (
          <div className="response-table-wrap" tabIndex={0} aria-label="Responses table. Scroll horizontally to see every answer.">
            <table className="response-table">
              <thead><tr><th>Received</th>{tableColumns.map((column) => <th key={column}>{fieldLabel(column)}</th>)}<th>Files</th><th>Move to</th></tr></thead>
              <tbody>{submissions.items.map((submission) => (
                <tr key={submission.id}>
                  <td><time dateTime={submission.receivedAt}>{new Date(submission.receivedAt).toLocaleString("en-IN")}</time><code>{submission.id.slice(0, 8)}</code></td>
                  {tableColumns.map((column) => <td key={column}>{answerText(submission.values[column])}</td>)}
                  <td>{submission.files.length ? submission.files.map((file) => <a className="response-table-file" key={file.id} href={`/forms/api/app/files/${file.id}`}>{file.fileName}</a>) : <span className="response-muted">None</span>}</td>
                  <td><SubmissionActions compact formId={formId} submissionId={submission.id} state={state} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="response-list">{submissions.items.map((submission) => (
            <article className="response-card" key={submission.id}>
              <div className="response-card__head"><div><time dateTime={submission.receivedAt}>{new Date(submission.receivedAt).toLocaleString("en-IN")}</time><code>{submission.id.slice(0, 8)}</code></div><SubmissionActions compact formId={formId} submissionId={submission.id} state={state} /></div>
              <dl>{Object.entries(submission.values).map(([key, value]) => <div key={key}><dt>{fieldLabel(key)}</dt><dd>{answerText(value)}</dd></div>)}</dl>
              {submission.files.length ? <div className="response-files"><strong>Files</strong>{submission.files.map((file) => <a key={file.id} href={`/forms/api/app/files/${file.id}`}>{file.fileName}<span>{Math.ceil(file.byteSize / 1024)} KB · {file.scanStatus === "unscanned" ? "not malware-scanned" : file.scanStatus}</span></a>)}</div> : null}
            </article>
          ))}</div>
        )}

        <nav className="pagination" aria-label="Response pages">
          <Link aria-disabled={submissions.page <= 1} href={pageLink(form.id, { ...commonQuery, page: Math.max(1, submissions.page - 1) })}>Previous</Link>
          <span>Page {submissions.page} of {submissions.pages}</span>
          <Link aria-disabled={submissions.page >= submissions.pages} href={pageLink(form.id, { ...commonQuery, page: Math.min(submissions.pages, submissions.page + 1) })}>Next</Link>
        </nav>
      </section>
    </div>
  );
}
