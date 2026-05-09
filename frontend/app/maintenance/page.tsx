"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
    setForm({
      name: m.name,
      date: m.date.slice(0, 10),
      notes: m.notes,
      next_due_date: m.next_due_date?.slice(0, 10) ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, next_due_date: form.next_due_date || null };
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
    if (!confirm("Delete this record?")) return;
    await api.delete(id);
    load();
    toast({ title: "Deleted" });
  };

  const filtered = items.filter((m) =>
    !filter || m.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Record</Button>
      </div>

      <Input placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Next Due</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No records.</TableCell></TableRow>
          )}
          {filtered.map((m) => {
            const days = daysUntil(m.next_due_date);
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell>
                  {m.next_due_date ? (
                    <Badge variant={days !== null && days <= 14 ? "destructive" : days !== null && days <= 30 ? "warning" : "secondary"}>
                      {formatDate(m.next_due_date)}
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{m.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Maintenance Record</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Next Due Date"><Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></Field>
            <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
