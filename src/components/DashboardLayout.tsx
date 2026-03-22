// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout.tsx  ·  SERVER component — fetches credits then renders shell
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { getUserCredits } from "@/app/actions/user";
import { DashboardShell } from "./DashboardShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const credits = await getUserCredits();

  return (
    <DashboardShell credits={credits}>
      {children}
    </DashboardShell>
  );
}
