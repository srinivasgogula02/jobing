import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FormsDashboardPage() {
  redirect("https://jobing.site/dashboard/forms");
}
