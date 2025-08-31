import type { Metadata } from "next";
import { Work_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GovChat - AI Assistant",
  description: "Intelligent government assistant powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${workSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
