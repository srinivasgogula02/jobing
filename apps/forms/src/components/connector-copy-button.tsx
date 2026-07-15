"use client";

import { useState } from "react";

export function ConnectorCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      const copyWithFallback = () => {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copiedWithFallback = document.execCommand("copy");
        textarea.remove();
        return copiedWithFallback;
      };

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          if (!copyWithFallback()) throw new Error("Copy command was rejected");
        }
      } else if (!copyWithFallback()) {
        throw new Error("Copy command was rejected");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copyValue} aria-live="polite">
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
