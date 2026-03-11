import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { FileText, MessageSquare } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimpleRead Medical",
  description: "Ask questions about medical documents using Claude 3.5 Sonnet + RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link 
              href="/" 
              className="font-semibold text-lg tracking-wide text-slate-900 flex items-center gap-2"
            >
              SimpleRead
            </Link>
            <nav className="flex items-center gap-6">
              <Link 
                href="/upload" 
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Documents
              </Link>
              <Link 
                href="/chat" 
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
