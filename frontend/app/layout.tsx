import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "HomeBase",
  description: "ระบบจัดการบ้าน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans`}>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
