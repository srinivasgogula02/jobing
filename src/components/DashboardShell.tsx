// ─────────────────────────────────────────────────────────────────────────────
// DashboardShell.tsx  ·  client component (interactive header only)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { UserButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
  credits?: number;
}

export function DashboardShell({ children, credits }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full bg-[#fafafa] text-[#1a1a1a] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 flex items-center justify-end gap-3 px-6 border-b border-[#e5e5e5] shrink-0 bg-white">
          {typeof credits === "number" && (
            <Link 
              href="/billing" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Zap size={14} className="text-[#8bb800] fill-[#8bb800]" />
              <span>{credits.toLocaleString()}</span>
            </Link>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          >
            {/* Custom menu items inside the Clerk dropdown */}
            <UserButton.MenuItems>
              <UserButton.Link
                label="Subscription"
                labelIcon={<Zap size={14} />}
                href="/billing"
              />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </header>
        <main className="flex-1 overflow-auto p-6 slim-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
