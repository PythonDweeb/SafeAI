import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nunito } from "next/font/google"; // Import Nunito
import "./globals.css";
import LeafletCSS from "@/components/LeafletCSS";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Include weights you need, e.g., regular, semibold, bold
  variable: "--font-nunito", // Define a CSS variable
});

export const metadata: Metadata = {
  title: "SafeAI - Autonomous Security Monitoring",
  description: "School safety monitoring system with real-time threat detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`font-poppins ${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased h-screen bg-black`}
      >
        <LeafletCSS />
        {children}
      </body>
    </html>
  );
}
