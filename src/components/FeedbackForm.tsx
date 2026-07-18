"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  Compass,
  CreditCard,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { submitFeedback } from "@/app/actions/feedback";
import { track } from "@/lib/analytics";

const MOODS = [
  { value: 1, label: "Bad" },
  { value: 2, label: "Poor" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
] as const;

type Category = "bug" | "idea" | "ux" | "pricing" | "praise" | "other";

const CATEGORIES: { value: Category; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Something broke", icon: Bug },
  { value: "ux", label: "Something was confusing", icon: Compass },
  { value: "idea", label: "I need a capability", icon: Lightbulb },
  { value: "pricing", label: "Pricing or limits", icon: CreditCard },
  { value: "praise", label: "Something worked well", icon: Heart },
  { value: "other", label: "Something else", icon: MessageCircle },
];

function promptFor(rating: number | null) {
  if (rating !== null && rating <= 2) {
    return {
      heading: "What stopped you?",
      placeholder: "Example: I published a form, but the page did not show the success message after submitting.",
    };
  }
  if (rating === 3) {
    return {
      heading: "What would have made it work better?",
      placeholder: "Tell us which step was unclear, slower than expected, or missing something you needed.",
    };
  }
  if (rating !== null && rating >= 4) {
    return {
      heading: "What worked, and what should we improve next?",
      placeholder: "Tell us the useful part and the one change that would make the workflow better.",
    };
  }
  return {
    heading: "What should we know?",
    placeholder: "Describe what you tried, what you expected, and what happened instead.",
  };
}

function suggestedCategory(rating: number | null): Category {
  if (rating === null) return "other";
  if (rating <= 2) return "bug";
  if (rating === 3) return "ux";
  if (rating === 4) return "idea";
  return "praise";
}

const MAX = 2000;

export function FeedbackForm() {
  const { user, isSignedIn } = useUser();
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailPrefilled, setEmailPrefilled] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const userEmail = user.primaryEmailAddress?.emailAddress || "";
    if (userEmail && !email) {
      setEmail(userEmail);
      setEmailPrefilled(true);
    }
    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (userName && !name) setName(userName);
    // Contact fields should be initialized once from Clerk, not rewritten while
    // the user is editing them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

  const prompt = useMemo(() => promptFor(rating), [rating]);
  const hasMessage = message.trim().length >= 2;
  const overLimit = message.length > MAX;
  const canSubmit = hasMessage && !overLimit && status !== "pending";

  function markStarted(properties: Record<string, string | number> = {}) {
    if (startedRef.current) return;
    startedRef.current = true;
    track("feedback_started", properties);
  }

  function pickMood(value: number) {
    setRating(value);
    setError("");
    if (category === null) setCategory(suggestedCategory(value));
    markStarted({ rating: value });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      if (!hasMessage) setError("Add a few words so we know what to act on.");
      return;
    }

    setStatus("pending");
    setError("");
    const page = typeof window !== "undefined" ? document.referrer || window.location.href : "";
    const result = await submitFeedback({
      rating: rating ?? undefined,
      category: category ?? "other",
      message: message.trim(),
      email: email.trim(),
      name: name.trim(),
      page,
      company,
    });

    if (result.success) {
      setStatus("success");
      track("feedback_submitted", {
        rating: rating ?? 0,
        category: category ?? "other",
        signed_in: Boolean(isSignedIn),
      });
      return;
    }

    setStatus("error");
    setError(result.error);
  }

  function reset() {
    setRating(null);
    setCategory(null);
    setMessage("");
    setStatus("idle");
    setError("");
    startedRef.current = false;
  }

  if (status === "success") {
    return (
      <div className="py-5 sm:py-8">
        <span className="grid h-12 w-12 place-items-center rounded-[4px] bg-[#baff29] text-[#151914]">
          <CheckCircle2 size={23} />
        </span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[.16em] text-[#719500]">Feedback received</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-.035em] text-[#151914]">Thank you. We have enough to investigate.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#6e756b]">
          A real person reads every message. If you included an email and the report needs a reply, we can contact you directly.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-[#cfd4cb] px-4 text-sm font-semibold text-[#151914] hover:bg-[#f7f8f4]">
            Send another report
          </button>
          <Link href={isSignedIn ? "/dashboard" : "/"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[4px] bg-[#151914] px-4 text-sm font-semibold text-white hover:bg-[#293025]">
            {isSignedIn ? "Return to dashboard" : "Return to Jobing"} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-[.14em] text-[#6e756b]">Overall experience <span className="normal-case tracking-normal text-[#a0a69d]">optional</span></legend>
        <div className="mt-3 grid grid-cols-5 border border-[#dfe3da]" role="radiogroup" aria-label="Overall experience">
          {MOODS.map((mood, index) => {
            const active = rating === mood.value;
            return (
              <button
                key={mood.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickMood(mood.value)}
                className={`min-h-[58px] border-r border-[#dfe3da] px-1 py-2 text-center transition-colors last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#719500] ${active ? "bg-[#151914] text-white" : "bg-white text-[#6e756b] hover:bg-[#f3f5f0]"}`}
              >
                <span className={`block font-mono text-[11px] ${active ? "text-[#baff29]" : "text-[#92998f]"}`}>0{index + 1}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold sm:text-xs">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-[.14em] text-[#6e756b]">What is this about?</legend>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategory(active ? null : item.value);
                  markStarted({ category: item.value });
                }}
                className={`flex min-h-11 items-center gap-3 rounded-[4px] border px-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] ${active ? "border-[#151914] bg-[#eefbd0] text-[#151914]" : "border-[#dfe3da] bg-white text-[#586056] hover:border-[#9ca497]"}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[3px] ${active ? "bg-[#151914] text-[#baff29]" : "bg-[#f0f2ed] text-[#687064]"}`}>
                  {active ? <Check size={14} /> : <Icon size={14} />}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="feedback-message" className="block text-sm font-bold text-[#151914]">{prompt.heading}</label>
        <p className="mt-1 text-xs leading-5 text-[#858c82]">Specific steps help us reproduce a problem faster. Do not include passwords, form responses, or private customer data.</p>
        <div className="relative mt-3">
          <textarea
            id="feedback-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              markStarted({ entry: "message" });
              if (error) setError("");
            }}
            placeholder={prompt.placeholder}
            rows={7}
            maxLength={MAX + 200}
            className="w-full resize-y rounded-[4px] border border-[#cfd4cb] bg-white px-4 py-3.5 text-[15px] leading-6 text-[#151914] placeholder:text-[#a3a9a0] focus:border-[#719500] focus:outline-none focus:ring-2 focus:ring-[#baff29]/45"
          />
          <span className={`absolute bottom-3 right-3 bg-white px-1 font-mono text-[10px] ${overLimit ? "text-[#a83932]" : "text-[#a3a9a0]"}`}>{message.length}/{MAX}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block font-mono text-[10px] uppercase tracking-[.12em] text-[#6e756b]" htmlFor="feedback-name">
          Name <span className="normal-case tracking-normal text-[#a0a69d]">optional</span>
          <input id="feedback-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" className="mt-2 min-h-11 w-full rounded-[4px] border border-[#cfd4cb] bg-white px-3 font-sans text-sm normal-case tracking-normal text-[#151914] placeholder:text-[#a3a9a0] focus:border-[#719500] focus:outline-none focus:ring-2 focus:ring-[#baff29]/45" />
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[.12em] text-[#6e756b]" htmlFor="feedback-email">
          Email <span className="normal-case tracking-normal text-[#a0a69d]">{emailPrefilled ? "for a reply" : "optional"}</span>
          <input id="feedback-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 min-h-11 w-full rounded-[4px] border border-[#cfd4cb] bg-white px-3 font-sans text-sm normal-case tracking-normal text-[#151914] placeholder:text-[#a3a9a0] focus:border-[#719500] focus:outline-none focus:ring-2 focus:ring-[#baff29]/45" />
        </label>
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company (leave blank)</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </div>

      {error ? (
        <div role="alert" className={`flex items-start gap-2.5 rounded-[4px] border px-4 py-3 text-[13px] ${status === "error" ? "border-[#e1b8b4] bg-[#fff5f3] text-[#943a32]" : "border-[#e4d1a4] bg-[#fff9e9] text-[#815d13]"}`}>
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[#e4e7e0] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-5 text-[#858c82]">We include the current page address so a bug is easier to reproduce. Your contact details are used only when a reply is useful.</p>
        <button type="submit" disabled={!canSubmit} className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[4px] px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#719500] ${canSubmit ? "bg-[#baff29] text-[#151914] hover:bg-[#a9eb16]" : "cursor-not-allowed bg-[#e7eae4] text-[#9ca398]"}`}>
          {status === "pending" ? <><Loader2 className="animate-spin" size={16} /> Sending feedback</> : <><Send size={16} /> Send feedback</>}
        </button>
      </div>
    </form>
  );
}
