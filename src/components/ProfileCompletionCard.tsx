"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import type { CompletionResult } from "@/lib/profileConfig";

export function ProfileCompletionCard() {
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setCompletion(data.completion);
        }
      } catch (err) {
        console.error("Failed to fetch profile completion:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm flex items-center justify-center min-h-[160px]">
        <Loader2 size={24} className="animate-spin text-[#9ca3af]" />
      </div>
    );
  }

  if (!completion) return null;

  const isComplete = completion.percent === 100;

  return (
    <div className="bg-white rounded-2xl border-2 border-[#C1FF00]/50 shadow-[0_8px_30px_rgb(193,255,0,0.08)] overflow-hidden group transition-all hover:shadow-[0_8px_30px_rgb(193,255,0,0.15)] hover:border-[#C1FF00]">
      <div className="p-5 flex flex-col h-full gap-4">
        {/* Header with Score */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[16px] font-black text-[#1a1a1a] tracking-tight flex items-center gap-1.5">
              Profile Strength
              {isComplete && <Sparkles size={14} className="text-[#8bb800]" />}
            </h3>
            <p className="text-[12.5px] text-[#6b7280] font-bold leading-relaxed max-w-[190px]">
              {isComplete 
                ? "Your profile is rock solid! Ready for any application." 
                : "A stronger profile helps our AI craft a much better resume for you."}
            </p>
          </div>
          <div className="relative w-14 h-14 shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  className="text-[#f0f0f0]"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * completion.percent) / 100}
                  className="text-[#C1FF00] transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-[#1a1a1a]">
               {completion.percent}%
             </div>
          </div>
        </div>

        {/* Nudge & Action */}
        {!isComplete && (
          <div className="mt-auto pt-2 space-y-4">
            <div className="bg-[#C1FF00]/15 border border-[#C1FF00]/30 rounded-2xl p-4 shadow-sm shadow-[#C1FF00]/5">
              <p className="text-[12px] text-[#1a1a1a] font-bold leading-normal flex items-start gap-2.5">
                <Sparkles size={14} className="text-[#8bb800] mt-0.5 shrink-0" />
                <span>Chat with AI to instantly fill missing details and stand out from the crowd.</span>
              </p>
            </div>
            
            <button
              onClick={() => router.push("/profile")}
              className="btn-primary w-full h-11 text-[13px] gap-2.5 shadow-lg shadow-[#C1FF00]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Level up with AI
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isComplete && (
           <button
             onClick={() => router.push("/profile")}
             className="mt-auto w-full h-11 flex items-center justify-center gap-2 border-2 border-[#C1FF00]/30 text-[#1a1a1a] rounded-xl text-[13px] font-black hover:bg-[#C1FF00]/10 hover:border-[#C1FF00] transition-all"
           >
             View Profile
           </button>
        )}
      </div>
    </div>
  );
}
