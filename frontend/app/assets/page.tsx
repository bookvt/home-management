"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateInput } from "@/components/ui/date-input";
import { FileUpload } from "@/components/ui/file-upload";
import { assets as api } from "@/lib/api";
import { formatDate, formatCurrency, isExpiringSoon } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Asset } from "@/types";

const emptyForm = { name: "", category: "", purchase_date: "", price: "", warranty_expiry: "", notes: "", image: null as File | null };

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = () => api.list().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({ name: a.name, category: a.category, purchase_date: a.purchase_date?.slice(0, 10) ?? "", price: a.price?.toString() ?? "", warranty_expiry: a.warranty_expiry?.slice(0, 10) ?? "", notes: a.notes, image: null });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (form.image) {
        const fd = new FormData();
        fd.append("name", form.name); fd.append("category", form.category); fd.append("notes", form.notes);
        if (form.purchase_date) fd.append("purchase_date", form.purchase_date);
        if (form.price) fd.append("price", form.price);
        if (form.warranty_expiry) fd.append("warranty_expiry", form.warranty_expiry);
        fd.append("image", form.image);
        if (editing) await api.update(editing.id, fd); else await api.create(fd);
      } else {
        const payload = { name: form.name, category: form.category, notes: form.notes, purchase_date: form.purchase_date || null, price: form.price ? parseFloat(form.price) : null, warranty_expiry: form.warranty_expiry || null };
        if (editing) { await api.update(editing.id, payload); } else {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => v != null && fd.append(k, String(v)));
          await api.create(fd);
        }
      }
      setOpen(false); load();
      toast({ title: editing ? "อัปเดตแล้ว" : "เพิ่มทรัพย์สินแล้ว" });
    } catch (e) { toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: String(e) }); }
  };

  const remove = async (id: number) => {
    if (!confirm("ต้องการลบทรัพย์สินนี้ใช่หรือไม่?")) return;
    await api.delete(id); load(); toast({ title: "ลบแล้ว" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">ทรัพย์สิน</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">รายการทรัพย์สินและอุปกรณ์ในบ้าน</p>
        </div>
        <Button size="sm" onClick={openCreate} className="shrink-0"><Plus className="mr-1.5 h-4 w-4" />เพิ่มทรัพย์สิน</Button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-medium w-14">รูป</TableHead>
                <TableHead className="text-xs font-medium">ชื่อ</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">หมวดหมู่</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">ราคา</TableHead>
                <TableHead className="text-xs font-medium">วันหมดประกัน</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีทรัพย์สิน</TableCell></TableRow>
              )}
              {items.map((a) => {
                const expiring = isExpiringSoon(a.warranty_expiry, 90);
                return (
                  <TableRow key={a.id} className="group">
                    <TableCell>
                      {a.image_url
                        ? <Image src={a.image_url} alt={a.name} width={36} height={36} className="rounded-lg object-cover h-9 w-9 border border-border" />
                        : <div className="h-9 w-9 rounded-lg bg-muted border border-border" />}
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{a.category}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatCurrency(a.price)}</TableCell>
                    <TableCell>
                      {a.warranty_expiry
                        ? <Badge variant={expiring ? "warning" : "secondary"} className="text-xs gap-1 whitespace-nowrap">{expiring && <AlertTriangle className="h-3 w-3" />}{formatDate(a.warranty_expiry)}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อ"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="หมวดหมู่"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="เช่น เครื่องใช้ไฟฟ้า" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่ซื้อ"><DateInput value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></Field>
              <Field label="ราคา (บาท)"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            </div>
            <Field label="วันหมดประกัน"><DateInput value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></Field>
            <Field label="หมายเหตุ"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
            <Field label="รูปภาพ">
              <FileUpload accept="image/*" value={form.image} onChange={(f) => setForm({ ...form, image: f })} placeholder="คลิกเพื่อเลือกรูปภาพ" />
              {editing?.image_url && !form.image && (
                <Image src={editing.image_url} alt="" width={64} height={64} className="mt-2 rounded-lg object-cover h-16 w-16 border border-border" />
              )}
            </Field>
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
