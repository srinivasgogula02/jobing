"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Settings, CreditCard, LogOut,
  ChevronDown, ChevronUp,
  LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  PlugZap,
  Globe2,
  FormInput,
  BookOpen,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { DOCS_URL } from "@/lib/app-navigation";

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Pages", href: "/dashboard/pages", icon: Globe2 },
    { name: "Forms", href: "/dashboard/forms", icon: FormInput },
    { name: "AI connector", href: "/connector/manage", icon: PlugZap },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-[#e5e5e5] text-[#6b7280] transition-all duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Header: Logo + Collapse button — flush to top, matched h-14 */}
      <div className={`flex items-center h-14 shrink-0 border-b border-[#f0f0f0] px-4 ${collapsed ? "justify-center px-2" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Jobing AI"
              width={26}
              height={26}
              className="h-6 w-6 rounded-md object-contain"
              priority
            />
            <span className="text-sm font-bold tracking-[-.02em] text-[#151914]">Jobing AI</span>
          </Link>
        )}
        {/* Collapse toggle — desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#fafafa] text-[#9ca3af] hover:text-[#1a1a1a] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 space-y-0.5 mt-2 ${collapsed ? "px-1.5" : "px-4"}`}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (collapsed) {
            const collapsedClass = `flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all focus:outline-none ${
                  isActive
                    ? "bg-[#C1FF00]/15 text-[#1a1a1a]"
                    : "hover:bg-[#fafafa] hover:text-[#1a1a1a]"
                }`;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.name}
                className={collapsedClass}
              >
                <item.icon size={17} />
              </Link>
            );
          }

          const expandedClass = `flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all focus:outline-none text-left ${
                isActive
                  ? "bg-[#C1FF00]/15 text-[#1a1a1a] font-semibold"
                  : "hover:bg-[#fafafa] hover:text-[#1a1a1a]"
              }`;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={expandedClass}
            >
              <item.icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className={`space-y-0.5 mt-4 ${collapsed ? "px-1.5" : "px-4"}`}>
        <Link
          href={DOCS_URL}
          prefetch={false}
          onClick={onClose}
          title="Help & docs"
          className={collapsed
            ? "flex items-center justify-center w-9 h-9 mx-auto rounded-lg hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all"
            : "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all"}
        >
          <BookOpen size={collapsed ? 17 : 16} />
          {!collapsed && "Help & docs"}
        </Link>
        {collapsed ? (
          <button
            title="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-center w-9 h-9 mx-auto rounded-lg hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all"
          >
            <Settings size={17} />
          </button>
        ) : (
          <>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} />
                Settings
              </div>
              {settingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {settingsOpen && (
              <div className="pl-8 pr-3 py-1 space-y-0.5 text-[13px]">
                <Link
                  href="/billing"
                  onClick={onClose}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-colors"
                >
                  <CreditCard size={14} /> Subscription
                </Link>
                <SignOutButton>
                  <button className="flex w-full items-center gap-2 py-1.5 px-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-left">
                    <LogOut size={14} /> Logout
                  </button>
                </SignOutButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legal — only when expanded */}
      {!collapsed && (
        <div className="mt-auto pt-6 border-t border-[#f0f0f0] flex flex-col gap-1 px-7 pb-2">
          <Link
            href="/about"
            onClick={onClose}
            className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              pathname === "/about" ? "text-[#1a1a1a]" : "text-[#9ca3af] hover:text-[#1a1a1a]"
            }`}
          >
            About Us
          </Link>
          <Link
            href="/feedback"
            onClick={onClose}
            className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              pathname === "/feedback" ? "text-[#1a1a1a]" : "text-[#9ca3af] hover:text-[#1a1a1a]"
            }`}
          >
            Feedback
          </Link>
          <Link
            href="/privacy"
            onClick={onClose}
            className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              pathname === "/privacy" ? "text-[#1a1a1a]" : "text-[#9ca3af] hover:text-[#1a1a1a]"
            }`}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            onClick={onClose}
            className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              pathname === "/terms" ? "text-[#1a1a1a]" : "text-[#9ca3af] hover:text-[#1a1a1a]"
            }`}
          >
            Terms & Conditions
          </Link>
          <p className="text-[10px] text-[#d1d5db] font-medium mt-3">
            © 2026 Jobing AI. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
}
