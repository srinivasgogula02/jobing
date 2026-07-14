"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { approveAuthorization, denyAuthorization } from "./actions";

type Intent = "approve" | "deny" | null;

export function AuthorizationActions() {
  const { pending } = useFormStatus();
  const [intent, setIntent] = useState<Intent>(null);
  const isApproving = pending && intent === "approve";
  const isDenying = pending && intent === "deny";

  return (
    <>
      <button
        type="submit"
        formAction={denyAuthorization}
        disabled={pending}
        aria-busy={isDenying}
        onClick={() => setIntent("deny")}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#262D3A] px-4 py-3 font-semibold transition-colors hover:bg-[#1F2531] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6F24E] disabled:cursor-wait disabled:opacity-60"
      >
        {isDenying ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        {isDenying ? "Denying..." : "Deny"}
      </button>
      <button
        type="submit"
        formAction={approveAuthorization}
        disabled={pending}
        aria-busy={isApproving}
        onClick={() => setIntent("approve")}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C6F24E] px-4 py-3 font-bold text-[#0E1219] transition-colors hover:bg-[#D4FA70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6F24E] disabled:cursor-wait disabled:opacity-75"
      >
        {isApproving ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        {isApproving ? "Connecting..." : "Allow access"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {isApproving
          ? "Connection approved. Returning you to your AI app."
          : isDenying
            ? "Connection denied. Returning you to your AI app."
            : ""}
      </span>
    </>
  );
}
