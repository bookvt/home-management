"use client";
import { useState } from "react";
import { Search as SearchIcon, Wrench, Package, DollarSign, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { search as searchApi } from "@/lib/api";
import type { SearchResult } from "@/types";

const categoryMeta: Record<string, { label: string; icon: React.ElementType; href: string }> = {
  maintenance: { label: "Maintenance", icon: Wrench, href: "/maintenance" },
  asset: { label: "Asset", icon: Package, href: "/assets" },
  expense: { label: "Expense", icon: DollarSign, href: "/expenses" },
  document: { label: "Document", icon: FolderOpen, href: "/documents" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchApi(query);
      setResults(res);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Search</h1>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search across all modules…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
        </div>
        <button
          onClick={doSearch}
          disabled={loading}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-muted-foreground">No results found for &ldquo;{query}&rdquo;.</p>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const meta = categoryMeta[r.category] ?? { label: r.category, icon: SearchIcon, href: "#" };
          const Icon = meta.icon;
          return (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.subtitle && <p className="text-sm text-muted-foreground truncate">{r.subtitle}</p>}
                </div>
                <Badge variant="outline">{meta.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
