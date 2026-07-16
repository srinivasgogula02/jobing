import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { FormEditor } from "@/components/forms/FormEditor";
import { FormPageHeader } from "@/components/forms/FormPageHeader";
import { getDashboardForm } from "@/lib/dashboard-forms";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/forms");
  const { formId } = await params;
  const form = await getDashboardForm(userId, formId);
  if (!form) notFound();
  return <div className="forms-workspace"><section className="builder-page"><FormPageHeader formId={form.id} current="build" /><FormEditor form={form} /></section></div>;
}
