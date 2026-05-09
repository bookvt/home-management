"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, Package, DollarSign, FolderOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/maintenance", label: "การบำรุงรักษา", icon: Wrench },
  { href: "/assets", label: "ทรัพย์สิน", icon: Package },
  { href: "/expenses", label: "ค่าใช้จ่าย", icon: DollarSign },
  { href: "/documents", label: "เอกสาร", icon: FolderOpen },
  { href: "/search", label: "ค้นหา", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-border bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <Home className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-foreground">HomeBase</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/8 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground/60">ระบบจัดการบ้าน</p>
      </div>
    </aside>
  );
}
