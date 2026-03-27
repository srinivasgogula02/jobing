"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, User, Settings, PlusCircle, CreditCard, LogOut, ChevronDown, ChevronUp, Briefcase, GraduationCap, Puzzle } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { name: "Create Resume", href: "/create", icon: PlusCircle },
    { name: "My Resumes", href: "/resumes", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Jobs", href: "#jobs", icon: Briefcase, comingSoon: true },
    { name: "Upskill", href: "#upskill", icon: GraduationCap, comingSoon: true },
    { name: "Extension", href: "#extension", icon: Puzzle, comingSoon: true },
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
          
          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-[#9ca3af] cursor-not-allowed group/item"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} />
                  {item.name}
                </div>
                <span className="text-[8px] font-black bg-slate-100 text-[#9ca3af] px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-slate-200/50 scale-[0.9] origin-right">Soon</span>
              </div>
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
      {/* Legal & Support */}
      <div className="mt-auto pt-6 border-t border-[#f0f0f0] flex flex-col gap-1 px-3 pb-2">
        <Link 
          href="/about" 
          onClick={onClose}
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
            pathname === '/about' ? 'text-[#1a1a1a]' : 'text-[#9ca3af] hover:text-[#1a1a1a]'
          }`}
        >
          About Us
        </Link>
        <Link 
          href="/privacy" 
          onClick={onClose}
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
            pathname === '/privacy' ? 'text-[#1a1a1a]' : 'text-[#9ca3af] hover:text-[#1a1a1a]'
          }`}
        >
          Privacy Policy
        </Link>
        <Link 
          href="/terms" 
          onClick={onClose}
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
            pathname === '/terms' ? 'text-[#1a1a1a]' : 'text-[#9ca3af] hover:text-[#1a1a1a]'
          }`}
        >
          Terms & Conditions
        </Link>
        <p className="text-[10px] text-[#d1d5db] font-medium mt-3">
          © 2026 Jobing AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
