import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Header } from "@/components/Header";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promwin | Coming Soon",
  description: "The premium marketplace for creators to monetize AI prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
          }}
        >
          <Header />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
