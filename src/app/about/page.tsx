import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LegalContent, LegalSection } from "@/components/LegalContent";
import { Rocket, Target, Mail } from "lucide-react";

export const metadata = {
  title: "About Us | Jobing AI",
};

export default function AboutPage() {
  return (
    <DashboardLayout>
      <LegalContent title="About Jobing AI">
        <LegalSection title="Our Mission">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#C1FF00]/20 flex items-center justify-center shrink-0">
              <Rocket size={24} className="text-[#1a1a1a]" />
            </div>
            <p className="text-lg font-bold text-[#1a1a1a] leading-snug">
              We started Jobing AI with a single goal: to make professional resume building accessible, intelligent, and highly effective for everyone.
            </p>
          </div>
          <p>
            In today&apos;s competitive job market, your resume needs to do more than just list your experience—it needs to tell a compelling story that resonates with both AI filters and human recruiters. Jobing AI leverages the latest advancements in artificial intelligence to help you bridge that gap.
          </p>
        </LegalSection>

        <LegalSection title="Our Vision">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#C1FF00]/20 flex items-center justify-center shrink-0">
              <Target size={24} className="text-[#1a1a1a]" />
            </div>
            <p>
              We envision a future where your skills and potential are never overlooked due to poor formatting or missing keywords. We are building the most intuitive and powerful AI career assistant to empower job seekers at every stage of their professional journey.
            </p>
          </div>
        </LegalSection>

        <LegalSection title="Why Jobing AI?">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
             <li className="bg-[#fafafa] p-6 rounded-2xl border border-[#e5e5e5]">
               <h4 className="font-black text-[#1a1a1a] mb-2 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                 AI Tailoring
               </h4>
               <p className="text-[13px] leading-relaxed">Our models analyze specific job descriptions to highlight your most relevant achievements instantly.</p>
             </li>
             <li className="bg-[#fafafa] p-6 rounded-2xl border border-[#e5e5e5]">
                <h4 className="font-black text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                  LinkedIn Integration
                </h4>
                <p className="text-[13px] leading-relaxed">Import your existing profile data in seconds and never start from a blank page again.</p>
             </li>
             <li className="bg-[#fafafa] p-6 rounded-2xl border border-[#e5e5e5]">
                <h4 className="font-black text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                  Modern Aesthetics
                </h4>
                <p className="text-[13px] leading-relaxed">Generate premium, ATS-friendly designs that stand out in any recruiter&apos;s inbox.</p>
             </li>
             <li className="bg-[#fafafa] p-6 rounded-2xl border border-[#e5e5e5]">
                <h4 className="font-black text-[#1a1a1a] mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C1FF00]" />
                  Privacy First
                </h4>
                <p className="text-[13px] leading-relaxed">Your data is yours. We use enterprise-grade security to ensure your information is always protected.</p>
             </li>
          </ul>
        </LegalSection>

        <LegalSection title="Get In Touch">
           <div className="bg-[#1a1a1a] text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
               <h3 className="text-xl font-black mb-2">Have questions?</h3>
               <p className="text-white/60 text-sm">We&apos;re here to help you build your dream career.</p>
             </div>
             <a href="mailto:support@jobing.ai" className="flex items-center gap-2.5 px-6 py-3 bg-[#C1FF00] text-[#1a1a1a] rounded-xl font-bold hover:scale-[1.05] transition-transform">
               <Mail size={18} />
               Contact Support
             </a>
           </div>
        </LegalSection>
      </LegalContent>
    </DashboardLayout>
  );
}
