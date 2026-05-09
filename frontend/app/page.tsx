"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Wrench, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { dashboard } from "@/lib/api";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      กำลังโหลด…
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">หน้าหลัก</h1>
        <p className="mt-1 text-sm text-muted-foreground">ภาพรวมการจัดการบ้าน</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ค่าใช้จ่ายเดือนนี้"
          value={formatCurrency(data.total_this_month)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-indigo-500"
          bg="bg-indigo-50"
        />
        <StatCard
          label="การบำรุงรักษาที่รอดำเนินการ"
          value={String(data.upcoming_maintenance.length)}
          icon={<Wrench className="h-4 w-4" />}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <StatCard
          label="การรับประกันใกล้หมดอายุ"
          value={String(data.expiring_warranties.length)}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-rose-500"
          bg="bg-rose-50"
        />
        <StatCard
          label="เอกสารใกล้หมดอายุ"
          value={String(data.expiring_documents.length)}
          icon={<FileText className="h-4 w-4" />}
          color="text-violet-500"
          bg="bg-violet-50"
        />
      </div>

      {/* Detail sections */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="การบำรุงรักษาที่กำลังจะถึง">
          {data.upcoming_maintenance.length === 0 ? (
            <Empty text="ไม่มีรายการในอีก 90 วัน" />
          ) : (
            data.upcoming_maintenance.map((m) => {
              const days = daysUntil(m.next_due_date);
              return (
                <Row key={m.id} label={m.name} sub={formatDate(m.date)}>
                  <Badge variant={days !== null && days <= 14 ? "destructive" : "secondary"} className="text-xs">
                    {days !== null ? `อีก ${days} วัน` : "—"}
                  </Badge>
                </Row>
              );
            })
          )}
        </Section>

        <Section title="การรับประกันใกล้หมดอายุ">
          {data.expiring_warranties.length === 0 ? (
            <Empty text="ไม่มีการรับประกันหมดใน 90 วัน" />
          ) : (
            data.expiring_warranties.map((a) => {
              const days = daysUntil(a.warranty_expiry);
              return (
                <Row key={a.id} label={a.name} sub={a.category}>
                  <Badge variant="warning" className="text-xs">{formatDate(a.warranty_expiry)} · {days}ว.</Badge>
                </Row>
              );
            })
          )}
        </Section>

        <Section title="เอกสารใกล้หมดอายุ">
          {data.expiring_documents.length === 0 ? (
            <Empty text="ไม่มีเอกสารหมดอายุใน 60 วัน" />
          ) : (
            data.expiring_documents.map((d) => {
              const days = daysUntil(d.expiry_date);
              return (
                <Row key={d.id} label={d.title} sub={d.category}>
                  <Badge variant="warning" className="text-xs">{formatDate(d.expiry_date)} · {days}ว.</Badge>
                </Row>
              );
            })
          )}
        </Section>

        <Section title="ค่าใช้จ่ายล่าสุด">
          {data.recent_expenses.length === 0 ? (
            <Empty text="ยังไม่มีรายการค่าใช้จ่าย" />
          ) : (
            data.recent_expenses.map((e) => (
              <Row key={e.id} label={typeLabel(e.type)} sub={e.month || formatDate(e.date)}>
                <span className="text-sm font-medium">{formatCurrency(e.amount)}</span>
              </Row>
            ))
          )}
        </Section>
      </div>
    </div>
  );
}

function typeLabel(t: string) {
  const map: Record<string, string> = { electric: "ไฟฟ้า", water: "น้ำประปา", internet: "อินเทอร์เน็ต", other: "อื่นๆ" };
  return map[t] ?? t;
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{label}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-4 text-sm text-muted-foreground">{text}</p>;
}
