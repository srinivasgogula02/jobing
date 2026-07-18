import Link from "next/link";
import { Bot, FormInput, Globe2, Link2, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LegalContent, LegalSection } from "@/components/LegalContent";

export const metadata = {
  title: "About Jobing AI",
  description: "Why Jobing AI exists and how one connector helps an AI app finish the page-and-form workflow.",
};

const principles = [
  { icon: Bot, title: "Finish the workflow", body: "Return a live page, working form, response inbox, and useful links instead of another setup tutorial." },
  { icon: ShieldCheck, title: "Keep the user in control", body: "Show permissions clearly, keep drafts private, confirm destructive actions, and make connections easy to revoke." },
  { icon: FormInput, title: "Let the design belong to the customer", body: "Forms can use native website code instead of a forced branded iframe." },
  { icon: Globe2, title: "Make every result manageable", body: "Everything created through AI is also available from a normal dashboard." },
] as const;

export default function AboutPage() {
  return (
    <DashboardLayout>
      <LegalContent title="About Jobing AI">
        <LegalSection title="Why Jobing exists">
          <p className="text-lg font-bold leading-snug text-[#1a1a1a]">
            AI apps can understand a request, write copy, and generate code, but people are often left to complete the difficult part themselves.
          </p>
          <p>
            A page still needs to be published. A form still needs a reliable place to send answers. Responses still need to be reviewed and turned into a decision. Jobing AI exists to close that gap between an AI answer and a finished result.
          </p>
        </LegalSection>

        <LegalSection title="Our mission">
          <p>
            Our mission is to let people complete useful online work from the AI app they already know. One approved connector should be enough to publish a focused web page, add a custom form, collect responses, and return to the same conversation when something needs to change.
          </p>
        </LegalSection>

        <LegalSection title="How we build">
          <ul className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {principles.map((principle) => (
              <li className="border border-[#e5e5e5] bg-[#fafafa] p-6" key={principle.title}>
                <principle.icon className="mb-4 text-[#5f8700]" size={22} />
                <h3 className="mb-2 font-black text-[#1a1a1a]">{principle.title}</h3>
                <p className="text-[13px] leading-relaxed">{principle.body}</p>
              </li>
            ))}
          </ul>
        </LegalSection>

        <LegalSection title="Start with one connection">
          <div className="flex flex-col items-start justify-between gap-6 bg-[#151914] p-8 text-white md:flex-row md:items-center">
            <div>
              <h3 className="mb-2 text-xl font-black">Give your AI the tools to finish the work.</h3>
              <p className="text-sm text-white/65">Publish web pages, create custom forms, and work with responses from the AI app you already use.</p>
            </div>
            <Link href="/connector" className="flex items-center gap-2.5 bg-[#baff29] px-6 py-3 font-bold text-[#151914]">
              <Link2 size={18} /> Connect Jobing AI
            </Link>
          </div>
        </LegalSection>
      </LegalContent>
    </DashboardLayout>
  );
}
