import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://zinks.netlify.app"),
  title: "Zinks - Fast, Modern URL Shortener",
  description: "Create and manage custom short URLs with speed and simplicity on zinks.netlify.app",
  openGraph: {
    title: "Zinks - Custom URL Shortener",
    description: "Create and manage custom short URLs with speed and simplicity.",
    url: "https://zinks.netlify.app",
    siteName: "Zinks",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Zinks URL Shortener. Built for simplicity.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

