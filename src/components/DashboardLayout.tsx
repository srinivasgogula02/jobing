// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout.tsx  ·  SERVER component — fetches credits then renders shell
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { getUserCredits } from "@/app/actions/user";
import { DashboardShell } from "./DashboardShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export async function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const credits = await getUserCredits();

  return (
    <DashboardShell credits={credits} breadcrumbs={breadcrumbs}>
      {children}
    </DashboardShell>
  );
}
