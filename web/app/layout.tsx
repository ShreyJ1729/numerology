import type { Metadata } from "next";
import { Playfair_Display, Inter, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
  title: "Art of Numerology",
  description: "Vedic name numbers and numerology phone number search",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${techMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
