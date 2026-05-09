"use client";
import { useState } from "react";
import { Search as SearchIcon, Wrench, Package, DollarSign, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { search as searchApi } from "@/lib/api";
import type { SearchResult } from "@/types";

const categoryMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  maintenance: { label: "บำรุงรักษา", icon: Wrench, color: "text-amber-500" },
  asset: { label: "ทรัพย์สิน", icon: Package, color: "text-indigo-500" },
  expense: { label: "ค่าใช้จ่าย", icon: DollarSign, color: "text-emerald-500" },
  document: { label: "เอกสาร", icon: FolderOpen, color: "text-violet-500" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try { const res = await searchApi(query); setResults(res); setSearched(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">ค้นหา</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">ค้นหาข้อมูลทุกหมวดหมู่</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white"
            placeholder="พิมพ์คำค้นหา…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
        </div>
        <Button size="default" onClick={doSearch} disabled={loading}>
          {loading ? "กำลังค้นหา…" : "ค้นหา"}
        </Button>
      </div>

      {searched && results.length === 0 && (
        <div className="rounded-xl border border-border bg-white py-12 text-center">
          <p className="text-sm text-muted-foreground">ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-white overflow-hidden divide-y divide-border">
          {results.map((r, i) => {
            const meta = categoryMeta[r.category] ?? { label: r.category, icon: SearchIcon, color: "text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`shrink-0 ${meta.color}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  {r.subtitle && <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
