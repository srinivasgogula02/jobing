"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Share row for a blog post. Server passes the canonical absolute URL + title so
 * the share targets work even before hydration metadata is available. Each action
 * fires a `blog_shared` event (with the network) so we can see which posts travel.
 */
export default function BlogShareButtons({
  url,
  title,
  permalink,
}: {
  url: string;
  title: string;
  permalink: string;
}) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const open = (network: string, shareUrl: string) => {
    track("blog_shared", { network, permalink });
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=540");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("blog_shared", { network: "copy", permalink });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        track("blog_shared", { network: "native", permalink });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      handleCopy();
    }
  };

  const btn =
    "flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#e5e5e5] text-[13px] font-bold text-[#1a1a1a] hover:bg-[#fafafa] hover:border-[#d4d4d4] transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] mr-1">
        Share
      </span>

      <button onClick={handleCopy} className={btn} title="Copy link" aria-label="Copy link">
        {copied ? <Check size={15} className="text-[#16a34a]" /> : <Link2 size={15} />}
        <span className={copied ? "text-[#16a34a]" : ""}>{copied ? "Copied!" : "Copy"}</span>
      </button>

      <button
        onClick={() =>
          open("whatsapp", `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)
        }
        className={btn}
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.738-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        WhatsApp
      </button>

      <button
        onClick={() =>
          open("x", `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`)
        }
        className={btn}
        title="Share on X"
        aria-label="Share on X"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X
      </button>

      <button
        onClick={() =>
          open(
            "linkedin",
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
          )
        }
        className={btn}
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
        </svg>
        LinkedIn
      </button>

      <button
        onClick={handleNativeShare}
        className="sm:hidden flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-bold hover:bg-black transition-colors"
        title="Share"
        aria-label="Share"
      >
        <Share2 size={15} /> More
      </button>
    </div>
  );
}
