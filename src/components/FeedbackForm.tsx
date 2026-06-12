"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  Bug,
  Lightbulb,
  Compass,
  CreditCard,
  Heart,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { submitFeedback } from "@/app/actions/feedback";
import { track } from "@/lib/analytics";

// ─── Static config ───────────────────────────────────────────────────────────
// Five faces. The leftmost is intentionally a real frown — making "I'm unhappy"
// a low-effort single tap is the whole point; people who are annoyed won't write
// a paragraph, but they'll tap a face, and that tap is itself signal.
const MOODS = [
  { value: 1, emoji: "😖", label: "Terrible" },
  { value: 2, emoji: "🙁", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🤩", label: "Amazing" },
] as const;

type Category = "bug" | "idea" | "ux" | "pricing" | "praise" | "other";

const CATEGORIES: { value: Category; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Something broke", icon: Bug },
  { value: "idea", label: "Feature idea", icon: Lightbulb },
  { value: "ux", label: "Confusing", icon: Compass },
  { value: "pricing", label: "Pricing", icon: CreditCard },
  { value: "praise", label: "Love it", icon: Heart },
  { value: "other", label: "Something else", icon: MessageCircle },
];

// The prompt and placeholder shift with the mood so the page feels like it's
// actually listening rather than showing one generic box. Negative moods get a
// "what went wrong" framing; positive moods get a "what clicked" framing.
function promptFor(rating: number | null): { heading: string; placeholder: string } {
  switch (rating) {
    case 1:
    case 2:
      return {
        heading: "We're sorry that wasn't great. What went wrong?",
        placeholder:
          "Tell us exactly what broke or frustrated you — the more specific, the faster we can fix it. (e.g. 'the resume export gave me a blank PDF on my phone')",
      };
    case 3:
      return {
        heading: "Thanks. What would have made it a 5?",
        placeholder:
          "What felt almost-there? Even a small thing — a button you couldn't find, a step that felt slow — helps a lot.",
      };
    case 4:
      return {
        heading: "Glad it worked! What's the one thing you'd improve?",
        placeholder:
          "You liked it — what's the single change that would make you love it?",
      };
    case 5:
      return {
        heading: "Amazing — what did you love? 🎉",
        placeholder:
          "What clicked for you? And if there's one thing you wish it also did, drop that too.",
      };
    default:
      return {
        heading: "Tell us anything",
        placeholder:
          "A bug, an idea, something that confused you, or just what you think. We read every message.",
      };
  }
}

// Suggest the category that usually matches the mood, but never force it.
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

  // Honeypot. Hidden from humans; a filled value means a bot.
  const [company, setCompany] = useState("");

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const startedRef = useRef(false);

  // Prefill contact details for signed-in users so they don't retype anything.
  useEffect(() => {
    if (isSignedIn && user) {
      const e = user.primaryEmailAddress?.emailAddress || "";
      if (e && !email) {
        setEmail(e);
        setEmailPrefilled(true);
      }
      const n = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (n && !name) setName(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

  const prompt = useMemo(() => promptFor(rating), [rating]);
  const hasMessage = message.trim().length >= 2;
  const overLimit = message.length > MAX;
  const canSubmit = hasMessage && !overLimit && status !== "pending";

  function pickMood(value: number) {
    setRating(value);
    setError("");
    // Pre-select the most likely category on first mood pick (still editable).
    if (category === null) setCategory(suggestedCategory(value));
    if (!startedRef.current) {
      startedRef.current = true;
      track("feedback_started", { rating: value });
    }
    // Move focus to the textarea so writing is the obvious next action.
    requestAnimationFrame(() => messageRef.current?.focus());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (!hasMessage) setError("Add a few words so we know what to act on.");
      return;
    }
    setStatus("pending");
    setError("");

    // Captured silently to make bug reports reproducible. Transparent — see the
    // privacy note rendered under the form.
    const page =
      typeof document !== "undefined"
        ? document.referrer || (typeof window !== "undefined" ? window.location.href : "")
        : "";

    const result = await submitFeedback({
      rating: rating ?? undefined,
      category: category ?? "other",
      message: message.trim(),
      email: email.trim(),
      name: name.trim(),
      page,
      company, // honeypot
    });

    if (result.success) {
      setStatus("success");
      track("feedback_submitted", {
        rating: rating ?? 0,
        category: category ?? "other",
        signed_in: !!isSignedIn,
      });
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  function reset() {
    setRating(null);
    setCategory(null);
    setMessage("");
    setStatus("idle");
    setError("");
    startedRef.current = false;
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 rounded-3xl bg-[#C1FF00]/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[#1a1a1a]" />
        </div>
        <h2 className="text-2xl font-black text-[#1a1a1a] mb-3 tracking-tight">
          Got it — thank you. 🙌
        </h2>
        <p className="text-[15px] text-[#4b5563] leading-relaxed max-w-md mx-auto mb-2">
          A real person reads every single message. If you left your email and it
          needs a reply, you&apos;ll hear back from us directly.
        </p>
        <p className="text-[13px] text-[#9ca3af] mb-8">
          Feedback like yours is literally how the roadmap gets written.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl border border-[#e5e5e5] text-[#1a1a1a] font-bold text-sm hover:bg-[#fafafa] transition-colors"
          >
            Send more feedback
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white font-bold text-sm hover:scale-[1.03] transition-transform flex items-center justify-center gap-2"
          >
            Back to Jobing
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Step 1 — mood */}
      <fieldset>
        <legend className="block text-sm font-black text-[#1a1a1a] mb-4 uppercase tracking-wider">
          How&apos;s Jobing been for you?
        </legend>
        <div className="flex flex-wrap gap-2 sm:gap-3" role="radiogroup" aria-label="Overall experience">
          {MOODS.map((m) => {
            const active = rating === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={m.label}
                onClick={() => pickMood(m.value)}
                className={`group flex-1 min-w-[60px] flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                  active
                    ? "border-[#1a1a1a] bg-[#C1FF00]/15 scale-[1.04] shadow-sm"
                    : "border-[#e5e5e5] hover:border-[#1a1a1a]/30 hover:bg-[#fafafa]"
                }`}
              >
                <span className={`text-2xl sm:text-3xl transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}>
                  {m.emoji}
                </span>
                <span className={`text-[11px] font-bold ${active ? "text-[#1a1a1a]" : "text-[#9ca3af]"}`}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Step 2 — category. Revealed once a mood is picked to avoid overwhelming
          a blank page, but optional: users can also jump straight to writing. */}
      {(rating !== null || message.length > 0) && (
        <fieldset className="animate-fade-in-up">
          <legend className="block text-sm font-black text-[#1a1a1a] mb-4 uppercase tracking-wider">
            What&apos;s it about?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? null : c.value)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-bold transition-all ${
                    active
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                      : "border-[#e5e5e5] text-[#4b5563] hover:border-[#1a1a1a]/30 hover:bg-[#fafafa]"
                  }`}
                >
                  <Icon size={15} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Step 3 — the message (always available) */}
      <div>
        <label htmlFor="feedback-message" className="block text-sm font-black text-[#1a1a1a] mb-3 tracking-tight">
          {prompt.heading}
        </label>
        <div className="relative">
          <textarea
            id="feedback-message"
            ref={messageRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError("");
            }}
            placeholder={prompt.placeholder}
            rows={5}
            maxLength={MAX + 200 /* let them paste then trim, validation guards the real cap */}
            className="w-full resize-y rounded-2xl border border-[#e5e5e5] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#C1FF00]/40 transition-all"
          />
          <span
            className={`absolute bottom-3 right-3 text-[11px] font-bold tabular-nums ${
              overLimit ? "text-red-500" : "text-[#d1d5db]"
            }`}
          >
            {message.length}/{MAX}
          </span>
        </div>
      </div>

      {/* Contact — optional, prefilled when signed in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="feedback-name" className="block text-[12px] font-bold text-[#6b7280] mb-2 uppercase tracking-wider">
            Name <span className="text-[#d1d5db] normal-case font-medium">(optional)</span>
          </label>
          <input
            id="feedback-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className="w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-[14px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#C1FF00]/40 transition-all"
          />
        </div>
        <div>
          <label htmlFor="feedback-email" className="block text-[12px] font-bold text-[#6b7280] mb-2 uppercase tracking-wider">
            Email{" "}
            <span className="text-[#d1d5db] normal-case font-medium">
              {emailPrefilled ? "(so we can reply)" : "(optional)"}
            </span>
          </label>
          <input
            id="feedback-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com — only if you want a reply"
            className="w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-[14px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#C1FF00]/40 transition-all"
          />
        </div>
      </div>

      {/* Honeypot — visually hidden, off-screen, not tab-focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company (leave blank)</label>
        <input
          id="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {/* Error */}
      {status === "error" && error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {status !== "error" && error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm transition-all ${
            canSubmit
              ? "bg-[#1a1a1a] text-white hover:scale-[1.03] shadow-sm"
              : "bg-[#f0f0f0] text-[#bdbdbd] cursor-not-allowed"
          }`}
        >
          {status === "pending" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={16} />
              Send feedback
            </>
          )}
        </button>
        <p className="text-[12px] text-[#9ca3af] leading-relaxed">
          We capture the page you came from to reproduce bugs. No tracking,
          no spam — just the founder reading your note.
        </p>
      </div>
    </form>
  );
}
