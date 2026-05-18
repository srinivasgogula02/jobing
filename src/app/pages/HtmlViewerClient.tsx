"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { savePage, checkPageIdTaken, getUserPages, deletePage } from "@/app/actions/pages";
import {
  Copy,
  Trash2,
  Maximize2,
  Check,
  Edit,
  Loader2,
  X,
  Rocket,
  Save,
  Link as LinkIcon,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Clock,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Page</title>
<style>
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background-color: #f8fafc;
    color: #334155;
  }
  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    text-align: center;
    max-width: 400px;
    width: 90%;
  }
  h1 { 
    color: #1a1a1a; 
    margin-top: 0; 
    font-weight: 800;
    letter-spacing: -0.025em;
  }
  p {
    line-height: 1.6;
    margin-bottom: 0;
  }
  .badge {
    display: inline-block;
    background: #C1FF00;
    color: #1a1a1a;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">Live Preview</div>
    <h1>Hello, World!</h1>
    <p>Edit this HTML and hit <strong>Deploy</strong> to publish it to a live URL instantly.</p>
  </div>
</body>
</html>`;

interface HtmlViewerClientProps {
  id: string;
  initialHtml: string;
  isNew?: boolean;
}

export default function HtmlViewerClient({ id, initialHtml, isNew = false }: HtmlViewerClientProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [htmlInput, setHtmlInput] = useState(initialHtml || (isNew ? STARTER_HTML : ""));
  const [debouncedHtml, setDebouncedHtml] = useState(htmlInput);
  const [isEditingContent, setIsEditingContent] = useState(isNew);

  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");
  const [deployError, setDeployError] = useState("");

  // Custom ID editing
  const [isEditingId, setIsEditingId] = useState(false);
  const [currentId, setCurrentId] = useState(id);
  const [newId, setNewId] = useState(id);
  const [idError, setIdError] = useState("");
  const [checkingId, setCheckingId] = useState(false);

  const [hostname, setHostname] = useState("jobing.site");
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPages, setUserPages] = useState<{ id: string; updated_at: string }[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Guest warning modal
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  useEffect(() => {
    setHostname(window.location.host);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserPages();
    } else {
      setUserPages([]);
    }
  }, [isLoaded, isSignedIn]);

  // ─── LocalStorage Backup (Prevents data loss on login redirects) ───
  useEffect(() => {
    if (isNew && htmlInput && htmlInput !== STARTER_HTML) {
      localStorage.setItem("jobing_pages_backup", htmlInput);
    }
  }, [htmlInput, isNew]);

  useEffect(() => {
    if (isNew) {
      const backup = localStorage.getItem("jobing_pages_backup");
      if (backup && backup !== STARTER_HTML) {
        setHtmlInput(backup);
      }
    }
  }, [isNew]);
  // ──────────────────────────────────────────────────────────────

  // Close guest warning if they successfully log in via the modal
  useEffect(() => {
    if (isSignedIn && showGuestWarning) {
      setShowGuestWarning(false);
    }
  }, [isSignedIn, showGuestWarning]);

  const fetchUserPages = async () => {
    setLoadingPages(true);
    const pages = await getUserPages();
    setUserPages(pages);
    setLoadingPages(false);
  };

  const handleDeletePage = async (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete '${pageId}'?`)) {
      const result = await deletePage(pageId);
      if (result.success) {
        fetchUserPages();
        if (currentId === pageId && !isNew) {
          router.push("/pages");
        }
      } else {
        alert(result.error || "Failed to delete page.");
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [htmlInput]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pages/${currentId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setHtmlInput("");
      localStorage.removeItem("jobing_pages_backup");
    }
  };

  const handleOpenFull = () => {
    const blob = new Blob([debouncedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
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

    const isTaken = await checkPageIdTaken(cleanId);

    if (isTaken) {
      setIdError("Taken.");
      setCheckingId(false);
    } else {
      if (isNew) {
        setCurrentId(cleanId);
        setNewId(cleanId);
        setIsEditingId(false);
        setCheckingId(false);
      } else {
        await savePage(cleanId, htmlInput);
        router.push(`/pages/${cleanId}/edit`);
      }
    }
  };

  const executeDeploy = async () => {
    setDeployStatus("deploying");
    setDeployError("");

    const result = await savePage(currentId, htmlInput);

    if (result.success) {
      setDeployStatus("deployed");
      if (isSignedIn) fetchUserPages(); // Refresh sidebar list
      
      // Clear backup since it's saved to DB now
      if (isNew) localStorage.removeItem("jobing_pages_backup");
      
      setTimeout(() => setDeployStatus("idle"), 2500);
      
      // Open the deployed page in a new tab
      window.open(`/pages/${currentId}`, '_blank', 'noopener,noreferrer');
      
      if (isNew) {
        if (isSignedIn) {
          router.push(`/pages/${currentId}/edit`);
        }
      } else {
        setIsEditingContent(false);
      }
    } else {
      setDeployStatus("error");
      setDeployError(result.error || "Something went wrong.");
    }
  };

  const handleDeployClick = () => {
    if (isNew && !htmlInput.trim()) return;
    
    // Warn guests before deploying
    if (!isSignedIn) {
      setShowGuestWarning(true);
    } else {
      executeDeploy();
    }
  };

  const handleDeployAnyway = () => {
    setShowGuestWarning(false);
    executeDeploy();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans transition-colors duration-300">
      
      {/* ─── Slide-out Overlay Sidebar for Logged-In Users ─── */}
      {isLoaded && isSignedIn && (
        <>
          <div 
            className={cn(
              "fixed inset-y-0 left-0 z-50 bg-[#111] border-r border-[#333] transition-transform duration-300 flex flex-col shadow-2xl w-64",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#333] shrink-0">
              <span className="text-white text-xs font-bold uppercase tracking-wider">My Pages</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {loadingPages ? (
                <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-neutral-500" /></div>
              ) : userPages.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center mt-4">No pages yet.</p>
              ) : (
                userPages.map(page => (
                  <div key={page.id} className="relative group">
                    <Link
                      href={`/pages/${page.id}/edit`}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-2 pr-8 rounded-md transition-colors",
                        currentId === page.id ? "bg-[#C1FF00]/10 text-[#C1FF00]" : "hover:bg-[#222] text-neutral-400 hover:text-white"
                      )}
                      title={page.id}
                    >
                      <FileText size={16} className="shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{page.id}</span>
                        <span className="text-[10px] flex items-center gap-1 opacity-60">
                          <Clock size={10} /> {new Date(page.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleDeletePage(e, page.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete page"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Create New Button in Sidebar */}
            <div className="p-3 border-t border-[#333]">
              <Link 
                href="/pages"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2 bg-[#C1FF00] text-[#1a1a1a] rounded-md font-bold text-sm hover:bg-[#aee600] transition-colors"
              >
                + Create New Page
              </Link>
            </div>
          </div>
          
          {/* Overlay Backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity animate-in fade-in" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 z-0">
        
        {/* ─── Main Split Canvas ─── */}
        <main className="flex flex-col lg:flex-row flex-1 w-full overflow-hidden">
          {/* Editor Pane */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 bg-[#1a1a1a] h-[50vh] lg:h-full overflow-hidden min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-5 py-2.5 bg-[#0a0a0a] border-b border-[#333] shrink-0 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
                {isLoaded && isSignedIn && (
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-1 mr-1 text-neutral-400 hover:text-white transition-colors flex items-center justify-center bg-[#222] hover:bg-[#333] rounded"
                    title="My Pages"
                  >
                    <PanelLeftOpen size={16} />
                  </button>
                )}
                <Link href="/pages" className="flex items-center gap-1.5 shrink-0" title="Jobing Pages">
                  <img src="/logo.png" alt="Jobing Pages" className="w-5 h-5 object-contain hover:scale-105 transition-transform" />
                  <span className="text-[#C1FF00] text-xs font-black uppercase tracking-wider hidden sm:inline">Jobing Pages</span>
                </Link>
                <div className="h-4 w-px bg-[#333] mx-1 shrink-0"></div>
                
                {isEditingId ? (
                  <form onSubmit={handleChangeId} className="flex items-center gap-1 min-w-0 flex-1">
                    <div className="flex bg-[#1a1a1a] rounded ring-1 ring-[#333] focus-within:ring-[#C1FF00] transition-shadow overflow-hidden flex-1 sm:flex-none">
                      <span className="px-2 py-1 text-xs text-neutral-500 bg-[#222] border-r border-[#333] select-none flex items-center shrink-0">
                        {hostname}/pages/
                      </span>
                      <input
                        type="text"
                        value={newId}
                        onChange={(e) => {
                          setNewId(e.target.value.toLowerCase());
                          setIdError("");
                        }}
                        autoFocus
                        className="bg-transparent border-none outline-none py-1 px-2 text-xs w-full sm:w-24 text-white placeholder:text-neutral-600 min-w-0"
                        placeholder="my-page"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={checkingId}
                      className="p-1 text-[#1a1a1a] bg-[#C1FF00] hover:bg-[#aee600] rounded transition-colors disabled:opacity-50 shrink-0"
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
                      className="p-1 text-neutral-400 hover:text-white bg-[#222] hover:bg-[#333] rounded transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <div
                    className="flex items-center gap-1.5 group cursor-pointer hover:bg-[#222] px-2 py-1 rounded transition-colors min-w-0 overflow-hidden"
                    onClick={() => setIsEditingId(true)}
                    title="Edit custom URL"
                  >
                    <span className="text-[#a3a3a3] text-xs font-medium shrink-0 truncate">jobing.site/pages/</span>
                    <span className="text-[#C1FF00] text-xs font-bold truncate">{currentId}</span>
                    <Edit size={12} className="text-neutral-500 group-hover:text-[#C1FF00] transition-colors shrink-0" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors",
                    copied
                      ? "bg-[#C1FF00]/20 text-[#C1FF00]"
                      : "text-[#a3a3a3] hover:text-[#1a1a1a] hover:bg-[#C1FF00]"
                  )}
                  title="Copy Code"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"
                  title="Clear Editor"
                >
                  <Trash2 size={14} /> <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste your HTML code here..."
                className="absolute inset-0 w-full h-full bg-transparent text-[#e5e5e5] p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-0 custom-scrollbar overflow-y-auto"
                spellCheck={false}
                maxLength={500000}
                readOnly={!isNew && !isEditingContent}
              />
              {(isNew || isEditingContent) && (
                <div className="absolute bottom-3 right-5 text-xs font-medium text-neutral-600 pointer-events-none">
                  {htmlInput.length.toLocaleString()} / 500,000
                </div>
              )}
            </div>
          </div>

          {/* Preview Pane */}
          <div className="flex-1 flex flex-col bg-white h-[50vh] lg:h-full relative overflow-hidden min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-[#f8fafc] border-b border-[#e5e5e5] shrink-0">
              <div className="flex items-center gap-2 text-[#1a1a1a]">
                <div className="w-2 h-2 rounded-full bg-[#C1FF00] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Live Preview
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFull}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-[#1a1a1a] hover:bg-neutral-200 rounded transition-all"
                  title="Open in new tab"
                >
                  <Maximize2 size={14} /> <span className="hidden sm:inline">Full</span>
                </button>
                
                <div className="w-px h-4 bg-neutral-300 mx-1"></div>

                {isNew ? (
                  /* ─── New page: show Deploy button ─── */
                  htmlInput.trim().length > 0 && (
                    <button
                      onClick={handleDeployClick}
                      disabled={deployStatus === "deploying"}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded bg-[#1a1a1a] text-[#C1FF00] hover:bg-black transition transform hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      {deployStatus === "deploying" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Rocket size={14} />
                      )}
                      Deploy
                    </button>
                  )
                ) : isEditingContent ? (
                  /* ─── Editing existing page ─── */
                  <>
                    <button
                      onClick={() => {
                        setIsEditingContent(false);
                        setHtmlInput(initialHtml);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeployClick}
                      disabled={deployStatus === "deploying"}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded bg-[#1a1a1a] text-[#C1FF00] hover:bg-black transition transform hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      {deployStatus === "deploying" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </button>
                  </>
                ) : (
                  /* ─── Viewing existing page ─── */
                  <>
                    <button
                      onClick={() => setIsEditingContent(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-neutral-200 hover:bg-neutral-300 transition"
                    >
                      <Edit size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded bg-[#1a1a1a] text-[#C1FF00] hover:bg-black transition transform hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      {copiedLink ? <Check size={14} className="text-green-400" /> : <LinkIcon size={14} />}
                      {copiedLink ? "Copied!" : <span className="hidden sm:inline">Copy Link</span>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <iframe
              srcDoc={debouncedHtml}
              title="HTML Live Preview"
              className="flex-1 w-full h-full border-none bg-white"
              sandbox="allow-forms allow-modals allow-scripts allow-popups allow-same-origin"
            />
            
            {deployError && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2">
                <X size={14} /> {deployError}
              </div>
            )}
            {idError && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2">
                <X size={14} /> {idError}
              </div>
            )}
          </div>
        </main>

        {/* ─── Footer / Brand CTA ─── */}
        <footer className="w-full bg-[#C1FF00] border-t border-[#aee600] py-3 px-4 shrink-0 transition-colors z-10 selection:bg-black/10 relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-black/60 font-medium">
              <span className="hidden xs:inline">Powered by</span>
              <a
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1 bg-black/5 border border-black/10 hover:border-black/20 rounded-full text-black transition-all shadow-sm group"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-black group-hover:scale-110 transition-transform shadow-[0_0_8px_rgba(0,0,0,0.1)]"></div>
                <span className="font-extrabold tracking-tight text-[13px] uppercase">
                  Jobing AI
                </span>
              </a>
            </div>
            <p className="text-black/50 text-xs sm:text-sm font-medium text-center sm:text-right">
              Stop getting rejected.{" "}
              <a
                href="/"
                target="_blank"
                className="text-black hover:text-black/80 underline decoration-black/30 hover:decoration-black/60 underline-offset-4 transition-all font-bold"
              >
                Tailor your resume in 30 seconds
              </a>
              .
            </p>
          </div>
        </footer>
      </div>

      {/* ─── Guest Warning Modal ─── */}
      {showGuestWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 transform transition-all">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Deploying Anonymously</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              You are about to deploy this page without logging in. <strong className="text-neutral-900 dark:text-neutral-200">Anonymous pages are permanently locked and cannot be edited later.</strong> 
              <br/><br/>
              Log in now to save this page to your account so you can update it anytime. (Your code is safely backed up).
            </p>
            <div className="flex flex-col gap-3">
              <SignInButton mode="modal" forceRedirectUrl="/pages">
                <button className="w-full py-2.5 rounded-lg bg-[#1a1a1a] dark:bg-[#C1FF00] text-white dark:text-[#1a1a1a] font-bold text-sm hover:bg-black dark:hover:bg-[#aee600] transition shadow-md">
                  Log In to Save
                </button>
              </SignInButton>
              <button 
                onClick={handleDeployAnyway}
                className="w-full py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                Deploy Anonymously
              </button>
              <button 
                onClick={() => setShowGuestWarning(false)}
                className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
