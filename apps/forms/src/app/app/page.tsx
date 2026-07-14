import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createFormAction, duplicateFormAction } from "@/app/app/actions";
import { AppShell } from "@/components/app-shell";
import { listFormsForActor } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function FormsDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/forms");
  const forms = await listFormsForActor(userId);
  const published = forms.filter((form) => form.status === "published").length;

  return <AppShell><section className="app-content">
    <div className="page-heading">
      <div><p className="eyebrow">Forms workspace</p><h1>Forms that fit your business.</h1><p className="page-lede">Create the form here or ask your connected AI. Either way, responses land in the same inbox.</p></div>
      <form action={createFormAction}><button className="button button--primary" type="submit">Create a form</button></form>
    </div>
    <div className="summary-strip" aria-label="Workspace summary"><span><strong>{forms.length}</strong> total forms</span><span><strong>{published}</strong> published</span><span><strong>{forms.length - published}</strong> drafts</span></div>
    {forms.length === 0 ? <div className="onboarding-empty">
      <div className="onboarding-empty__demo" aria-hidden="true"><span>01</span><strong>What should we call you?</strong><i /><span>02</span><strong>Where can we reply?</strong><i /><b>Send response</b></div>
      <div><p className="eyebrow">Start without code</p><h2>Build your first form in a few minutes.</h2><p>Add fields, change the design, publish it, and copy the exact HTML your website needs.</p><form action={createFormAction}><button className="button button--primary" type="submit">Create my first form</button></form></div>
    </div> : <div className="form-cards">
      {forms.map((form) => <article className="form-card" key={form.id}>
        <div className="form-card__top"><span className={`status-chip status-chip--${form.status}`}>{form.status}</span><time dateTime={form.updatedAt}>{new Date(form.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></div>
        <h2>{form.name}</h2><p>{form.definition.description || "No description yet."}</p>
        <div className="form-card__meta"><span>{form.definition.fields.filter((field) => !field.hidden).length} fields</span><span>Version {form.publishedVersion || "draft"}</span></div>
        <div className="form-card__actions"><Link className="button button--primary" href={`/app/forms/${form.id}`}>View responses</Link><Link className="button" href={`/app/forms/${form.id}/edit`}>Edit</Link><form action={duplicateFormAction.bind(null, form.id)}><button className="icon-button" type="submit" aria-label={`Duplicate ${form.name}`}>Duplicate</button></form></div>
      </article>)}
    </div>}
  </section></AppShell>;
}
