"use client";

import { X, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { markProfileCompletionPopupSeen } from "@/app/actions/user";

interface ProfileSuccessPopupProps {
  onDismiss: () => void;
}

export function ProfileSuccessPopup({ onDismiss }: ProfileSuccessPopupProps) {
  const handleDismiss = () => {
    markProfileCompletionPopupSeen();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-0 animate-in fade-in duration-300 fill-mode-forwards">
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-md"
        onClick={handleDismiss}
      />
      <div className="relative w-full max-w-[420px] bg-white rounded-[28px] shadow-2xl p-8 transform scale-95 animate-in zoom-in duration-300 fill-mode-forwards delay-100">
        <button 
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#C1FF00]/15 flex items-center justify-center border-4 border-[#C1FF00]/10 mb-6 relative">
             <div className="absolute inset-0 rounded-full bg-[#C1FF00]/20 animate-ping"></div>
            <CheckCircle2 size={40} className="text-[#8bb800] relative z-10" />
          </div>
          
          <h2 className="text-[28px] font-black text-[#1a1a1a] tracking-tight mb-3 leading-tight">
            100% Complete!
          </h2>
          
          <p className="text-[15px] text-[#4b5563] leading-relaxed mb-8 max-w-[300px]">
            Outstanding work. Your profile is fully loaded with exactly what our AI needs to craft the perfect tailored resume.
          </p>

          <Link
            href="/create"
            onClick={handleDismiss}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#1a1a1a] text-white hover:bg-[#2c2c2c] transition-all rounded-2xl group shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(26,26,26,0.2)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <FileText size={18} className="text-white" />
              </div>
              <span className="font-bold text-[16px]">Create Resume</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#C1FF00]/10 flex items-center justify-center group-hover:bg-[#C1FF00]/20 transition-colors">
              <ArrowRight size={20} className="text-[#C1FF00] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <button 
            onClick={handleDismiss}
            className="text-[14px] text-[#9ca3af] font-medium hover:text-[#1a1a1a] transition-colors mt-6"
          >
            Close and keep adding details
          </button>
        </div>
      </div>
    </div>
  );
}
