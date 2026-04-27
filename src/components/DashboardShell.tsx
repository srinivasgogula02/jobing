// ─────────────────────────────────────────────────────────────────────────────
// DashboardShell.tsx  ·  client component (interactive header only)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { UserButton, useUser, SignUpButton } from "@clerk/nextjs";
import { Zap, Menu, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  children: React.ReactNode;
  credits?: number;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardShell({ children, credits, breadcrumbs }: DashboardShellProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Helper to format pagename (fallback)
  const getPageName = () => {
    if (pathname === "/") return "";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const defaultPageName = getPageName();

  return (
    <div className="flex h-[100dvh] w-full bg-[#fafafa] text-[#1a1a1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0 relative z-40 transition-all duration-300">
        <Sidebar
          onClose={() => setMobileMenuOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
        <header className="h-14 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-[#e5e5e5] shrink-0 bg-white z-10">
          <div className="flex items-center gap-2 max-w-[50%] md:max-w-[60%]">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#1a1a1a] hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 overflow-hidden flex-nowrap min-w-0">
              <Link href="/create" className="flex items-center shrink-0">
                <span className="font-bold text-[14px] text-[#1a1a1a] tracking-tight hover:text-[#8bb800] transition-colors">Jobing AI</span>
              </Link>
              
              {breadcrumbs && breadcrumbs.length > 0 ? (
                breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-[#e5e5e5] font-light shrink-0">/</span>
                    {crumb.href ? (
                       <Link href={crumb.href} className="text-[14px] text-[#9ca3af] hover:text-[#1a1a1a] font-medium transition-colors shrink-0">
                         {crumb.label}
                       </Link>
                    ) : (
                       <span className="text-[14px] text-[#6b7280] font-medium truncate">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))
              ) : defaultPageName ? (
                <>
                  <span className="text-[#e5e5e5] font-light shrink-0">/</span>
                  <span className="text-[14px] text-[#6b7280] font-medium truncate">{defaultPageName}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 mr-2">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest flex items-center gap-1.5">
                find jobs on <span className="text-[#e5e5e5] font-light">&gt;</span>
              </span>
              <a 
                href="https://www.linkedin.com/jobs/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-bold text-[#6b7280] hover:text-[#1a1a1a] transition-colors uppercase tracking-widest"
              >
                LinkedIn
              </a>
              <a 
                href="https://www.indeed.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-bold text-[#6b7280] hover:text-[#1a1a1a] transition-colors uppercase tracking-widest"
              >
                Indeed
              </a>
              <a 
                href="https://www.naukri.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-bold text-[#6b7280] hover:text-[#1a1a1a] transition-colors uppercase tracking-widest"
              >
                Naukri
              </a>
            </div>
            {isLoaded && isSignedIn ? (
              <>
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
              </>
            ) : isLoaded && !isSignedIn ? (
              <SignUpButton forceRedirectUrl="/tools">
                <button className="btn-primary px-4 py-1.5 text-sm font-bold shadow-lg shadow-[#C1FF00]/20 hover:scale-[1.02] transition-transform flex items-center gap-1.5">
                  Get Started <ArrowRight size={14} />
                </button>
              </SignUpButton>
            ) : null}
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-auto p-0 md:p-6 slim-scrollbar">
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
