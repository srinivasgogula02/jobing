"use client";

import { useState } from "react";
import { importLinkedInProfile } from "@/app/actions/linkedin";
import { Linkedin, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface LinkedInImportProps {
  onImportSuccess: () => void;
}

export function LinkedInImport({ onImportSuccess }: LinkedInImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await importLinkedInProfile(url.trim());

      if (res.success) {
        setResult({ type: "success", message: res.message || "Profile imported successfully!" });
        onImportSuccess();
        // Auto-close after success
        setTimeout(() => {
          setIsOpen(false);
          setUrl("");
          setResult(null);
        }, 2500);
      } else {
        setResult({ type: "error", message: res.error || "Import failed." });
      }
    } catch {
      setResult({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm"
      >
        <Linkedin size={16} />
        <span className="hidden sm:inline">Import LinkedIn</span>
        <span className="sm:hidden">LinkedIn</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm" onClick={() => !loading && setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A66C2] rounded-xl flex items-center justify-center">
                  <Linkedin size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a] text-base">Import from LinkedIn</h3>
                  <p className="text-[11px] text-[#6b7280]">Auto-fill your profile in seconds</p>
                </div>
              </div>
              <button
                onClick={() => !loading && setIsOpen(false)}
                className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
                disabled={loading}
              >
                <X size={18} className="text-[#9ca3af]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <label className="block text-[13px] font-semibold text-[#374151] mb-2">
                Your LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/yourname"
                className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] transition-all disabled:opacity-50 disabled:bg-[#fafafa]"
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleImport()}
                autoFocus
              />

              <p className="mt-2 text-[11px] text-[#9ca3af]">
                We&apos;ll import your experience, education, skills, and more. Your existing data won&apos;t be overwritten.
              </p>

              {/* Result Feedback */}
              {result && (
                <div className={`mt-4 flex items-start gap-2.5 p-3.5 rounded-xl text-[13px] font-medium ${
                  result.type === "success" 
                    ? "bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]" 
                    : "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]"
                }`}>
                  {result.type === "success" ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 pt-0">
              <button
                onClick={handleImport}
                disabled={loading || !url.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] disabled:bg-[#93c5fd] text-white font-bold rounded-xl text-[14px] transition-all active:scale-[0.98] shadow-sm disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importing profile...
                  </>
                ) : (
                  <>
                    <Linkedin size={16} />
                    Import Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
