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
      if (!response.ok) throw new Error(data.error || "Failed to generate resume");
      setPdfUrl(data.pdfUrl);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 px-2 py-4 lg:p-0 lg:px-2 lg:pb-6">
        {/* Left: Input */}
        <div className="flex flex-col w-full lg:w-[40%] bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden flex-shrink-0">
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

            <div className="flex-1 flex flex-col relative group min-h-[250px] lg:min-h-[400px]">
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
                  <><Wand2 size={18} /> Create Design <span className="text-[#1a1a1a]/60 text-sm ml-1 font-semibold">(1 Credit)</span></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div 
          ref={previewRef}
          className="flex flex-col flex-1 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden min-h-[500px] lg:min-h-[700px]"
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
                href={pdfUrl}
                download="resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary px-4 py-2 text-[13px] gap-2 font-semibold hover:border-[#C1FF00] hover:bg-[#C1FF00]/5"
              >
                <FileDown size={14} /> Download PDF
              </a>
            )}
          </div>

          <div className="flex-1 bg-[#fafafa] p-6 flex items-center justify-center overflow-hidden">
            {!pdfUrl && !isGenerating && (
              <div className="text-center space-y-4 text-[#9ca3af] max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-white border border-[#e5e5e5] shadow-sm flex items-center justify-center mx-auto mb-2">
                  <FileText size={32} className="text-[#d4d4d4]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1a1a1a]">No preview available</h3>
                <p className="text-[14px] leading-relaxed text-[#6b7280]">
                  Your generated resume will appear here once you paste a job description and click create.
                </p>
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
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full rounded-xl border border-[#e5e5e5] bg-white shadow-sm"
                title="Resume PDF Preview"
              />
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
