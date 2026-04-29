import type { Metadata } from "next";
import { Source_Serif_4, Inter, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const techMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-tech-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Art of Numerology — Vedic name and phone numerology",
  description: "Compute your Mulank and Bhagyank, derive your Vedic name number, and find phone numbers whose digits align with your roots.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable} ${techMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
