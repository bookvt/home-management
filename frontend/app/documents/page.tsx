"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateInput } from "@/components/ui/date-input";
import { FileUpload } from "@/components/ui/file-upload";
import { documents as api } from "@/lib/api";
import { formatDate, isExpiringSoon } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Document } from "@/types";

const emptyForm = { title: "", category: "", expiry_date: "", notes: "", file: null as File | null };

export default function DocumentsPage() {
  const [items, setItems] = useState<Document[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = () => api.list().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (d: Document) => {
    setEditing(d);
    setForm({ title: d.title, category: d.category, expiry_date: d.expiry_date?.slice(0, 10) ?? "", notes: d.notes, file: null });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (form.file) {
        const fd = new FormData();
        fd.append("title", form.title); fd.append("category", form.category); fd.append("notes", form.notes);
        if (form.expiry_date) fd.append("expiry_date", form.expiry_date);
        fd.append("file", form.file);
        if (editing) await api.update(editing.id, fd); else await api.create(fd);
      } else {
        if (!editing) { toast({ variant: "destructive", title: "กรุณาเลือกไฟล์" }); return; }
        await api.update(editing.id, { title: form.title, category: form.category, notes: form.notes, expiry_date: form.expiry_date || null });
      }
      setOpen(false); load();
      toast({ title: editing ? "อัปเดตแล้ว" : "อัปโหลดเอกสารแล้ว" });
    } catch (e) { toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: String(e) }); }
  };

  const remove = async (id: number) => {
    if (!confirm("ต้องการลบเอกสารนี้ใช่หรือไม่?")) return;
    await api.delete(id); load(); toast({ title: "ลบแล้ว" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">เอกสาร</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">จัดเก็บเอกสารสำคัญของบ้าน</p>
        </div>
        <Button size="sm" onClick={openCreate} className="shrink-0"><Plus className="mr-1.5 h-4 w-4" />อัปโหลดเอกสาร</Button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-medium">ชื่อเอกสาร</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">หมวดหมู่</TableHead>
                <TableHead className="text-xs font-medium">วันหมดอายุ</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">หมายเหตุ</TableHead>
                <TableHead className="text-xs font-medium">ไฟล์</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีเอกสาร</TableCell></TableRow>
              )}
              {items.map((d) => {
                const expiring = isExpiringSoon(d.expiry_date, 60);
                return (
                  <TableRow key={d.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{d.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{d.category}</TableCell>
                    <TableCell>
                      {d.expiry_date
                        ? <Badge variant={expiring ? "warning" : "secondary"} className="text-xs gap-1 whitespace-nowrap">{expiring && <AlertTriangle className="h-3 w-3" />}{formatDate(d.expiry_date)}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground hidden md:table-cell">{d.notes || "—"}</TableCell>
                    <TableCell>
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                        เปิด <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "แก้ไขเอกสาร" : "อัปโหลดเอกสาร"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="ชื่อเอกสาร"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ประกันภัยบ้าน" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="หมวดหมู่"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="เช่น ประกัน" /></Field>
              <Field label="วันหมดอายุ"><DateInput value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></Field>
            </div>
            <Field label="หมายเหตุ"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
            <Field label={`ไฟล์ PDF / รูปภาพ${editing ? " (เว้นว่างเพื่อคงไฟล์เดิม)" : ""}`}>
              <FileUpload accept=".pdf,image/*" value={form.file} onChange={(f) => setForm({ ...form, file: f })} placeholder="คลิกเพื่อเลือกไฟล์ PDF หรือรูปภาพ" />
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
