"use client";

import { useState } from "react";
import { JobCard } from "@/components/JobCard";
import type { JSearchJob } from "@/lib/jsearch";
import { Code2, DatabaseZap, Megaphone, Loader2 } from "lucide-react";

interface JobsClientProps {
  softwareJobs: JSearchJob[];
  dataJobs: JSearchJob[];
  marketingJobs: JSearchJob[];
}

export function JobsClient({ softwareJobs, dataJobs, marketingJobs }: JobsClientProps) {
  const [activeTab, setActiveTab] = useState<"software" | "data" | "marketing">("software");
  
  // Fake a tiny loading state for psychological effect when switching tabs
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchTab = (tab: "software" | "data" | "marketing") => {
    setIsSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsSwitching(false), 300); // 300ms micro-interaction
  };

  const currentJobs = 
    activeTab === "software" ? softwareJobs :
    activeTab === "data" ? dataJobs :
    marketingJobs;

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-7xl mx-auto px-5 lg:px-8 py-6 lg:py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-[#1a1a1a] tracking-tight leading-tight mb-2">
          Jobs Showcase
        </h1>
        <p className="text-[15px] lg:text-[16px] text-[#6b7280] max-w-2xl">
          Curated entry-level and internship opportunities specifically for freshers and 3rd/4th year students. 
          Updated daily.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => handleSwitchTab("software")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-all ${
            activeTab === "software" 
              ? "bg-[#1a1a1a] text-[#C1FF00] shadow-md" 
              : "bg-white text-[#6b7280] border border-[#e5e5e5] hover:border-[#a3a3a3] hover:text-[#1a1a1a]"
          }`}
        >
          <Code2 size={16} /> Software Engineering
        </button>
        
        <button
          onClick={() => handleSwitchTab("data")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-all ${
            activeTab === "data" 
              ? "bg-[#1a1a1a] text-[#C1FF00] shadow-md" 
              : "bg-white text-[#6b7280] border border-[#e5e5e5] hover:border-[#a3a3a3] hover:text-[#1a1a1a]"
          }`}
        >
          <DatabaseZap size={16} /> Data & AI
        </button>

        <button
          onClick={() => handleSwitchTab("marketing")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-all ${
            activeTab === "marketing" 
              ? "bg-[#1a1a1a] text-[#C1FF00] shadow-md" 
              : "bg-white text-[#6b7280] border border-[#e5e5e5] hover:border-[#a3a3a3] hover:text-[#1a1a1a]"
          }`}
        >
          <Megaphone size={16} /> Product & Marketing
        </button>
      </div>

      {/* Dynamic Grid */}
      <div className="flex-1 overflow-visible relative">
        {isSwitching ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa]/50 backdrop-blur-sm z-10 rounded-2xl">
            <Loader2 className="w-8 h-8 text-[#1a1a1a] animate-spin" />
          </div>
        ) : currentJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
            {currentJobs.map(job => (
              <JobCard key={job.job_id} job={job} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e5e5e5] border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-[#fafafa] rounded-full flex items-center justify-center border border-[#e5e5e5] mb-4 shadow-sm">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">No postings found</h3>
            <p className="text-[#6b7280] text-sm text-center max-w-[300px]">
              We couldn't find any fresh jobs in this category right now. Check back tomorrow!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
