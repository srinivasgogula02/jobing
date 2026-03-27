"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, User, Settings, PlusCircle, CreditCard, LogOut, ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { name: "Create Resume", href: "/create", icon: PlusCircle },
    { name: "My Resumes", href: "/resumes", icon: FileText },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex flex-col w-56 h-full bg-white border-r border-[#e5e5e5] p-4 text-[#6b7280]">
      {/* Logo */}
      <Link href="/" onClick={onClose} className="flex items-center px-2 py-3 mb-4 group shrink-0">
        <span className="font-bold text-[18px] text-[#1a1a1a] tracking-tight">Jobing AI</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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
      </div>
    </div>
  );
}
