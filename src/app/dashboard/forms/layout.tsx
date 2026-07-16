import { DashboardShell } from "@/components/DashboardShell";
import "../../../../apps/forms/src/app/globals.css";

export default function FormsWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell fullBleed breadcrumbs={[{ label: "Forms", href: "/dashboard/forms" }]}>
      {children}
    </DashboardShell>
  );
}
