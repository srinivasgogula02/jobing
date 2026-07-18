import { Bug, Lightbulb, MessageSquareText, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata = {
  title: "Share Feedback | Jobing AI",
  description: "Report a problem, request a capability, or tell us what worked in Jobing AI.",
  alternates: { canonical: "/feedback" },
};

const usefulReports = [
  { icon: Bug, title: "A workflow failed", body: "Tell us what you asked for, the step that failed, and what appeared on screen." },
  { icon: Lightbulb, title: "A capability is missing", body: "Explain the outcome you wanted, not only the feature name." },
  { icon: MessageSquareText, title: "Something was unclear", body: "Point to the label, page, or decision that made you stop." },
] as const;

export default function FeedbackPage() {
  return (
    <DashboardLayout fullBleed breadcrumbs={[{ label: "Feedback" }]}>
      <div className="min-h-full bg-[#f7f8f4] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[#719500]">Product feedback</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-[#151914] sm:text-4xl">Tell us what got in your way.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6e756b]">Report a broken flow, a missing capability, or a moment that worked well. A precise two-minute report is more useful than a polished paragraph.</p>
          </header>

          <div className="mt-7 grid overflow-hidden border border-[#dfe3da] bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="order-2 bg-[#151914] p-6 text-white sm:p-8 lg:order-1">
              <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#baff29]">What makes a useful report</p>
              <div className="mt-7 space-y-6">
                {usefulReports.map((item, index) => (
                  <article className="flex gap-4" key={item.title}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] border border-white/15 text-[#baff29]"><item.icon size={16} /></span>
                    <div>
                      <p className="font-mono text-[9px] text-white/40">0{index + 1}</p>
                      <h2 className="mt-1 text-sm font-bold">{item.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-white/60">{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="flex items-center gap-2 text-xs font-semibold text-white/80"><ShieldCheck size={15} className="text-[#baff29]" /> Keep customer data out</p>
                <p className="mt-2 text-xs leading-5 text-white/50">Do not paste form answers, page code, passwords, access keys, or private conversation transcripts.</p>
              </div>
            </aside>

            <section className="order-1 p-5 sm:p-8 lg:order-2 lg:p-10" aria-label="Feedback form">
              <FeedbackForm />
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
