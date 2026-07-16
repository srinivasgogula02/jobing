import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormEditor } from "@/components/forms/FormEditor";
import { FormNav } from "@/components/forms/FormNav";
import { getDashboardForm } from "@/lib/dashboard-forms";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const { formId } = await params;
  const form = await getDashboardForm(userId, formId);
  if (!form) notFound();
  return <div className="forms-workspace"><section className="builder-page"><div className="form-page-head"><Link href="/dashboard/forms" className="back-link">← All forms</Link><FormNav formId={form.id} current="build" /></div><FormEditor form={form} /></section></div>;
}
