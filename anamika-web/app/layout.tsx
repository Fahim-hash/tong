import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// ফন্ট কনফিগারেশন
const ebGaramond = EB_Garamond({ 
  subsets: ["latin"], 
  variable: "--font-serif" 
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

// এসইও (SEO) এর জন্য মেটাডেটা সেটআপ
export const metadata: Metadata = {
  title: "TongErKhobor Intern Portal",
  description: "Welcome to TongErKhobor official Intern Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${inter.variable} font-sans antialiased`}>
        {/* আপনার ওয়েবসাইটের মেইন কন্টেন্ট */}
        {children}
        
        {/* Vercel Analytics ট্র্যাকিং কম্পোনেন্ট */}
        <Analytics />
      </body>
    </html>
  );
}
