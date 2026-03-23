"use client";

import { useState, useRef } from "react";
import { Loader2, FileDown, Wand2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { ProfileCompletionPopup } from "@/components/ProfileCompletionPopup";
import type { CompletionResult } from "@/lib/profileConfig";

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
        {/* Left: Input */}
        <div className="flex flex-col w-full lg:w-[450px] bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden shrink-0 lg:self-start">
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
                  <><Wand2 size={18} /> {error ? "Try Again" : "Create Design"} <span className="text-[#1a1a1a]/60 text-sm ml-1 font-semibold">(1 Credit)</span></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div 
          ref={previewRef}
          className={`flex flex-col flex-1 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden ${pdfUrl && !isGenerating ? 'min-h-[600px] lg:min-h-[1100px]' : 'min-h-[350px] lg:min-h-[400px]'}`}
        >
          <div className="px-6 py-4 border-b border-[#f0f0f0] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center">
                <CheckCircle2 size={16} className={pdfUrl ? "text-[#C1FF00]" : "text-[#d4d4d4]"} />
              </div>
              <h2 className="text-[15px] font-bold text-[#1a1a1a]">Preview</h2>
            </div>
            {pdfUrl && (
              <a
                href={`${pdfUrl}?download=resume.pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-4 py-2 text-[13px] gap-2 font-semibold hover:border-[#C1FF00] hover:bg-[#C1FF00]/5"
              >
                <FileDown size={14} /> Download PDF
              </a>
            )}
          </div>

          <div className="flex-1 bg-[#fafafa] p-6 flex flex-col items-center justify-center overflow-auto min-h-[400px]">
            {!pdfUrl && !isGenerating && (
              <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-[1/1.414] bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#e5e5e5] p-6 lg:p-8 flex flex-col mx-auto overflow-hidden group">
                {/* --- Animated Resume Skeleton --- */}
                <div className="w-full flex-1 space-y-5 opacity-40 blur-[0.5px]">
                  {/* Header Area */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-2/3 h-6 bg-[#C1FF00]/40 rounded-sm animate-pulse"></div>
                    <div className="w-full max-w-[80%] h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-full h-px bg-[#e5e5e5] mt-1"></div>
                  </div>

                  {/* Section 1: Experience */}
                  <div className="space-y-4">
                    <div className="w-32 h-3 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    
                    {/* Job 1 */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-end">
                        <div className="w-48 h-3.5 bg-[#d4d4d4] rounded-sm animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        <div className="w-20 h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '500ms' }}></div>
                      </div>
                      <div className="w-32 h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '550ms' }}></div>
                      
                      {/* Bullets */}
                      <div className="space-y-2 pt-1 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0 animate-pulse"></div>
                          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0 animate-pulse"></div>
                           <div className="w-5/6 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '650ms' }}></div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0 animate-pulse"></div>
                           <div className="w-4/5 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '700ms' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Job 2 */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex justify-between items-end">
                        <div className="w-40 h-3.5 bg-[#d4d4d4] rounded-sm animate-pulse" style={{ animationDelay: '800ms' }}></div>
                        <div className="w-16 h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '850ms' }}></div>
                      </div>
                      <div className="w-24 h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '900ms' }}></div>
                      
                      {/* Bullets */}
                      <div className="space-y-2 pt-1 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0 animate-pulse"></div>
                          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '950ms' }}></div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0 animate-pulse"></div>
                           <div className="w-3/4 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Education */}
                  <div className="space-y-3 pt-2">
                     <div className="w-24 h-3 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '1100ms' }}></div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="w-36 h-3 bg-[#d4d4d4] rounded-sm animate-pulse" style={{ animationDelay: '1200ms' }}></div>
                          <div className="w-12 h-2.5 bg-[#e5e5e5] rounded-sm animate-pulse" style={{ animationDelay: '1250ms' }}></div>
                        </div>
                        <div className="w-48 h-2 bg-[#f0f0f0] rounded-sm animate-pulse" style={{ animationDelay: '1300ms' }}></div>
                     </div>
                  </div>
                </div>
                
                {/* --- Glass Overlay Prompt --- */}
                <div className="absolute inset-0 bg-[#f5f5f4]/30 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-all duration-300">
                  <div className="flex flex-col items-center bg-white/95 backdrop-blur-xl px-6 py-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 text-center mx-6 mt-12 transform group-hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-[#C1FF00]/15 flex items-center justify-center mb-4">
                       <Wand2 size={22} className="text-[#8bb800]" />
                    </div>
                    <h3 className="text-[17px] font-black text-[#1a1a1a] tracking-tight mb-1.5">Waiting for details</h3>
                    <p className="text-[13px] text-[#6b7280] leading-relaxed max-w-[200px] font-medium">
                      Paste a job description on the left to instantly weave your perfect ATS resume.
                    </p>
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
