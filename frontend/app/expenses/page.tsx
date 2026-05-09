"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { expenses as api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Expense, MonthlyTrend } from "@/types";

const TYPES = [
  { value: "electric", label: "ไฟฟ้า",       emoji: "⚡" },
  { value: "water",    label: "น้ำประปา",     emoji: "💧" },
  { value: "internet", label: "อินเทอร์เน็ต", emoji: "🌐" },
  { value: "other",    label: "อื่นๆ",        emoji: "📦" },
];
const TYPE_COLORS: Record<string, string> = { electric: "#eab308", water: "#3b82f6", internet: "#22d3ee", other: "#f97316" };

function TypeOption({ value }: { value: string }) {
  const t = TYPES.find((x) => x.value === value);
  if (!t) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
        style={{ background: TYPE_COLORS[t.value] + "22", color: TYPE_COLORS[t.value] }}
      >
        {t.emoji}
      </span>
      <span>{t.label}</span>
    </div>
  );
}

function buildChartData(trends: MonthlyTrend[]) {
  const months: Record<string, Record<string, number>> = {};
  for (const t of trends) {
    if (!months[t.month]) months[t.month] = {};
    months[t.month][t.type] = t.total;
  }
  return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, vals]) => ({ month, ...vals }));
}

const emptyForm = { type: "other", amount: "", month: "", is_one_off: false, date: "", notes: "" };

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [monthFilter, setMonthFilter] = useState("");
  const { toast } = useToast();

  const load = () => { api.list().then(setItems).catch(console.error); api.trends().then(setTrends).catch(console.error); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ type: e.type, amount: e.amount.toString(), month: e.month, is_one_off: e.is_one_off, date: e.date?.slice(0, 10) ?? "", notes: e.notes });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { type: form.type, amount: parseFloat(form.amount), month: form.month, is_one_off: form.is_one_off, date: form.date || null, notes: form.notes };
      if (editing) await api.update(editing.id, payload); else await api.create(payload);
      setOpen(false); load();
      toast({ title: editing ? "อัปเดตแล้ว" : "เพิ่มรายการแล้ว" });
    } catch (e) { toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: String(e) }); }
  };

  const remove = async (id: number) => {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    await api.delete(id); load(); toast({ title: "ลบแล้ว" });
  };

  const filtered = items.filter((e) => !monthFilter || e.month === monthFilter);
  const chartData = buildChartData(trends);
  const typeLabel = (v: string) => TYPES.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">ค่าใช้จ่าย</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">บันทึกค่าบิลและค่าใช้จ่ายต่างๆ</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />เพิ่มรายการ</Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="h-9 gap-0.5 rounded-lg border border-border bg-muted p-1">
          <TabsTrigger value="list" className="rounded-md px-4 text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">รายการ</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-md px-4 text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">แนวโน้มรายเดือน</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <Input placeholder="กรองตามเดือน เช่น 2024-01…" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="max-w-xs bg-white" />
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-medium">ประเภท</TableHead>
                  <TableHead className="text-xs font-medium">จำนวนเงิน</TableHead>
                  <TableHead className="text-xs font-medium">เดือน / วันที่</TableHead>
                  <TableHead className="text-xs font-medium">หมายเหตุ</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">ไม่มีรายการค่าใช้จ่าย</TableCell></TableRow>
                )}
                {filtered.map((e) => (
                  <TableRow key={e.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[e.type] ?? "#ccc" }} />
                        {typeLabel(e.type)}
                        {e.is_one_off && <Badge variant="secondary" className="text-xs">ครั้งเดียว</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{e.is_one_off ? formatDate(e.date) : e.month}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">{e.notes || "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-5 text-sm font-medium">ค่าบิลรายเดือน (12 เดือนล่าสุด)</h2>
            {chartData.length === 0
              ? <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
              : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `฿${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 13% 91%)", fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={8} />
                    {TYPES.map((t) => <Bar key={t.value} dataKey={t.value} stackId="a" fill={TYPE_COLORS[t.value]} name={t.label} radius={t.value === "other" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />)}
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขรายการ" : "เพิ่มค่าใช้จ่าย"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="ประเภท">
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <TypeOption value={form.type} />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <TypeOption value={t.value} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="จำนวนเงิน (บาท)"><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></Field>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="one-off" checked={form.is_one_off} onChange={(e) => setForm({ ...form, is_one_off: e.target.checked })} className="h-4 w-4 accent-primary" />
              <Label htmlFor="one-off" className="text-sm cursor-pointer">ค่าใช้จ่ายครั้งเดียว</Label>
            </div>
            {form.is_one_off
              ? <Field label="วันที่"><DateInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              : <Field label="เดือน"><Input placeholder="2024-01" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>}
            <Field label="หมายเหตุ"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
