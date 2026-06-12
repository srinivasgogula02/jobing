import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeedbackForm } from "@/components/FeedbackForm";
import { MessageSquareHeart, Zap, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Share Feedback | Jobing AI",
  description:
    "Tell us what's working, what's broken, and what you wish Jobing AI did. A real person reads every message and your feedback shapes the roadmap.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: "Feedback" }]}>
      <div className="flex-1 overflow-y-auto slim-scrollbar bg-white">
        <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
          {/* Header */}
          <div className="mb-10">
            <div className="w-14 h-14 rounded-2xl bg-[#C1FF00]/20 flex items-center justify-center mb-5">
              <MessageSquareHeart size={26} className="text-[#1a1a1a]" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#1a1a1a] tracking-tight mb-3">
              Help shape Jobing
            </h1>
            <p className="text-[15px] lg:text-base text-[#4b5563] leading-relaxed">
              Jobing is built by a tiny team, and the fastest way it gets better
              is you telling us the truth. Hit a bug? Wish something existed?
              Loved a moment? It all counts — and it all gets read.
            </p>
          </div>

          {/* Trust strip — sets expectations before they invest effort writing. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
            <TrustItem icon={Zap} title="Read fast" body="Lands in a human inbox the moment you hit send." />
            <TrustItem icon={MessageSquareHeart} title="Actually used" body="Your notes directly steer what we build next." />
            <TrustItem icon={ShieldCheck} title="Private" body="Never shown publicly. Email optional, no spam." />
          </div>

          {/* The form */}
          <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-sm p-6 sm:p-8 relative">
            <FeedbackForm />
          </div>

          {/* Escape hatch — some people want a direct line, not a form. */}
          <p className="text-center text-[13px] text-[#9ca3af] mt-8">
            Prefer email? Reach us at{" "}
            <a
              href="mailto:support@jobing.site?subject=Jobing%20feedback"
              className="font-bold text-[#4b5563] underline underline-offset-2 hover:text-[#1a1a1a]"
            >
              support@jobing.site
            </a>
            .
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fafafa] border border-[#f0f0f0] p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={15} className="text-[#1a1a1a]" />
        <span className="text-[13px] font-black text-[#1a1a1a]">{title}</span>
      </div>
      <p className="text-[12px] text-[#9ca3af] leading-relaxed">{body}</p>
    </div>
  );
}
