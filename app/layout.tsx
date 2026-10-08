import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ChatBot from "@/components/chat/ChatBot";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PromptFolio — AI-Native Creator Marketplace",
  description: "Brief-to-verified-creator in 60 seconds. The AI-native marketplace connecting brands with verified AI creators.",
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
        <ChatBot />
      </body>
    </html>
  );
}