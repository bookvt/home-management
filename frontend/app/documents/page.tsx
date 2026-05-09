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
        fd.append("title", form.title);
        fd.append("category", form.category);
        fd.append("notes", form.notes);
        if (form.expiry_date) fd.append("expiry_date", form.expiry_date);
        fd.append("file", form.file);
        if (editing) await api.update(editing.id, fd);
        else await api.create(fd);
      } else {
        if (!editing) { toast({ variant: "destructive", title: "File is required" }); return; }
        await api.update(editing.id, {
          title: form.title, category: form.category, notes: form.notes,
          expiry_date: form.expiry_date || null,
        });
      }
      setOpen(false);
      load();
      toast({ title: editing ? "Updated" : "Uploaded" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: String(e) });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    await api.delete(id);
    load();
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents Vault</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Upload Document</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>File</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No documents yet.</TableCell></TableRow>
          )}
          {items.map((d) => {
            const expiring = isExpiringSoon(d.expiry_date, 60);
            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />{d.title}
                </TableCell>
                <TableCell>{d.category}</TableCell>
                <TableCell>
                  {d.expiry_date ? (
                    <Badge variant={expiring ? "warning" : "secondary"}>
                      {expiring && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {formatDate(d.expiry_date)}
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{d.notes}</TableCell>
                <TableCell>
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Upload"} Document</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="grid gap-1.5">
              <Label>File (PDF / Image) {editing && <span className="text-muted-foreground text-xs">(leave empty to keep existing)</span>}</Label>
              <Input type="file" accept=".pdf,image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
            </div>
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
