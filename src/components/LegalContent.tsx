import React from "react";

interface LegalContentProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalContent({ title, lastUpdated, children }: LegalContentProps) {
  return (
    <div className="flex-1 overflow-y-auto slim-scrollbar bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20">
        <div className="mb-10 text-center lg:text-left border-b border-[#f0f0f0] pb-10">
          <h1 className="text-3xl lg:text-4xl font-black text-[#1a1a1a] tracking-tight mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-[#9ca3af] font-bold uppercase tracking-widest">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>
        
        <div className="prose prose-slate max-w-none 
          prose-headings:text-[#1a1a1a] prose-headings:font-black prose-headings:tracking-tight
          prose-p:text-[#4b5563] prose-p:leading-relaxed prose-p:text-[15px]
          prose-strong:text-[#1a1a1a] prose-strong:font-bold
          prose-ul:list-disc prose-ul:pl-5
          prose-li:text-[#4b5563] prose-li:mb-2
          space-y-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-[#C1FF00] rounded-full" />
        {title}
      </h2>
      <div className="space-y-4 text-[#4b5563]">
        {children}
      </div>
    </section>
  );
}
