"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveNote, checkIdTaken } from "@/app/actions/copy";
import { track } from "@/lib/analytics";
import { 
  Check, 
  Copy, 
  Link as LinkIcon, 
  Edit,
  Loader2,
  X,
  Share,
  Save,
  EyeOff,
  Info,
  Sparkles
} from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function CopyClient({ id, initialContent, isNew = false }: { id: string, initialContent: string, isNew?: boolean }) {
  const [content, setContent] = useState(initialContent);
  const [isEditingContent, setIsEditingContent] = useState(isNew);
  const [showGuide, setShowGuide] = useState(false);
  
  useEffect(() => {
    // Only automatically slide open the guide for brand new visitors on Desktop/Tablet viewports to preserve mobile typing real-estate.
    if (isNew && window.innerWidth >= 640) {
      setShowGuide(true);
    }
  }, [isNew]);
  
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
    track("note_link_copied", { note_id: currentId });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyStealthLink = () => {
    const url = `${window.location.origin}/p/${currentId}`;
    navigator.clipboard.writeText(url);
    setCopiedStealthLink(true);
    track("note_private_link_copied", { note_id: currentId });
    setTimeout(() => setCopiedStealthLink(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopiedContent(true);
    track("note_content_copied", { note_id: currentId, length: content.length });
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const handleExplainWithAI = () => {
    const text = content.trim();
    if (!text) return;
    // Keep the URL well under browser/proxy length limits. Encoded code can ~3x in
    // size, so cap the raw snippet and tell the model when we've truncated.
    const MAX_CHARS = 4000;
    const snippet =
      text.length > MAX_CHARS
        ? `${text.slice(0, MAX_CHARS)}\n\n…(truncated — ${text.length - MAX_CHARS} more characters)`
        : text;
    const prompt = `Explain this in simple terms. If it's code, walk through what it does step by step and call out anything important:\n\n${snippet}`;
    track("note_ai_explain", { note_id: currentId, length: text.length });
    window.open(
      `https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`,
      "_blank",
      "noopener,noreferrer"
    );
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
      track("note_custom_id_set", { note_id: cleanId });
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
      track(isNew ? "note_share_created" : "note_edited", {
        note_id: currentId,
        length: content.length,
      });
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
    <div className="h-[100dvh] w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar / Glassmorphism */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-5 py-2.5 shadow-sm">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo / Title Area */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
            <Link href="/copy" className="flex items-center gap-1.5 shrink-0" title="Jobing Notepad">
              <img src="/logo.png" alt="Jobing Notepad" className="w-5 h-5 object-contain hover:scale-105 transition-transform" />
              <span className="text-neutral-900 dark:text-[#C1FF00] text-xs font-black uppercase tracking-wider hidden sm:inline">Jobing Notepad</span>
            </Link>
            <div className="h-4 w-px bg-neutral-300 dark:bg-[#333] mx-1 shrink-0"></div>
            {isEditingId ? (
              <form onSubmit={handleChangeId} className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
                <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 overflow-hidden focus-within:ring-blue-500 transition-shadow flex-1 sm:flex-none">
                  <span className="px-2 py-1 text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-700 select-none flex items-center shrink-0">
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
                    className="bg-transparent border-none outline-none py-1 px-2 text-xs w-full sm:w-32 placeholder:text-neutral-400 flex-1 min-w-0"
                    placeholder="custom-id"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingId}
                  className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 shrink-0"
                  title="Save Custom ID"
                >
                  {checkingId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingId(false);
                    setIdError("");
                    setNewId(currentId);
                  }}
                  className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 rounded transition-colors shrink-0"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors min-w-0 overflow-hidden"
                onClick={() => setIsEditingId(true)}
                title="Edit custom URL"
              >
                <span className="text-neutral-500 text-xs font-medium shrink-0 truncate">{hostname}/c/</span>
                <span className="text-neutral-900 dark:text-[#C1FF00] text-xs font-bold truncate">{currentId}</span>
                <Edit size={12} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-[#C1FF00] transition-colors shrink-0" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-nowrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 overflow-hidden shrink-0">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={cn(
                "p-1.5 rounded transition-colors flex shrink-0",
                showGuide 
                  ? "bg-neutral-200 dark:bg-neutral-800 text-[#8bb800]" 
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              )}
              title="How it Works"
            >
              <Info size={14} />
            </button>
            {/* Status Indicator */}
            {saveStatus !== "idle" && (
              <div className="flex items-center text-[10px] sm:text-xs font-medium text-neutral-500">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#C1FF00] text-black hover:bg-[#aee600] transition transform hover:scale-[1.02] active:scale-95 shadow-sm whitespace-nowrap"
                >
                  {saveStatus === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Share size={14} />}
                  Create Share
                </button>
              )
            ) : (
              isEditingContent ? (
                <>
                  <button onClick={() => setIsEditingContent(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveShare}
                    disabled={saveStatus === "saving"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#C1FF00] text-black hover:bg-[#aee600] transition transform hover:scale-[1.02] active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    {saveStatus === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Note
                  </button>
                </>
              ) : (
                <>
                  {content.trim().length > 0 && (
                    <button
                      onClick={handleExplainWithAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition whitespace-nowrap"
                      title="Explain this with AI (opens ChatGPT)"
                    >
                      <Sparkles size={14} />
                      <span>Explain</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingContent(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition whitespace-nowrap"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition whitespace-nowrap"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={14} className="text-green-500" /> : <LinkIcon size={14} />}
                    <span className={cn(copiedLink && "text-green-500")}>
                      {copiedLink ? "Copied!" : "Link"}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleCopyStealthLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition group relative whitespace-nowrap"
                    title="Copy Private Stealth Link"
                  >
                    {copiedStealthLink ? <Check size={14} className="text-green-500" /> : <EyeOff size={14} />}
                    <span className={cn(copiedStealthLink && "text-green-500")}>
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
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition transform active:scale-95 whitespace-nowrap",
                      copiedContent 
                        ? "bg-green-500 text-white shadow-[0_4px_12px_-4px_rgba(34,197,94,0.5)]"
                        : "bg-[#C1FF00] text-[#1a1a1a] hover:bg-[#aee600] hover:shadow-[0_4px_12px_-4px_rgba(193,255,0,0.4)]"
                    )}
                  >
                    {copiedContent ? <Check size={14} /> : <Copy size={14} />}
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
          <div className="w-full mt-2 text-sm text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <X size={14} /> {idError}
          </div>
        )}
      </header>

      {/* Split Canvas Area */}
      <main className="flex-1 w-full flex relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 flex-row items-stretch">
        
        {/* Editor Half Parent (Stretches from flex-1) */}
        <div className="flex-1 w-full relative z-0 transition-all duration-300 min-h-0">
          
          {/* Editor Bounds (Absolute Lock) */}
          <div className="absolute inset-0 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isEditingContent ? "Paste your text here..." : "No content provided."}
              className="flex-1 w-full resize-none bg-transparent outline-none border-none text-[15px] sm:text-lg leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 p-2 sm:p-0"
              spellCheck="false"
              maxLength={100000}
              readOnly={!isEditingContent}
            />
            {isEditingContent && (
              <div className="absolute bottom-4 sm:bottom-0 right-4 sm:right-0 text-xs font-medium text-neutral-400 dark:text-neutral-500 pointer-events-none transition-all">
                {content.length.toLocaleString()} / 100,000
              </div>
            )}
          </div>
        </div>

        {/* Floating Guide Panel */}
        <aside className={cn(
          "absolute top-0 right-0 h-full bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-3xl sm:border-l border-neutral-200 dark:border-neutral-800 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] sm:shadow-[0_0_60px_-15px_rgba(0,0,0,0.1)] transition-transform duration-500 will-change-transform z-20 flex flex-col sm:static",
          // Layout constraints
          showGuide ? "w-full sm:w-80 lg:w-[400px] xl:w-[450px] shrink-0" : "w-0 overflow-hidden shrink-0 border-none",
          showGuide ? "translate-x-0" : "translate-x-full sm:translate-x-0"
        )}>
          {/* Guide Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0 bg-white/50 dark:bg-[#1a1a1a]/50 sticky top-0 z-10 backdrop-blur-md">
            <h2 className="text-[15px] font-extrabold text-[#1a1a1a] dark:text-neutral-100 flex items-center gap-2.5 tracking-tight uppercase">
              <span className="w-6 h-6 rounded-md bg-[#C1FF00] text-[#1a1a1a] flex items-center justify-center">
                <Info size={14} className="stroke-[3px]" />
              </span>
              How it works
            </h2>
            <button 
              onClick={() => setShowGuide(false)} 
              className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Guide Content: Scrollable Y */}
          <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-8 scrollbar-hide">
            
            {/* 1. Custom URL */}
            <div className="flex flex-col gap-3 group">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    1
                 </div>
                 <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Custom Links</h3>
               </div>
               <div className="pl-11 pr-2">
                 <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                   Create memorable short links universally accessible across any device without login instantly.
                 </p>
                 <div className="bg-neutral-100 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono flex items-center gap-2">
                   <Edit size={12} className="text-neutral-400" />
                   <span className="text-neutral-400 select-none">jobing.site/c/</span>
                   <span className="text-blue-500 font-bold">homework-1</span>
                 </div>
               </div>
            </div>

            {/* 2. Stealth Links */}
            <div className="flex flex-col gap-3 group">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <EyeOff size={14} />
                 </div>
                 <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Stealth Private Mode</h3>
               </div>
               <div className="pl-11 pr-2">
                 <p className="text-[12px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                   Using a private link by swapping <strong className="text-neutral-700 dark:text-neutral-300 font-mono">/c/</strong> for <strong className="text-neutral-700 dark:text-neutral-300 font-mono">/p/</strong>, it shows a "No internet" page. By clicking the dinosaur icon, you can securely copy the contents you saved.
                 </p>
                 <div className="mt-3 rounded-t-lg rounded-b-sm overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-950">
                   <img src="/privacypage.gif" alt="Privacy Page Stealth Guide" className="w-full h-auto object-contain" />
                 </div>
               </div>
            </div>

            {/* 3. Core Engine */}
            <div className="flex flex-col gap-3 group">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Save size={14} />
                 </div>
                 <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Manual Persistence</h3>
               </div>
               <div className="pl-11 pr-2">
                 <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                   Nothing limits you. Changes do not save automatically, allowing you to use <span className="font-mono bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-neutral-700 dark:text-neutral-300">/copy</span> as a local scratchpad. Once your clipboard payload is ready, simply smash <strong className="text-[#8bb800]">Create Share</strong> to commit limits out to the public relay server globally.
                 </p>
               </div>
            </div>

          </div>
        </aside>
      </main>

      {/* ─────── Brand Awareness CTA ─────── */}
      <footer className="w-full bg-[#C1FF00] border-t border-[#aee600] py-3 px-4 shrink-0 transition-colors z-10 selection:bg-black/10 relative">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-black/60 font-medium">
            <span className="hidden xs:inline">Powered by</span>
            <a 
              href="/" 
              target="_blank" 
              className="flex items-center gap-1.5 px-3 py-1 bg-black/5 border border-black/10 hover:border-black/20 rounded-full text-black transition-all shadow-sm group"
            >
              <img src="/logo.png" alt="Jobing AI" className="w-4 h-4 object-contain group-hover:scale-110 transition-transform" />
              <span className="font-extrabold tracking-tight text-[13px] uppercase">Jobing AI</span>
            </a>
          </div>
          <p className="text-black/50 text-xs sm:text-sm font-medium text-center sm:text-right">
            Stop getting rejected. <a href="/score" target="_blank" onClick={() => track("tool_cta_click", { from: "copy_footer", target: "score" })} className="text-black hover:text-black/80 underline decoration-black/30 hover:decoration-black/60 underline-offset-4 transition-all font-bold">Check your AI-Readiness Score</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
