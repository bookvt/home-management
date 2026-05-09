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
import { assets as api } from "@/lib/api";
import { formatDate, formatCurrency, isExpiringSoon } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { Asset } from "@/types";

const emptyForm = {
  name: "", category: "", purchase_date: "", price: "",
  warranty_expiry: "", notes: "", image: null as File | null,
};

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
    setForm({
      name: a.name, category: a.category,
      purchase_date: a.purchase_date?.slice(0, 10) ?? "",
      price: a.price?.toString() ?? "",
      warranty_expiry: a.warranty_expiry?.slice(0, 10) ?? "",
      notes: a.notes, image: null,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (form.image) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("category", form.category);
        fd.append("notes", form.notes);
        if (form.purchase_date) fd.append("purchase_date", form.purchase_date);
        if (form.price) fd.append("price", form.price);
        if (form.warranty_expiry) fd.append("warranty_expiry", form.warranty_expiry);
        fd.append("image", form.image);
        if (editing) await api.update(editing.id, fd);
        else await api.create(fd);
      } else {
        const payload = {
          name: form.name, category: form.category, notes: form.notes,
          purchase_date: form.purchase_date || null,
          price: form.price ? parseFloat(form.price) : null,
          warranty_expiry: form.warranty_expiry || null,
        };
        if (editing) await api.update(editing.id, payload);
        else {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => v != null && fd.append(k, String(v)));
          await api.create(fd);
        }
      }
      setOpen(false);
      load();
      toast({ title: editing ? "Updated" : "Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: String(e) });
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this asset?")) return;
    await api.delete(id);
    load();
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Asset Registry</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Asset</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Warranty</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No assets yet.</TableCell></TableRow>
          )}
          {items.map((a) => {
            const expiring = isExpiringSoon(a.warranty_expiry, 90);
            return (
              <TableRow key={a.id}>
                <TableCell>
                  {a.image_url ? (
                    <Image src={a.image_url} alt={a.name} width={48} height={48} className="rounded object-cover h-12 w-12" />
                  ) : <div className="h-12 w-12 rounded bg-muted" />}
                </TableCell>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell>{formatCurrency(a.price)}</TableCell>
                <TableCell>
                  {a.warranty_expiry ? (
                    <Badge variant={expiring ? "warning" : "secondary"}>
                      {expiring && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {formatDate(a.warranty_expiry)}
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Asset</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Warranty Expiry</Label><Input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="grid gap-1.5">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })} />
              {editing?.image_url && !form.image && (
                <Image src={editing.image_url} alt="" width={80} height={80} className="rounded object-cover h-20 w-20" />
              )}
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
