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
        className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] border border-[#cfd4cb] px-3 py-3 text-sm font-semibold text-[#4d554b] transition-colors hover:bg-[#f7f8f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] disabled:cursor-wait disabled:opacity-60 sm:px-4"
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
        className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] bg-[#151914] px-3 py-3 text-sm font-bold text-white transition-colors hover:bg-[#293025] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] disabled:cursor-wait disabled:opacity-75 sm:px-4"
      >
        {isApproving ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        {isApproving ? "Connecting..." : "Allow access"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {isApproving
          ? "Approving connection. You will return to your AI app shortly."
          : isDenying
            ? "Denying connection. You will return to your AI app shortly."
            : ""}
      </span>
    </>
  );
}
