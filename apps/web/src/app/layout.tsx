import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QVAC Health — Private AI Companion",
  description:
    "Local-first mental health companion. Your data never leaves your device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-calm-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
