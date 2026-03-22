"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import type { CompletionResult } from "@/lib/profileConfig";

interface ProfileCompletionPopupProps {
  completion: CompletionResult;
  onClose: () => void;
}

export function ProfileCompletionPopup({ completion, onClose }: ProfileCompletionPopupProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center popup-backdrop" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl border border-[#e5e5e5] shadow-2xl shadow-black/10 w-full max-w-[420px] mx-4 animate-scale-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#f5f5f4] hover:bg-[#e5e5e5] flex items-center justify-center transition-colors z-10"
        >
          <X size={14} className="text-[#6b7280]" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fef3c7] flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-[#f59e0b]" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#1a1a1a] tracking-tight">
            Your profile is not complete yet
          </h2>
          <p className="text-[14px] text-[#6b7280] mt-1.5 leading-relaxed">
            To generate a resume, please fill in the missing details on your profile page.
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-[12px] font-bold mb-2">
            <span className="text-[#1a1a1a]">Completion</span>
            <span className="text-[#f59e0b]">{completion.score}/{completion.total}</span>
          </div>
          <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out animate-progress-fill"
              style={{
                width: `${completion.percent}%`,
                backgroundColor: completion.percent >= 60 ? '#C1FF00' : '#f59e0b',
              }}
            />
          </div>
        </div>

        {/* Missing fields */}
        <div className="px-6 pb-5">
          <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2.5">Missing fields</p>
          <div className="space-y-2">
            {completion.missing.map((field) => (
              <div
                key={field.key}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#fef3c7]/50 border border-[#fde68a]/60"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-[13px] font-semibold text-[#92400e]">{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary py-3 text-[14px] font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => router.push("/profile?from=resume")}
            className="flex-1 btn-primary py-3 text-[14px] gap-2"
          >
            Go to Profile <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
