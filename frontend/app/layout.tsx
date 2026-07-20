import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MindCare AI - Intelligent Mental Health Copilot",
  description: "Assess your psychological well-being with precision AI and secure, private insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-full flex flex-col`}
      >
        <QueryProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-500 bg-slate-950">
            &copy; {new Date().getFullYear()} MindCare AI. Powered by IBM Watsonx.ai Granite. All rights reserved.
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
