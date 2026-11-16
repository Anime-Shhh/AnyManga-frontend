import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnyManga",
  description: "Search for manga, browse chapters, and read online.",
  referrer: "no-referrer",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0a14] text-white">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
