import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FormEditor } from "@/components/form-editor";
import { FormNav } from "@/components/form-nav";
import { listFormsForActor } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/forms");
  const { formId } = await params;
  const form = (await listFormsForActor(userId)).find((item) => item.id === formId);
  if (!form) notFound();
  return <AppShell><section className="builder-page"><div className="form-page-head"><Link href="/app" className="back-link">← All forms</Link><FormNav formId={form.id} current="build" /></div><FormEditor form={form} /></section></AppShell>;
}
