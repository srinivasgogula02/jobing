// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout.tsx  ·  SERVER component
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { DashboardShell } from "./DashboardShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  fullBleed?: boolean;
}

export function DashboardLayout({ children, breadcrumbs, fullBleed }: DashboardLayoutProps) {
  return (
    <DashboardShell breadcrumbs={breadcrumbs} fullBleed={fullBleed}>
      {children}
    </DashboardShell>
  );
}
