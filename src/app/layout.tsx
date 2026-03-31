// app/layout.tsx
// -------------------------------------------------
// Decision: This is the only Server Component in the
// layout tree. It imports the client-side <Providers>
// wrapper which handles Redux, MUI, and Emotion.
// suppressHydrationWarning on <html> prevents the
// dark-class mismatch warning during hydration.
// -------------------------------------------------

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyApp",
  description: "Production-ready Next.js + Firebase + MUI starter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: Tailwind dark class is set client-side,
    // so the server HTML and first client render may differ slightly.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
