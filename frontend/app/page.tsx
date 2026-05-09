"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Wrench, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboard } from "@/lib/api";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="This Month's Spend" value={formatCurrency(data.total_this_month)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Upcoming Maintenance" value={data.upcoming_maintenance.length.toString()} icon={<Wrench className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Expiring Warranties" value={data.expiring_warranties.length.toString()} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Expiring Documents" value={data.expiring_documents.length.toString()} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Maintenance</CardTitle></CardHeader>
          <CardContent>
            {data.upcoming_maintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground">None in the next 90 days.</p>
            ) : (
              <ul className="space-y-2">
                {data.upcoming_maintenance.map((m) => {
                  const days = daysUntil(m.next_due_date);
                  return (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span>{m.name}</span>
                      <Badge variant={days !== null && days <= 14 ? "destructive" : "secondary"}>
                        {days !== null ? `${days}d` : "—"}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Expiring Warranties */}
        <Card>
          <CardHeader><CardTitle className="text-base">Expiring Warranties</CardTitle></CardHeader>
          <CardContent>
            {data.expiring_warranties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No warranties expiring within 90 days.</p>
            ) : (
              <ul className="space-y-2">
                {data.expiring_warranties.map((a) => {
                  const days = daysUntil(a.warranty_expiry);
                  return (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span>{a.name}</span>
                      <Badge variant="warning">{formatDate(a.warranty_expiry)} ({days}d)</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Expiring Documents */}
        <Card>
          <CardHeader><CardTitle className="text-base">Expiring Documents</CardTitle></CardHeader>
          <CardContent>
            {data.expiring_documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents expiring within 60 days.</p>
            ) : (
              <ul className="space-y-2">
                {data.expiring_documents.map((d) => {
                  const days = daysUntil(d.expiry_date);
                  return (
                    <li key={d.id} className="flex items-center justify-between text-sm">
                      <span>{d.title}</span>
                      <Badge variant="warning">{formatDate(d.expiry_date)} ({days}d)</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
          <CardContent>
            {data.recent_expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recent_expenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{e.type}</span>
                    <span className="font-medium">{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
