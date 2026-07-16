import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createFormAction, duplicateFormAction } from "@/app/app/actions";
import { listDashboardForms } from "@/lib/dashboard-forms";

export const dynamic = "force-dynamic";

export default async function FormsDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const forms = await listDashboardForms(userId);
  const published = forms.filter((form) => form.status === "published").length;

  return <div className="forms-workspace"><section className="app-content">
    <div className="page-heading">
      <div><p className="eyebrow">Forms workspace</p><h1>Forms that fit your business.</h1><p className="page-lede">Create a form here or ask your connected AI. Every valid response lands safely in the same inbox.</p></div>
      <form action={createFormAction}><button className="button button--primary" type="submit">Create a form</button></form>
    </div>
    <div className="summary-strip" aria-label="Workspace summary"><span><strong>{forms.length}</strong> total forms</span><span><strong>{published}</strong> published</span><span><strong>{forms.length - published}</strong> drafts</span></div>
    {forms.length === 0 ? <div className="onboarding-empty">
      <div className="onboarding-empty__demo" aria-hidden="true"><span>01</span><strong>What should we call you?</strong><i /><span>02</span><strong>Where can we reply?</strong><i /><b>Send response</b></div>
      <div><p className="eyebrow">Start without code</p><h2>Build your first form in a few minutes.</h2><p>Add questions, match your brand, publish it, and copy the exact HTML your website needs.</p><form action={createFormAction}><button className="button button--primary" type="submit">Create my first form</button></form></div>
    </div> : <div className="form-cards">
      {forms.map((form) => <article className="form-card" key={form.id}>
        <div className="form-card__top"><span className={`status-chip status-chip--${form.status}`}>{form.status}</span><time dateTime={form.updatedAt}>{new Date(form.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></div>
        <h2>{form.name}</h2><p>{form.description || "No description yet."}</p>
        <div className="form-card__meta"><span>{form.fieldCount} questions</span><span>{form.status === "published" ? `Live version ${form.publishedVersion}` : "Private draft"}</span></div>
        <div className="form-card__actions"><Link className="button button--primary" href={`/dashboard/forms/${form.id}`}>View responses</Link><Link className="button" href={`/dashboard/forms/${form.id}/edit`}>Edit form</Link><form action={duplicateFormAction.bind(null, form.id)}><button className="icon-button" type="submit" aria-label={`Duplicate ${form.name}`}>Duplicate</button></form></div>
      </article>)}
    </div>}
  </section></div>;
}
