"use client";

import { useEffect, useState } from "react";
import { Copy, Sparkles, Loader2, CheckCircle2, FileText, MousePointer2 } from "lucide-react";

export function CopyPasteAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      { step: 0, duration: 1500 }, // Idle empty state
      { step: 1, duration: 1500 }, // Highlight JD & Copy
      { step: 2, duration: 1000 }, // Paste in Jobing
      { step: 3, duration: 1500 }, // Generating (Loader)
      { step: 4, duration: 3500 }, // Success Skeleton
    ];

    let timer: NodeJS.Timeout;
    let currentIndex = 0;

    const runSequence = () => {
      setStep(sequence[currentIndex].step);
      timer = setTimeout(() => {
        currentIndex = (currentIndex + 1) % sequence.length;
        runSequence();
      }, sequence[currentIndex].duration);
    };

    runSequence();

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 bg-[#f5f5f4] border-t border-[#e5e5e5] overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-[#1a1a1a] tracking-tight mb-4">
          From LinkedIn to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8bb800] to-[#6a8c00]">Interview Ready</span>
        </h2>
        <p className="text-[#6b7280] text-lg font-medium max-w-2xl mx-auto">
          Just copy the job description, paste it into Jobing AI, and watch the magic happen.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          
          {/* Panel 1: Mock Job Board */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col h-[320px] md:h-[380px] relative transition-all duration-300">
            <div className="h-10 md:h-12 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center px-3 md:px-4 gap-2 shrink-0">
              <div className="flex gap-1.5 hidden sm:flex">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="mx-auto flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 py-1 bg-white rounded-md border border-[#e5e5e5] text-[10px] md:text-[11px] text-[#9ca3af] font-mono shadow-sm truncate">
                <span className="w-3 h-3 shrink-0 bg-[#0a66c2] rounded-sm flex items-center justify-center text-white text-[8px] font-bold">in</span>
                linkedin.com/jobs/view
              </div>
            </div>
            
            <div className="p-4 md:p-8 flex-1 relative overflow-hidden">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-600 shrink-0 shadow-sm flex items-center justify-center text-white font-bold text-lg md:text-xl">S</div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#1a1a1a] leading-tight mb-1">Senior Product Designer</h3>
                  <p className="text-xs md:text-sm text-[#6b7280]">Stripe · San Francisco, CA</p>
                </div>
              </div>
              
              <div className="space-y-3 relative">
                {/* Simulated Mouse Pointer */}
                <div 
                  className={`absolute z-30 transition-all duration-700 ease-in-out ${
                    step === 0 ? "top-10 left-10 opacity-0" : 
                    step === 1 ? "top-4 left-0 md:-left-2 opacity-100" : 
                    "top-20 right-0 opacity-0"
                  }`}
                >
                  <MousePointer2 size={24} className="text-black fill-black -rotate-12 scale-75 md:scale-100 origin-top-left" />
                  
                  {/* Cmd+C Tooltip Popup */}
                  <div className={`absolute top-5 md:top-6 left-5 md:left-6 bg-[#1a1a1a] text-white text-[10px] md:text-[11px] font-bold px-2 py-1 md:px-2.5 md:py-1 rounded shadow-lg transition-all duration-300 whitespace-nowrap ${step === 1 ? "opacity-100 translate-y-0 delay-500" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                    Cmd + C
                  </div>
                </div>

                {/* Highlightable Text */}
                <div className="relative">
                  <div className="text-[12px] md:text-[13px] leading-relaxed text-[#6b7280] space-y-2 md:space-y-3">
                    <p className="line-clamp-3 md:line-clamp-none">We're looking for an experienced Senior Product Designer to join our core payments team. You will lead the design of complex financial dashboards and consumer checkout flows.</p>
                    <p className="font-semibold text-[#1a1a1a] mt-1 md:mt-2">Requirements:</p>
                    <ul className="list-disc pl-4 space-y-1 block sm:hidden md:block">
                      <li>5+ years design experience</li>
                      <li>Expertise in Figma</li>
                    </ul>
                    <ul className="list-disc pl-4 space-y-1 hidden sm:block md:hidden">
                      <li>5+ years of product design experience</li>
                      <li>Expertise in Figma and prototyping tools</li>
                      <li>Strong portfolio demonstrating user-centered design</li>
                    </ul>
                  </div>

                  {/* Highlight Overlay */}
                  <div 
                    className={`absolute inset-0 bg-blue-500/20 mix-blend-multiply transition-all duration-500 ease-in-out origin-top-left flex flex-col ${
                      step >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-y-0"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Jobing AI Dashboard */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col h-[320px] md:h-[380px] relative transition-transform duration-500 group">
            
            {/* Window Chrome */}
            <div className="h-10 md:h-12 border-b border-[#f0f0f0] bg-white flex items-center px-4 justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#1a1a1a] flex items-center justify-center">
                   <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#C1FF00]"></div>
                 </div>
                 <span className="text-[12px] md:text-[13px] font-bold text-[#1a1a1a]">Jobing AI</span>
               </div>
               <div className="text-[10px] md:text-[11px] font-bold text-[#6b7280] uppercase tracking-wider bg-[#fafafa] px-2 py-1 rounded">Create Resume</div>
            </div>
            
            <div className="flex-1 bg-[#fafafa] p-4 md:p-6 relative flex flex-col items-center justify-center">

               {/* State 0 & 1 & 2: Main Interface w/ Text Area */}
               <div className={`w-full max-w-[280px] md:max-w-[320px] transition-all duration-500 absolute ${step < 3 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                  <label className="text-[12px] md:text-[13px] font-bold text-[#1a1a1a] mb-2 block">Paste Job Description</label>
                  <div className="relative">
                    <div className={`w-full h-24 md:h-32 rounded-xl border-2 transition-colors bg-white p-3 text-[11px] md:text-[12px] text-[#6b7280] overflow-hidden ${step === 2 ? 'border-[#C1FF00]' : 'border-[#e5e5e5]'}`}>
                      {step === 0 || step === 1 ? (
                        <span className="text-[#d4d4d4]">Paste LinkedIn/Naukri job details here...</span>
                      ) : (
                        <div className="animate-fade-in text-[#1a1a1a] font-medium leading-relaxed line-clamp-4 md:line-clamp-none">
                          We're looking for an experienced Senior Product Designer to join our core payments team...
                        </div>
                      )}
                    </div>
                    {/* Simulated Cmd+V Badge */}
                    <div className={`absolute right-1 -top-3 md:-right-3 md:-top-3 bg-[#1a1a1a] text-[#C1FF00] text-[10px] md:text-[11px] font-bold px-2 py-1 md:px-2.5 rounded-md shadow-lg transition-all duration-300 transform ${step === 2 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-4 pointer-events-none"}`}>
                      Paste applied
                    </div>
                  </div>
                  
                  <button className={`w-full mt-3 md:mt-4 py-2.5 md:py-3 rounded-xl text-[12px] md:text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-300 ${step === 2 ? "bg-[#C1FF00] text-[#1a1a1a] shadow-lg shadow-[#C1FF00]/20" : "bg-[#1a1a1a] text-white opacity-40"}`}>
                    <Sparkles size={14} />
                    Generate Resume
                  </button>
               </div>

               {/* State 3: Generating */}
               <div className={`absolute inset-0 bg-[#fafafa] z-10 flex flex-col items-center justify-center transition-all duration-300 ${step === 3 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                 <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-2xl mb-3 md:mb-4 shadow-lg shadow-[#1a1a1a]/10">
                   <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-[#C1FF00]" />
                 </div>
                 <h3 className="text-[14px] md:text-[15px] font-bold text-[#1a1a1a] mb-1">AI is tailoring your resume</h3>
                 <p className="text-[11px] md:text-[12px] text-[#6b7280]">Optimizing for ATS algorithms...</p>
               </div>

               {/* State 4: Success Skeleton */}
               <div className={`absolute inset-0 z-20 bg-[#fafafa] flex items-center justify-center p-4 md:p-6 transition-all duration-700 ${step === 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
                 <div className="relative w-full max-w-[180px] sm:max-w-[200px] md:max-w-[240px] aspect-[1/1.414] bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#C1FF00]/40 p-4 md:p-5 flex flex-col mx-auto overflow-hidden">
                    {/* Glowing Success Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center bg-white/95 backdrop-blur-xl px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#C1FF00]/30 text-center animate-fade-in-up">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#C1FF00]/20 flex items-center justify-center mb-1 md:mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#8bb800]" />
                      </div>
                      <h3 className="text-[11px] md:text-[13px] font-black text-[#1a1a1a] tracking-tight">Ready</h3>
                    </div>

                    {/* Mini Skeleton */}
                    <div className="w-full flex-1 space-y-2 md:space-y-3 opacity-30">
                      <div className="flex flex-col items-center space-y-1 md:space-y-1.5">
                        <div className="w-2/3 h-2 md:h-3 bg-[#1a1a1a] rounded-sm"></div>
                        <div className="w-full max-w-[80%] h-1 md:h-1.5 bg-[#d4d4d4] rounded-sm"></div>
                        <div className="w-full h-[0.5px] bg-[#d4d4d4] mt-1"></div>
                      </div>
                      <div className="space-y-1.5 md:space-y-2 pt-1">
                        <div className="w-16 md:w-20 h-1.5 md:h-2 bg-[#d4d4d4] rounded-sm"></div>
                        <div className="flex justify-between items-end">
                          <div className="w-24 md:w-32 h-2 md:h-2.5 bg-[#1a1a1a] rounded-sm"></div>
                          <div className="w-8 md:w-10 h-1 md:h-1.5 bg-[#d4d4d4] rounded-sm"></div>
                        </div>
                        <div className="w-12 md:w-16 h-1 md:h-1.5 bg-[#d4d4d4] rounded-sm"></div>
                        <div className="space-y-1 pt-1">
                          <div className="w-full h-[3px] md:h-1 bg-[#f0f0f0] rounded-sm"></div>
                          <div className="w-5/6 h-[3px] md:h-1 bg-[#f0f0f0] rounded-sm"></div>
                          <div className="w-4/5 h-[3px] md:h-1 bg-[#f0f0f0] rounded-sm"></div>
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
