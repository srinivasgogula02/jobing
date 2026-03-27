"use client";

import { useState, useRef } from "react";
import { Loader2, FileDown, Wand2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { ProfileCompletionPopup } from "@/components/ProfileCompletionPopup";
import type { CompletionResult } from "@/lib/profileConfig";

import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";

interface CreateResumeFormProps {
  initialCredits?: number;
}

export function CreateResumeForm({ initialCredits = 0 }: CreateResumeFormProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first.");
      return;
    }

    if (credits < 1) {
      setError("You don't have enough credits. Please upgrade your plan.");
      return;
    }

    // On mobile, scroll to preview so user sees the loading state
    if (window.innerWidth < 1024) {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Check profile completion before generating
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const { completion: comp } = await profileRes.json();
        if (comp && comp.missing && comp.missing.length > 0) {
          setCompletion(comp);
          setShowPopup(true);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check profile completion:", err);
      // If we can't check, proceed anyway — the generate-resume endpoint will also check
    }

    await generateResume();
  };

  const generateResume = async () => {
    setIsGenerating(true);
    setError(null);
    setPdfUrl(null);

    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Generation/Compiler Error from backend:", data.error || data);
        throw new Error("Our AI encountered a formatting snag. Please tap Try Again.");
      }
      setPdfUrl(data.pdfUrl);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 flex-1 px-2 py-4 lg:pb-6 text-left items-stretch">
        {/* Left: Input & Profile Completion */}
        <div className="flex flex-col w-full lg:w-[450px] gap-6 shrink-0 lg:self-start">
          {/* Job Description Card */}
          <div className="flex flex-col bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden shrink-0">
            <div className="px-6 py-4 border-b border-[#f0f0f0] bg-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#C1FF00]/20 flex items-center justify-center">
                <FileText size={16} className="text-[#1a1a1a]" />
              </div>
              <h2 className="text-[15px] font-bold text-[#1a1a1a]">Job Description</h2>
            </div>

            <div className="p-3 md:p-6 flex-1 flex flex-col gap-3 md:gap-5 bg-white">
              {error && (
                <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex-1 flex flex-col relative group min-h-[200px] lg:min-h-[300px]">
                <textarea
                  className="flex-1 w-full bg-[#fafafa] group-hover:bg-[#f5f5f4] border border-[#e5e5e5] rounded-xl p-2 md:p-5 text-base text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#C1FF00] focus:border-[#C1FF00] focus:bg-white transition-all resize-none leading-relaxed slim-scrollbar"
                  placeholder="Paste the requirements, responsibilities, and qualifications from the job posting here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {credits < 1 ? (
                <a
                  href="/pricing"
                  className="w-full py-4 text-[15px] gap-2.5 h-14 bg-[#1a1a1a] text-white hover:bg-[#333333] flex items-center justify-center rounded-xl font-bold transition-colors"
                >
                  Upgrade to Create (0 Credits)
                </a>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !jobDescription.trim()}
                  className="btn-primary w-full py-4 text-[15px] gap-2.5 h-14"
                >
                  {isGenerating ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating resume...</>
                  ) : (
                    <><Wand2 size={18} /> {error ? "Try Again" : "Create Resume"} <span className="text-[#1a1a1a]/60 text-sm ml-1 font-semibold">(1 Credit)</span></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Profile Completion Card (Desktop only) */}
          <div className="hidden lg:block">
            <ProfileCompletionCard />
          </div>
        </div>

        {/* Right: Preview */}
        <div 
          ref={previewRef}
          className={`flex flex-col flex-1 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden ${pdfUrl && !isGenerating ? 'min-h-[600px] lg:min-h-[1100px]' : 'min-h-[350px] lg:min-h-[400px]'}`}
        >
          <div className="flex-1 bg-[#fafafa] flex flex-col items-center justify-center overflow-auto min-h-[400px] relative">
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none opacity-60 sm:opacity-100">
              <span className="px-2 py-1 bg-[#1a1a1a]/5 backdrop-blur-sm border border-[#1a1a1a]/10 rounded-md text-[8px] sm:text-[9px] font-black text-[#1a1a1a]/40 tracking-[0.2em] uppercase">
                Preview
              </span>
            </div>
            {pdfUrl && !isGenerating && (
              <div className="absolute top-4 right-4 z-10 group/download">
                <a
                  href={`${pdfUrl}?download=resume.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-[#e5e5e5] rounded-xl text-[13px] font-bold text-[#1a1a1a] shadow-sm hover:bg-[#C1FF00] hover:border-[#C1FF00] transition-all active:scale-95"
                  title="Download PDF"
                >
                  <FileDown size={14} /> 
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
              </div>
            )}
            {!pdfUrl && !isGenerating && (
              <div className="relative w-full h-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-12 pb-6 px-6 sm:p-6 lg:p-12 flex flex-col overflow-hidden group">
                <div className="w-full flex-1 space-y-7 opacity-90 transition-all duration-700">
                  {/* Header Area */}
                  <div className="flex flex-col items-center space-y-4 mb-10">
                    <div className="relative w-2/3 h-7 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#C1FF00]/15 rounded-md overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C1FF00]/30 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                      {/* Scribble Name */}
                      <div className="flex gap-1.5 animate-typing-reveal overflow-hidden">
                        <div className="w-12 h-3 bg-[#1a1a1a]/20 rounded-full" />
                        <div className="w-16 h-3 bg-[#1a1a1a]/20 rounded-full" />
                      </div>
                    </div>
                    
                    {/* Scribble Subtitle */}
                    <div className="flex gap-2 animate-typing-reveal" style={{ animationDelay: '200ms' }}>
                       <div className="w-20 h-2 bg-[#9ca3af]/20 rounded-full" />
                       <div className="w-3 h-2 bg-[#9ca3af]/20 rounded-full" />
                       <div className="w-24 h-2 bg-[#9ca3af]/20 rounded-full" />
                    </div>
                    <div className="w-full h-px bg-[#e5e5e5] mt-2"></div>
                  </div>

                  {/* Section 1: Experience */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-2.5 bg-[#1a1a1a]/10 rounded-full" />
                      <div className="h-[1px] flex-1 bg-[#f0f0f0]"></div>
                    </div>
                    
                    {/* Job 1 Scribble */}
                    <div className="space-y-3.5 pl-1">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#C1FF00]" />
                             <div className="w-32 h-3 bg-[#1a1a1a]/15 rounded-full" />
                          </div>
                          <div className="flex gap-1.5 pl-3.5">
                            <div className="w-20 h-2 bg-[#6b7280]/15 rounded-full" />
                            <div className="w-12 h-2 bg-[#6b7280]/15 rounded-full" />
                          </div>
                        </div>
                        <div className="w-14 h-2 bg-[#9ca3af]/20 rounded-full" />
                      </div>
                      
                      {/* Bullets Scribble */}
                      <div className="space-y-2.5 pt-1 pl-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex flex-col gap-1.5 w-full">
                            <div className="relative h-2 w-[90%] bg-[#f5f5f4] rounded-full overflow-hidden">
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C1FF00]/10 to-transparent -translate-x-full animate-shimmer" style={{ animationDelay: `${i * 300}ms` }} />
                            </div>
                            {i === 0 && <div className="h-2 w-[60%] bg-[#f5f5f4] rounded-full opacity-60" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Job 2 Scribble */}
                    <div className="space-y-3.5 pl-1 pt-2 opacity-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="w-28 h-3 bg-[#1a1a1a]/15 rounded-full" />
                          <div className="w-24 h-2 bg-[#6b7280]/15 rounded-full" />
                        </div>
                        <div className="w-12 h-2 bg-[#9ca3af]/20 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Education */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-2.5 bg-[#1a1a1a]/10 rounded-full" />
                      <div className="h-[1px] flex-1 bg-[#f0f0f0]"></div>
                    </div>
                    <div className="flex justify-between items-center pl-1">
                      <div className="w-36 h-3 bg-[#1a1a1a]/15 rounded-full" />
                      <div className="w-20 h-2 bg-[#6b7280]/15 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="text-center flex flex-col items-center justify-center h-full w-full bg-white/50 rounded-xl border border-[#e5e5e5] border-dashed">
                <div className="bg-[#1a1a1a] p-4 rounded-2xl mb-6 shadow-lg shadow-[#1a1a1a]/10">
                  <Loader2 size={32} className="animate-spin text-[#C1FF00]" />
                </div>
                <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2 tracking-tight">AI is crafting your resume</h3>
                <p className="text-[14px] text-[#6b7280]">This usually takes about 10–20 seconds.</p>
              </div>
            )}

            {pdfUrl && !isGenerating && (
              <>
                {/* Mobile: show success card with action buttons (iframes render PDFs poorly on mobile) */}
                <div className="flex flex-col items-center justify-center text-center space-y-6 lg:hidden w-full py-4">
                  <div className="w-20 h-20 rounded-3xl bg-[#C1FF00]/15 border border-[#C1FF00]/30 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={36} className="text-[#8bb800]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[18px] font-bold text-[#1a1a1a] tracking-tight">Resume ready!</h3>
                    <p className="text-[14px] text-[#6b7280] leading-relaxed max-w-[280px]">
                      Your tailored resume has been generated. View or download it below.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-[260px]">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary w-full py-3.5 text-[15px] gap-2.5 font-bold"
                    >
                      <FileText size={18} /> View Resume
                    </a>
                    <a
                      href={`${pdfUrl}?download=resume.pdf`}
                      className="btn-secondary w-full py-3 text-[14px] gap-2.5 font-semibold"
                    >
                      <FileDown size={16} /> Download PDF
                    </a>
                  </div>
                </div>
                {/* Desktop: render PDF in iframe with explicit height */}
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="hidden lg:block w-full rounded-xl border border-[#e5e5e5] bg-white shadow-sm"
                  style={{ minHeight: '1000px' }}
                  title="Resume PDF Preview"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Completion Popup */}
      {showPopup && completion && (
        <ProfileCompletionPopup
          completion={completion}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
}
