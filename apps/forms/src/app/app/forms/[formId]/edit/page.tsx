import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyEditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  redirect(`https://jobing.site/dashboard/forms/${formId}/edit`);
}
