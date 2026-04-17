"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveNote, checkIdTaken } from "@/app/actions/copy";
import { 
  Check, 
  Copy, 
  Link as LinkIcon, 
  Edit,
  Loader2,
  X 
} from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function CopyClient({ id, initialContent }: { id: string, initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [hostname, setHostname] = useState("jobing.site");
  
  const [isEditingId, setIsEditingId] = useState(false);
  const [newId, setNewId] = useState(id);
  const [idError, setIdError] = useState("");
  const [checkingId, setCheckingId] = useState(false);

  const router = useRouter();
  const initialMount = useRef(true);

  // Debounced Autosave
  useEffect(() => {
    setHostname(window.location.host);

    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    setSaveStatus("saving");
    const timeout = setTimeout(async () => {
      const result = await saveNote(id, content);
      if (result.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timeout);
  }, [content, id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/c/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const handleChangeId = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newId.trim().replace(/[^a-zA-Z0-9-_]/g, "");
    
    if (!cleanId) {
      setIdError("ID cannot be empty.");
      return;
    }
    
    if (cleanId === id) {
      setIsEditingId(false);
      return;
    }

    setCheckingId(true);
    setIdError("");
    
    const isTaken = await checkIdTaken(cleanId);
    
    if (isTaken) {
      setIdError("This ID is already taken. Please use another.");
      setCheckingId(false);
    } else {
      // ID is free. We will save the current content to the new ID, and redirect.
      await saveNote(cleanId, content);
      router.push(`/c/${cleanId}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar / Glassmorphism */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title Area */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <div className="bg-blue-600 dark:bg-blue-500 rounded-lg p-2 text-white shadow-lg shadow-blue-500/20">
              <Copy size={20} />
            </div>
            {isEditingId ? (
              <form onSubmit={handleChangeId} className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
                <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 overflow-hidden focus-within:ring-blue-500 transition-shadow flex-1 sm:flex-none">
                  <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-neutral-500 bg-neutral-200 dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-700 select-none flex items-center shrink-0">
                     {hostname}/c/
                  </span>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => {
                      setNewId(e.target.value);
                      setIdError("");
                    }}
                    autoFocus
                    className="bg-transparent border-none outline-none py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm w-20 sm:w-48 placeholder:text-neutral-400 flex-1 min-w-0"
                    placeholder="custom-id"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingId}
                  className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  title="Save Custom ID"
                >
                  {checkingId ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingId(false);
                    setIdError("");
                    setNewId(id);
                  }}
                  className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 rounded-md transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer bg-neutral-100/50 hover:bg-neutral-200 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 px-2 sm:px-3 py-1.5 border border-neutral-200 dark:border-neutral-700/50 rounded-md transition-colors flex-1 sm:flex-none shadow-sm min-w-0" onClick={() => setIsEditingId(true)} title="Tap to change custom URL">
                <h1 className="font-semibold text-sm sm:text-lg flex items-center min-w-0 overflow-hidden">
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal mr-0.5 sm:mr-1 shrink-0">{hostname}/c/</span>
                  <span className="truncate">{id}</span>
                </h1>
                <div className="flex items-center text-[10px] sm:text-xs gap-1 text-neutral-500 bg-neutral-200/50 dark:bg-neutral-700/50 px-1 sm:px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                  <Edit size={12} />
                  <span>Edit URL</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Status Indicator */}
            <div className="flex items-center text-xs font-medium text-neutral-500 w-16 justify-end">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" /> Saving</span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-green-500"><Check size={12} /> Saved</span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-500">Error saving</span>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
            >
              {copiedLink ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition transform active:scale-95"
            >
              {copiedContent ? <Check size={16} /> : <Copy size={16} />}
              Copy Content
            </button>
          </div>
        </div>
        
        {/* Error message for ID change */}
        {idError && (
          <div className="max-w-6xl mx-auto mt-2 text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <X size={14} /> {idError}
          </div>
        )}
      </header>

      {/* Editor Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 flex flex-col relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your text here... It will automatically save."
          className="flex-1 w-full resize-none bg-transparent outline-none border-none text-lg leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 p-2 lg:p-6"
          spellCheck="false"
          maxLength={100000}
        />
        <div className="absolute bottom-4 right-4 text-xs text-neutral-400 dark:text-neutral-600">
          {content.length.toLocaleString()} / 100,000
        </div>
      </main>

      {/* ─────── Brand Awareness CTA ─────── */}
      <footer className="w-full bg-white dark:bg-[#1a1a1a] border-t border-neutral-200 dark:border-neutral-800 py-3 px-4 shrink-0 transition-colors z-10 selection:bg-[#C1FF00]/30 relative">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-500 font-medium">
            <span className="hidden xs:inline">Powered by</span>
            <a 
              href="/" 
              target="_blank" 
              className="flex items-center gap-1.5 px-3 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-[#C1FF00] dark:hover:border-[#C1FF00] rounded-full text-neutral-900 dark:text-white transition-all shadow-sm hover:shadow-[#C1FF00]/20 group"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#C1FF00] group-hover:scale-110 transition-transform shadow-[0_0_8px_rgba(193,255,0,0.5)]"></div>
              <span className="font-extrabold tracking-tight text-[13px] uppercase">Jobing AI</span>
            </a>
          </div>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs sm:text-sm font-medium text-center sm:text-right">
            Stop getting rejected. <a href="/" target="_blank" className="text-neutral-600 dark:text-neutral-300 hover:text-[#1a1a1a] dark:hover:text-[#C1FF00] underline decoration-[#C1FF00]/50 hover:decoration-[#C1FF00] underline-offset-4 transition-all font-semibold">Tailor your resume in 30 seconds</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
