"use client";

import { useState } from "react";

export function CopyBox({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <div className={`copy-box${code ? " copy-box--code" : ""}`}><div><span>{label}</span><button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>{code ? <pre><code>{value}</code></pre> : <code>{value}</code>}</div>;
}
