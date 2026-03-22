"use client";

import { useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileChat } from "@/components/ProfileChat";
import { ProfileSummary, ScoreRing } from "@/components/ProfileSummary";
import { computeCompletionScore } from "@/lib/profileConfig";
import { ChevronLeft, LayoutDashboard, Database, X } from "lucide-react";
import Link from "next/link";

interface ProfilePageClientProps {
  initialProfileData: Record<string, any>;
}

export function ProfilePageClient({ initialProfileData }: ProfilePageClientProps) {
  const [profileData, setProfileData] = useState<Record<string, any>>(initialProfileData);
  const [showDataOnMobile, setShowDataOnMobile] = useState(false);
  const searchParams = useSearchParams();

  // Check if user was redirected from the resume creation popup
  const fromResume = searchParams.get("from") === "resume";

  // Compute missing fields for the AI to guide the user
  const completion = useMemo(() => computeCompletionScore(profileData), [profileData]);
  const missingFields = completion.missing;

  const handleProfileUpdate = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setProfileData(json.profileData || {});
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full lg:h-auto w-full max-w-6xl mx-auto lg:p-0 overflow-hidden lg:overflow-visible">
      {/* Gamified Header - Immersive Version for Mobile */}
      <div className="flex items-center justify-between bg-white px-5 py-3 lg:mb-6 lg:p-6 lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm border-b border-[#f0f0f0] lg:border-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="scale-75 md:scale-100 origin-left">
            <ScoreRing percent={completion.percent} score={completion.score} total={completion.total} />
          </div>
          <div className="flex-1">
             <h1 className="text-lg md:text-2xl font-black text-[#1a1a1a] tracking-tight leading-tight">Build Profile</h1>
             <p className="text-[10px] md:text-sm text-[#6b7280] font-bold uppercase tracking-widest">Level {Math.floor(completion.percent / 20) + 1}</p>
          </div>
        </div>

        <button 
          onClick={() => setShowDataOnMobile(true)}
          className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#1a1a1a] text-white rounded-xl shadow-lg shadow-[#1a1a1a]/10 hover:bg-[#333] transition-all shrink-0"
        >
          <Database size={18} />
        </button>
      </div>

      {/* Main Experience */}
      <div className="flex-1 flex flex-col lg:flex-row lg:gap-6 min-h-0 overflow-hidden">
        {/* Chat - The Primary Interface */}
        <div className="flex-1 flex flex-col min-h-0 bg-white lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm overflow-hidden border-none shadow-none h-full">
          <ProfileChat
            onProfileUpdate={handleProfileUpdate}
            missingFields={missingFields}
            fromResume={fromResume}
            isMobile={true}
            hideHeader={true}
          />
        </div>

        {/* Profile Data - Side Panel on Desktop */}
        <div className="hidden lg:block lg:w-[380px] shrink-0 min-h-0">
          <ProfileSummary profileData={profileData} />
        </div>
      </div>

      {/* Mobile Profile Data Drawer */}
      {showDataOnMobile && (
        <div className="fixed inset-0 z-[60] flex flex-col md:hidden animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-md" onClick={() => setShowDataOnMobile(false)} />
           <div className="relative mt-auto h-[85vh] bg-[#fafafa] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="p-6 border-b border-[#e5e5e5] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center">
                   <h2 className="font-bold text-[#1a1a1a] text-lg">Your Profile Data</h2>
                </div>
                <button onClick={() => setShowDataOnMobile(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 <ProfileSummary profileData={profileData} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
