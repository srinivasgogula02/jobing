"use client";

import { useState } from "react";

export default function PrivateClient({ id, initialContent }: { id: string, initialContent: string }) {
  const [copied, setCopied] = useState(false);

  const handleDinoClick = () => {
    if (initialContent) {
      navigator.clipboard.writeText(initialContent);
      setCopied(true);
      
      // Extremely subtle user psychology - no invasive popups, just a fleeting hint
      setTimeout(() => setCopied(false), 800);
      
      const originalTitle = document.title;
      document.title = "Done.";
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] flex flex-col pt-12 md:pt-24 px-6 md:px-12 font-sans select-none overflow-hidden">
      <div className="max-w-[600px] w-full mx-auto relative">
        <div 
          onClick={handleDinoClick} 
          className="mb-6 w-fit outline-none text-[#535353] dark:text-[#9aa0a6] hover:text-[#535353] dark:hover:text-[#9aa0a6] tap-highlight-transparent active:bg-transparent"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* Authentic Pixelated T-Rex SVG */}
          <svg className={`w-[44px] h-[47px] transition-transform duration-75 ${copied ? "scale-90 opacity-80" : "scale-100 opacity-100"}`} viewBox="0 0 44 47" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M44 2.11216H21.5111V0H44V2.11216ZM21.5111 25.3459H19.5556V23.2338H21.5111V25.3459ZM42.0444 4.22432H21.5111V2.11216H42.0444V4.22432ZM23.4667 23.2338H21.5111V21.1216H23.4667V23.2338ZM44 21.1216H42.0444V6.33649H40.0889V4.22432H23.4667V6.33649H21.5111V21.1216H44ZM19.5556 21.1216H21.5111V19.0095H19.5556V21.1216ZM44 23.2338H42.0444V21.1216H44V23.2338ZM19.5556 19.0095H17.6V16.8973H19.5556V19.0095ZM42.0444 27.4581H40.0889V25.3459H42.0444V27.4581ZM17.6 16.8973H15.6444V14.7851H17.6V16.8973ZM40.0889 29.5703H30.3111V27.4581H40.0889V29.5703ZM15.6444 14.7851H13.6889V16.8973H15.6444V14.7851ZM30.3111 31.6824H28.3556V29.5703H30.3111V31.6824ZM13.6889 21.1216H11.7333V23.2338H13.6889V21.1216ZM15.6444 19.0095H13.6889V21.1216H15.6444V19.0095ZM28.3556 33.7946H26.4V31.6824H28.3556V33.7946ZM17.6 21.1216H15.6444V23.2338H17.6V21.1216ZM26.4 35.9068H24.4444V33.7946H26.4V35.9068ZM19.5556 25.3459H17.6V27.4581H19.5556V25.3459ZM24.4444 38.0189H22.4889V35.9068H24.4444V38.0189ZM26.4 27.4581H24.4444V25.3459H26.4V27.4581ZM22.4889 40.1311H20.5333V38.0189H22.4889V40.1311ZM24.4444 29.5703H22.4889V27.4581H24.4444V29.5703ZM20.5333 42.2432H18.5778V40.1311H20.5333V42.2432ZM22.4889 31.6824H20.5333V29.5703H22.4889V31.6824ZM18.5778 44.3554H16.6222V42.2432H18.5778V44.3554ZM20.5333 33.7946H18.5778V31.6824H20.5333V33.7946ZM16.6222 47.5243H12.7111V44.3554H16.6222V47.5243ZM18.5778 38.0189H16.6222V35.9068H18.5778V38.0189ZM16.6222 40.1311H14.6667V38.0189H16.6222V40.1311ZM14.6667 42.2432H12.7111V40.1311H14.6667V42.2432ZM28.3556 27.4581H26.4V25.3459H28.3556V27.4581ZM16.6222 25.3459H13.6889V27.4581H16.6222V25.3459ZM11.7333 23.2338H9.77778V25.3459H11.7333V23.2338ZM9.77778 25.3459H7.82222V27.4581H9.77778V25.3459ZM7.82222 27.4581H5.86667V29.5703H7.82222V27.4581ZM5.86667 29.5703H3.91111V31.6824H5.86667V29.5703ZM3.91111 31.6824H1.95556V33.7946H3.91111V31.6824ZM1.95556 33.7946H0V35.9068H1.95556V33.7946ZM16.6222 27.4581H14.6667V29.5703H16.6222V27.4581ZM14.6667 29.5703H12.7111V31.6824H14.6667V29.5703ZM12.7111 31.6824H10.7556V33.7946H12.7111V31.6824ZM12.7111 33.7946H11.7333V35.9068H12.7111V33.7946ZM26.4 47.5243H22.4889V44.3554H26.4V47.5243ZM11.7333 35.9068H10.7556V38.0189H11.7333V35.9068ZM24.4444 8.44865H22.4889V6.33649H24.4444V8.44865Z" />
          </svg>
        </div>

        <h1 className="text-[22px] md:text-[24px] font-medium tracking-tight mb-[18px]">
          Press space to play
        </h1>

        <div className="text-[#5f6368] dark:text-[#9aa0a6] text-[15px] space-y-4 leading-[1.6]">
          <p>Try:</p>
          <ul className="list-disc pl-10 space-y-2 mb-8 opacity-90">
            <li>Checking the network cables, modem, and router</li>
            <li>Reconnecting to Wi-Fi</li>
          </ul>
          
          <div className="text-[13px] text-[#777] dark:text-[#80868b] tracking-wide mt-[28px] opacity-80 font-[Arial,Helvetica,sans-serif]">
            ERR_INTERNET_DISCONNECTED
          </div>
        </div>
      </div>
    </div>
  );
}
