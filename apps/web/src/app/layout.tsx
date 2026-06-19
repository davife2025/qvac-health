import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getUserProfile } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "QVAC Health — Private AI Companion",
  description:
    "Local-first mental health companion. Your data never leaves your device.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserProfile();

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-calm-50 text-gray-900 antialiased flex flex-col">
        <Nav user={user} />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
