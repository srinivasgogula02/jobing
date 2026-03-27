"use client";

import { useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileChat } from "@/components/ProfileChat";
import { ProfileSummary, ScoreRing } from "@/components/ProfileSummary";
import { ProfileSuccessPopup } from "@/components/ProfileSuccessPopup";
import { LinkedInImport } from "@/components/LinkedInImport";
import { computeCompletionScore } from "@/lib/profileConfig";
import { ChevronLeft, LayoutDashboard, Database, X, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { clearProfileData } from "@/app/actions/user";

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

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (completion.percent === 100 && profileData && profileData.hasSeenCompletionPopup !== true) {
      const timer = setTimeout(() => setShowSuccessPopup(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [completion.percent, profileData]);

  const handleDismissSuccessPopup = () => {
    setShowSuccessPopup(false);
    setProfileData(prev => ({ ...prev, hasSeenCompletionPopup: true }));
  };

  const [isClearing, setIsClearing] = useState(false);
  const handleClearProfile = async () => {
    if (window.confirm("Are you sure you want to delete all your profile data? This action cannot be undone.")) {
      setIsClearing(true);
      try {
        const res = await clearProfileData();
        if (res.success) {
          await handleProfileUpdate();
        } else {
          alert("Failed to clear profile data. Please try again.");
        }
      } catch (err) {
        console.error("Error clearing profile:", err);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-56px)] lg:h-full w-full max-w-6xl mx-auto lg:p-0 overflow-hidden lg:overflow-visible">
      {/* Gamified Header - Immersive Version for Mobile */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-4 lg:mb-6 lg:p-6 lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm border-b border-[#f0f0f0] lg:border-none shrink-0 w-full">
        <div>
           <h1 className="text-xl lg:text-2xl font-black text-[#1a1a1a] tracking-tight leading-tight">Build Profile</h1>
           <p className="text-[11px] lg:text-sm text-[#6b7280] font-bold uppercase tracking-widest mt-1">Level {Math.floor(completion.percent / 20) + 1}</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <LinkedInImport onImportSuccess={handleProfileUpdate} />
          <button
            onClick={handleClearProfile}
            disabled={isClearing}
            title="Delete all profile data"
            className="p-2 text-[#ef4444] hover:bg-[#fef2f2] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
          >
            {isClearing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
          <div className="scale-90 md:scale-100 origin-right">
            <ScoreRing percent={completion.percent} score={completion.score} total={completion.total} />
          </div>
          <button 
            onClick={() => setShowDataOnMobile(true)}
             className="lg:hidden px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-[13px] font-bold active:scale-95 transition-all shadow-sm shrink-0"
           >
             View Profile
           </button>
        </div>

      </div>

      {/* Main Experience */}
      <div className="flex-1 flex flex-col lg:flex-row lg:gap-6 min-h-0 overflow-hidden">
        {/* Chat - The Primary Interface */}
        <div className="flex-1 flex flex-col min-h-0 bg-white lg:rounded-2xl lg:border lg:border-[#e5e5e5] lg:shadow-sm overflow-hidden border-none shadow-none">
          <ProfileChat
            onProfileUpdate={handleProfileUpdate}
            missingFields={missingFields}
            fromResume={fromResume}
            isMobile={true}
            hideHeader={true}
          />
        </div>

        {/* Profile Data - Side Panel on Desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-[380px] shrink-0 min-h-0 overflow-y-auto slim-scrollbar">
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <ProfileSuccessPopup onDismiss={handleDismissSuccessPopup} />
      )}
    </div>
  );
}
