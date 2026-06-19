import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/ui/Toast";
import { getUserProfile } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: {
    default: "QVAC Health",
    template: "%s · QVAC Health",
  },
  description:
    "Local-first mental health companion powered by edge AI. Your data never leaves your device.",
  keywords: ["mental health", "AI", "privacy", "on-device", "QVAC"],
  openGraph: {
    title: "QVAC Health — Private AI Mental Health Companion",
    description: "On-device AI for mental health journaling and clinical documentation.",
    type: "website",
  },
};

// Separate viewport export — required by Next.js 15 for viewport-fit
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enables safe-area-inset-* on notched iPhones
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
        <ToastProvider>
          <Nav user={user} />
          <div className="flex-1">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
