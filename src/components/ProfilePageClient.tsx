"use client";

import { useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileChat } from "@/components/ProfileChat";
import { ProfileSummary } from "@/components/ProfileSummary";
import { computeCompletionScore } from "@/lib/profileConfig";

interface ProfilePageClientProps {
  initialProfileData: Record<string, any>;
}

export function ProfilePageClient({ initialProfileData }: ProfilePageClientProps) {
  const [profileData, setProfileData] = useState<Record<string, any>>(initialProfileData);
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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="space-y-1 mb-5 shrink-0">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">My Profile</h1>
        <p className="text-sm text-[#9ca3af]">Chat with the AI assistant to build your profile. Your data appears on the right.</p>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        <div className="flex-1 lg:w-3/5 min-h-0">
          <ProfileChat
            onProfileUpdate={handleProfileUpdate}
            missingFields={missingFields}
            fromResume={fromResume}
          />
        </div>
        <div className="lg:w-2/5 min-h-0">
          <ProfileSummary profileData={profileData} />
        </div>
      </div>
    </div>
  );
}
