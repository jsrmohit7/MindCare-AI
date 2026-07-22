import type { Metadata } from "next";
import { Inter } from "next/font/google";
import QueryProvider from "@/components/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { EmotionProvider } from "@/context/EmotionContext";
import { AdaptiveThemeProvider } from "@/components/AdaptiveThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MindCare AI – Intelligent Mental Wellness Copilot",
  description:
    "Assess your psychological well-being with precision AI and secure, private insights. Powered by IBM Watsonx Granite.",
  keywords: ["mental health", "AI wellness", "mood tracking", "mental wellness"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${inter.variable} font-sans antialiased h-full bg-[var(--background)] text-slate-100 transition-colors duration-[800ms]`}
      >
        <QueryProvider>
          <AuthProvider>
            <EmotionProvider>
              <AdaptiveThemeProvider>
                <AppShell>{children}</AppShell>
              </AdaptiveThemeProvider>
            </EmotionProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
