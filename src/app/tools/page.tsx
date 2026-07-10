import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Code, Copy, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Free Productivity Tools | Jobing",
  description: "Fast, focused tools for sharing text, previewing HTML, and studying smarter.",
};

const tools = [
  {
    title: "Jobing Clipboard",
    description: "Write, sync, and share text across devices with a short link. No login required.",
    href: "/copy",
    action: "Create a note",
    icon: Copy,
    style: "bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a]",
    iconStyle: "bg-[#1e1b4b] text-[#818cf8]",
  },
  {
    title: "HTML Online Viewer",
    description: "Edit HTML and see the result instantly in a private live preview.",
    href: "/pages",
    action: "Open viewer",
    icon: Code,
    style: "bg-[#f7fee7] hover:bg-[#ecfccb] text-[#14532d]",
    iconStyle: "bg-[#3f6212] text-[#a3e635]",
  },
  {
    title: "LastMinute",
    description: "Turn a study PDF into a concise one-page revision sheet inside ChatGPT.",
    href: "https://chatgpt.com/g/g-6941cc3967608191a34b2757e3f3232a-lastminute",
    action: "Open in ChatGPT",
    icon: BookOpen,
    style: "bg-[#f0fdfa] hover:bg-[#ccfbf1] text-[#115e59]",
    iconStyle: "bg-[#0f766e] text-white",
    external: true,
  },
];

export default function ToolsPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: "Tools", href: "/tools" }]}>
      <div className="grid min-h-full grid-cols-1 border-t border-l border-[#e5e5e5] sm:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => {
          const content = (
            <>
              <div>
                <div className={`mb-6 flex h-12 w-12 items-center justify-center ${tool.iconStyle}`}>
                  <tool.icon size={22} />
                </div>
                <h2 className="mb-2 text-lg font-extrabold tracking-tight">{tool.title}</h2>
                <p className="text-[13px] font-medium leading-relaxed opacity-70">{tool.description}</p>
              </div>
              <span className="mt-8 flex items-center justify-between text-[13px] font-bold">
                {tool.action} <ArrowRight size={16} />
              </span>
            </>
          );
          const className = `group flex min-h-[300px] flex-col justify-between border-r border-b border-[#e5e5e5] p-8 transition-colors ${tool.style}`;

          return tool.external ? (
            <a key={tool.title} href={tool.href} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <Link key={tool.title} href={tool.href} className={className}>
              {content}
            </Link>
          );
        })}

        <div className="flex min-h-[300px] flex-col items-center justify-center border-r border-b border-[#e5e5e5] bg-[#fffbeb] p-8 text-[#d97706]">
          <Clock size={30} className="mb-4" />
          <p className="text-center text-sm font-semibold">More useful tools coming soon.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
