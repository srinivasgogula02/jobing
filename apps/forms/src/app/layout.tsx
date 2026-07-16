import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600"],
});

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jobing Forms",
  description: "Create, publish, and manage forms with Jobing and your connected AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_FORMS_SITE_URL || "https://forms.jobing.site"),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C1FF00",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="https://jobing.site/dashboard/forms" signUpFallbackRedirectUrl="https://jobing.site/dashboard/forms">
      <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} ${instrumentSans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
