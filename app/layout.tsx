import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import ChatBot from "@/components/chat/ChatBot";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CreatorIQ — AI-Native Creator Marketplace",
  description: "CreatorIQ connects brands with verified AI creators and turns campaign ideas into explainable creator matches.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased gradient-bg`}>
        {children}
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      </body>
    </html>
  );
}