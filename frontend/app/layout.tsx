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
            {/* top padding on mobile for fixed header, bottom padding for bottom nav */}
            <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 md:px-8 md:pb-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
