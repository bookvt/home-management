"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { expenses as api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Expense, MonthlyTrend } from "@/types";

const TYPES = ["electric", "water", "internet", "other"];

const emptyForm = {
  type: "other", amount: "", month: "", is_one_off: false, date: "", notes: "",
};

// Build chart data from trends — pivot months into rows
function buildChartData(trends: MonthlyTrend[]) {
  const months: Record<string, Record<string, number>> = {};
  for (const t of trends) {
    if (!months[t.month]) months[t.month] = {};
    months[t.month][t.type] = t.total;
  }
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, vals]) => ({ month, ...vals }));
}

const COLORS: Record<string, string> = {
  electric: "#3b82f6",
  water: "#06b6d4",
  internet: "#8b5cf6",
  other: "#f59e0b",
};

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [monthFilter, setMonthFilter] = useState("");
  const { toast } = useToast();

  const load = () => {
    api.list().then(setItems).catch(console.error);
    api.trends().then(setTrends).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      type: e.type, amount: e.amount.toString(), month: e.month,
      is_one_off: e.is_one_off, date: e.date?.slice(0, 10) ?? "", notes: e.notes,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        month: form.month,
        is_one_off: form.is_one_off,
        date: form.date || null,
        notes: form.notes,
      };
      if (editing) await api.update(editing.id, payload);
      else await api.create(payload);
      setOpen(false);
      load();
      toast({ title: editing ? "Updated" : "Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: String(e) });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(id);
    load();
    toast({ title: "Deleted" });
  };

  const filtered = items.filter((e) => !monthFilter || e.month === monthFilter);
  const chartData = buildChartData(trends);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Input
            placeholder="Filter by month (YYYY-MM)…"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="max-w-xs"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Month / Date</TableHead>
                <TableHead>One-off</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No expenses.</TableCell></TableRow>
              )}
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="capitalize">{e.type}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
                  <TableCell>{e.is_one_off ? formatDate(e.date) : e.month}</TableCell>
                  <TableCell>{e.is_one_off ? <Badge variant="secondary">One-off</Badge> : "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{e.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Bill Trends (last 12 months)</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    {TYPES.map((t) => (
                      <Bar key={t} dataKey={t} stackId="a" fill={COLORS[t]} name={t} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Expense</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="one-off" checked={form.is_one_off} onChange={(e) => setForm({ ...form, is_one_off: e.target.checked })} className="h-4 w-4" />
              <Label htmlFor="one-off">One-off expense</Label>
            </div>
            {form.is_one_off ? (
              <div className="grid gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            ) : (
              <div className="grid gap-1.5"><Label>Month (YYYY-MM)</Label><Input placeholder="2024-01" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
            )}
            <div className="grid gap-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
