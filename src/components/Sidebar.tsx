"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText, User, Settings, PlusCircle, CreditCard, LogOut,
  ChevronDown, ChevronUp, Briefcase, GraduationCap, Puzzle,
  LayoutGrid, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { name: "Tools", href: "/tools", icon: LayoutGrid },
    { name: "Create Resume", href: "/create", icon: PlusCircle },
    { name: "My Resumes", href: "/resumes", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Blog", href: "/blog", icon: FileText },
    { name: "Jobs", href: "#jobs", icon: Briefcase, comingSoon: true },
    { name: "Upskill", href: "#upskill", icon: GraduationCap, comingSoon: true },
    { name: "Extension", href: "#extension", icon: Puzzle, comingSoon: true },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-[#e5e5e5] text-[#6b7280] transition-all duration-300 ${
        collapsed ? "w-14 p-2" : "w-56 p-4"
      }`}
    >
      {/* Header: Logo + Collapse button — matched to h-14 header bar */}
      <div className={`flex items-center h-14 shrink-0 border-b border-[#f0f0f0] -mx-4 px-4 mb-2 ${collapsed ? "justify-center -mx-2 px-2" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/" onClick={onClose} className="flex items-center">
            <Image
              src="/logo.png"
              alt="Jobing AI"
              width={52}
              height={20}
              className="object-contain h-5 w-auto"
              priority
            />
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
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.comingSoon) {
            if (collapsed) {
              return (
                <div
                  key={item.href}
                  title={item.name}
                  className="flex items-center justify-center w-9 h-9 mx-auto rounded-lg text-[#d1d5db] cursor-not-allowed"
                >
                  <item.icon size={17} />
                </div>
              );
            }
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-[#9ca3af] cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} />
                  {item.name}
                </div>
                <span className="text-[8px] font-black bg-slate-100 text-[#9ca3af] px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-slate-200/50 scale-[0.9] origin-right">
                  Soon
                </span>
              </div>
            );
          }

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.name}
                className={`flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all ${
                  isActive
                    ? "bg-[#C1FF00]/15 text-[#1a1a1a]"
                    : "hover:bg-[#fafafa] hover:text-[#1a1a1a]"
                }`}
              >
                <item.icon size={17} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#C1FF00]/15 text-[#1a1a1a] font-semibold"
                  : "hover:bg-[#fafafa] hover:text-[#1a1a1a]"
              }`}
            >
              <item.icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="space-y-0.5 mt-4">
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
        <div className="mt-auto pt-6 border-t border-[#f0f0f0] flex flex-col gap-1 px-3 pb-2">
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
