import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jobing AI | The AI Resume Builder That Gets You Hired",
  description: "Stop getting ghosted. Paste any job description to instantly tailor your resume and bypass ATS algorithms. Build professional, highly-optimized resumes in seconds.",
  keywords: ["AI Resume Builder", "ATS Resume Score", "Tailor Resume to Job", "Resume Maker", "ChatGPT Resume", "Jobing AI", "ATS Optimizer"],
  authors: [{ name: "Jobing" }],
  creator: "Jobing AI",
  publisher: "Jobing AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://jobing.site"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Jobing",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Jobing AI | The AI Resume Builder That Gets You Hired",
    description: "Instantly tailor your experience to any job description and bypass the ATS. Stop getting ghosted.",
    url: "https://jobing.site",
    siteName: "Jobing AI",
    images: [
      {
        url: "/og-image.png", // Recommended to generate this later
        width: 1200,
        height: 630,
        alt: "Jobing AI - Resume Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobing AI | AI Resume Builder",
    description: "Instantly tailor your experience to any job description and bypass the ATS in seconds.",
    images: ["/og-image.png"],
    creator: "@jobing_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#C1FF00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only ship analytics from real (production) traffic. This keeps local dev and
  // build/preview noise out of GA4 + the Meta pixel — the reports were showing
  // 127.0.0.1 / localhost referrals that distorted source and conversion data.
  const analyticsEnabled = process.env.NODE_ENV === "production";

  return (
    <html lang="en">
      <head>
        {analyticsEnabled && (
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XKEFJF05QL"
        />
        )}
        {analyticsEnabled && (
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XKEFJF05QL');
            `,
          }}
        />
        )}
        {analyticsEnabled && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '932694869167270');
              fbq('track', 'PageView');
            `,
          }}
        />
        )}
        {analyticsEnabled && (
        <Script
          defer
          data-website-id="dfid_YXyFB08ieOLrn3aJRAI0F"
          data-domain="jobing.site"
          src="https://datafa.st/js/script.js"
        />
        )}
      </head>
      <body className={`${instrumentSans.variable} antialiased`}>
        {analyticsEnabled && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=932694869167270&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        )}
        <ClerkProvider signInFallbackRedirectUrl="/tools" signUpFallbackRedirectUrl="/tools">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
