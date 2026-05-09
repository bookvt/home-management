"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { maintenance as api } from "@/lib/api";
import { formatDate, daysUntil } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Maintenance } from "@/types";

const empty = { name: "", date: "", notes: "", next_due_date: "" };

export default function MaintenancePage() {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("");
  const { toast } = useToast();

  const load = () => api.list().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m: Maintenance) => {
    setEditing(m);
    setForm({ name: m.name, date: m.date.slice(0, 10), notes: m.notes, next_due_date: m.next_due_date?.slice(0, 10) ?? "" });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, next_due_date: form.next_due_date || null };
      if (editing) await api.update(editing.id, payload);
      else await api.create(payload);
      setOpen(false); load();
      toast({ title: editing ? "อัปเดตแล้ว" : "เพิ่มรายการแล้ว" });
    } catch (e) {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: String(e) });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    await api.delete(id); load();
    toast({ title: "ลบรายการแล้ว" });
  };

  const filtered = items.filter((m) => !filter || m.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">การบำรุงรักษา</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">บันทึกและติดตามการบำรุงรักษาบ้าน</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />เพิ่มรายการ</Button>
      </div>

      <Input placeholder="ค้นหาชื่อรายการ…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs bg-white" />

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-medium">ชื่อรายการ</TableHead>
              <TableHead className="text-xs font-medium">วันที่ดำเนินการ</TableHead>
              <TableHead className="text-xs font-medium">วันครบกำหนดถัดไป</TableHead>
              <TableHead className="text-xs font-medium">หมายเหตุ</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</TableCell></TableRow>
            )}
            {filtered.map((m) => {
              const days = daysUntil(m.next_due_date);
              return (
                <TableRow key={m.id} className="group">
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(m.date)}</TableCell>
                  <TableCell>
                    {m.next_due_date ? (
                      <Badge variant={days !== null && days <= 14 ? "destructive" : days !== null && days <= 30 ? "warning" : "secondary"} className="text-xs">
                        {formatDate(m.next_due_date)}
                      </Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{m.notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขรายการ" : "เพิ่มรายการบำรุงรักษา"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="ชื่อรายการ"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น เปลี่ยนไส้กรองน้ำ" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่ดำเนินการ"><DateInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="วันครบกำหนดถัดไป"><DateInput value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></Field>
            </div>
            <Field label="หมายเหตุ"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="รายละเอียดเพิ่มเติม…" /></Field>
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
