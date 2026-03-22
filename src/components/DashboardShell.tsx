// ─────────────────────────────────────────────────────────────────────────────
// DashboardShell.tsx  ·  client component (interactive header only)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { UserButton } from "@clerk/nextjs";
import { Zap, Menu } from "lucide-react";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
  credits?: number;
}

export function DashboardShell({ children, credits }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-[#fafafa] text-[#1a1a1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0 relative z-40">
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
        <header className="h-14 flex items-center justify-between md:justify-end gap-3 px-4 md:px-6 border-b border-[#e5e5e5] shrink-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#1a1a1a] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="md:hidden flex items-center px-1 py-1">
              <span className="font-bold text-[14px] text-[#1a1a1a] tracking-tight">Jobing</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>
        <main className="flex-1 overflow-auto p-0 md:p-6 slim-scrollbar">
          {children}
        </main>
      </div>
      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] flex md:hidden">
          <div 
             className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm transition-opacity" 
             onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-56 h-full bg-white animate-in slide-in-from-left shadow-2xl">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
