"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveNote, checkIdTaken } from "@/app/actions/copy";
import { 
  Check, 
  Copy, 
  Link as LinkIcon, 
  Edit,
  Loader2,
  X,
  Share,
  Save,
  EyeOff
} from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function CopyClient({ id, initialContent, isNew = false }: { id: string, initialContent: string, isNew?: boolean }) {
  const [content, setContent] = useState(initialContent);
  const [isEditingContent, setIsEditingContent] = useState(isNew);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStealthLink, setCopiedStealthLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [hostname, setHostname] = useState("jobing.site");
  
  const [isEditingId, setIsEditingId] = useState(false);
  const [currentId, setCurrentId] = useState(id);
  const [newId, setNewId] = useState(id);
  const [idError, setIdError] = useState("");
  const [checkingId, setCheckingId] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setHostname(window.location.host);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/c/${currentId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyStealthLink = () => {
    const url = `${window.location.origin}/p/${currentId}`;
    navigator.clipboard.writeText(url);
    setCopiedStealthLink(true);
    setTimeout(() => setCopiedStealthLink(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const handleChangeId = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    
    if (!cleanId) {
      setIdError("ID cannot be empty.");
      return;
    }
    
    if (cleanId === currentId) {
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
      if (isNew) {
        setCurrentId(cleanId);
        setIsEditingId(false);
        setCheckingId(false);
      } else {
        await saveNote(cleanId, content);
        router.push(`/c/${cleanId}`);
      }
    }
  };

  const handleSaveShare = async () => {
    if (isNew && !content.trim()) return;
    setSaveStatus("saving");
    const result = await saveNote(currentId, content);
    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      if (isNew) {
        router.push(`/c/${currentId}`);
      } else {
        setIsEditingContent(false);
      }
    } else {
      setSaveStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar / Glassmorphism */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Title Area */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <div className="bg-blue-600 dark:bg-blue-500 rounded-lg p-2 text-white shadow-lg shadow-blue-500/20 shrink-0">
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
                      setNewId(e.target.value.toLowerCase());
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
                  className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 shrink-0"
                  title="Save Custom ID"
                >
                  {checkingId ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingId(false);
                    setIdError("");
                    setNewId(currentId);
                  }}
                  className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 rounded-md transition-colors shrink-0"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer bg-neutral-100/50 hover:bg-neutral-200 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 px-2 sm:px-3 py-1.5 border border-neutral-200 dark:border-neutral-700/50 rounded-md transition-colors flex-1 sm:flex-none shadow-sm min-w-0" onClick={() => setIsEditingId(true)} title="Tap to change custom URL">
                <h1 className="font-semibold text-sm sm:text-lg flex items-center min-w-0 overflow-hidden">
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal mr-0.5 sm:mr-1 shrink-0">{hostname}/c/</span>
                  <span className="truncate">{currentId}</span>
                </h1>
                <div className="flex items-center text-[10px] sm:text-xs gap-1 text-neutral-500 bg-neutral-200/50 dark:bg-neutral-700/50 px-1 sm:px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                  <Edit size={12} />
                  <span>Edit URL</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Status Indicator */}
            {saveStatus !== "idle" && (
              <div className="flex items-center text-xs font-medium text-neutral-500">
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
            )}

            {isNew ? (
              content.trim().length > 0 && (
                <button
                  onClick={handleSaveShare}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#C1FF00] text-black hover:bg-[#aee600] transition transform hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  {saveStatus === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Share size={16} />}
                  Create Share
                </button>
              )
            ) : (
              isEditingContent ? (
                <>
                  <button onClick={() => setIsEditingContent(false)} className="px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveShare}
                    disabled={saveStatus === "saving"}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#C1FF00] text-black hover:bg-[#aee600] transition transform hover:scale-[1.02] active:scale-95 shadow-sm"
                  >
                    {saveStatus === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Note
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingContent(true)}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition whitespace-nowrap"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition whitespace-nowrap"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                    <span className={cn(copiedLink && "text-green-500 font-semibold")}>
                      {copiedLink ? "Copied!" : "Link"}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleCopyStealthLink}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition group relative whitespace-nowrap"
                    title="Copy Private Stealth Link"
                  >
                    {copiedStealthLink ? <Check size={16} className="text-green-500" /> : <EyeOff size={16} />}
                    <span className={cn(copiedStealthLink && "text-green-500 font-semibold")}>
                      {copiedStealthLink ? "Copied!" : "Private Link"}
                    </span>
                    {!copiedStealthLink && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                        Creates a /p/ pseudo-offline page
                      </div>
                    )}
                  </button>

                  <button
                    onClick={handleCopyContent}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-semibold rounded-lg transition transform active:scale-95 whitespace-nowrap",
                      copiedContent 
                        ? "bg-green-500 text-white hover:bg-green-600 shadow-[0_4px_12px_-4px_rgba(34,197,94,0.5)]"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]"
                    )}
                  >
                    {copiedContent ? <Check size={16} /> : <Copy size={16} />}
                    <span>
                      {copiedContent ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </>
              )
            )}
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
          placeholder={isEditingContent ? "Paste your text here..." : "No content provided."}
          className="flex-1 w-full resize-none bg-transparent outline-none border-none text-lg leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 p-2 lg:p-6"
          spellCheck="false"
          maxLength={100000}
          readOnly={!isEditingContent}
        />
        {isEditingContent && (
          <div className="absolute bottom-4 right-4 text-xs text-neutral-400 dark:text-neutral-600 pointer-events-none">
            {content.length.toLocaleString()} / 100,000
          </div>
        )}
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
