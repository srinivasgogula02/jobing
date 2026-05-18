"use client";

import { useState } from "react";
import Link from "next/link";
import { Code, Edit, ExternalLink, X } from "lucide-react";

interface DeployedPageViewProps {
  id: string;
  htmlContent: string;
}

export default function DeployedPageView({ id, htmlContent }: DeployedPageViewProps) {
  const [showBadge, setShowBadge] = useState(true);

  return (
    <div className="h-[100dvh] w-full overflow-hidden relative bg-white">
      {/* Full-viewport sandboxed iframe — this IS the deployed page */}
      <iframe
        srcDoc={htmlContent}
        title={`${id} — Jobing Pages`}
        className="w-full h-full border-none"
        sandbox="allow-forms allow-modals allow-scripts allow-popups"
      />

      {/* Floating "Powered by" badge — dismissible */}
      {showBadge && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#1a1a1a]/90 backdrop-blur-xl border border-neutral-700 rounded-full py-2 px-4 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Link
            href="/pages"
            className="flex items-center gap-2 text-white/90 hover:text-[#C1FF00] transition-colors group"
          >
            <div className="w-5 h-5 rounded-full bg-[#C1FF00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code size={12} className="text-[#1a1a1a]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Jobing Pages
            </span>
          </Link>

          <div className="w-px h-4 bg-neutral-700 mx-1" />

          <Link
            href={`/pages/${id}/edit`}
            className="text-neutral-400 hover:text-[#C1FF00] transition-colors"
            title="Edit this page"
          >
            <Edit size={14} />
          </Link>

          <button
            onClick={() => setShowBadge(false)}
            className="text-neutral-500 hover:text-white transition-colors ml-1 pl-1 border-l border-neutral-700"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
