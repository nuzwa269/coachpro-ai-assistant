import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

type Assistant = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string;
  system_prompt: string;
  default_model_id: string | null;
  is_prebuilt: boolean;
  is_active: boolean;
  owner_id: string | null;
  sort_order: number;
  conversation_starters: string[];
};

type ModelOpt = { id: string; display_name: string };

const ICON_OPTIONS = [
  "Bot", "Code2", "Sparkles", "Brain", "BookOpen", "Lightbulb",
  "Wrench", "Rocket", "Target", "GraduationCap", "Cpu", "Zap",
];

const emptyForm = {
  name: "",
  description: "",
  category: "",
  icon: "Bot",
  system_prompt: "",
  default_model_id: "",
  starters: ["", "", "", "", ""] as string[],
};

export function AdminAssistants() {
  const [items, setItems] = useState<Assistant[]>([]);
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Assistant | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const [a, m] = await Promise.all([
      supabase
        .from("assistants")
        .select("id,name,description,category,icon,system_prompt,default_model_id,is_prebuilt,is_active,owner_id,sort_order,conversation_starters")
        .order("is_prebuilt", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name"),
      supabase.from("ai_models").select("id,display_name").eq("is_active", true).order("display_name"),
    ]);
    if (a.error) toast.error(a.error.message);
    if (m.error) toast.error(m.error.message);
    setItems((a.data ?? []) as Assistant[]);
    setModels((m.data ?? []) as ModelOpt[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("assistants").update({ is_active }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(is_active ? "Activated" : "Deactivated");
    setItems((arr) => arr.map((a) => (a.id === id ? { ...a, is_active } : a)));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Assistant) => {
    setEditing(a);
    const s = (a.conversation_starters ?? []).slice(0, 5);
    while (s.length < 5) s.push("");
    setForm({
      name: a.name,
      description: a.description ?? "",
      category: a.category ?? "",
      icon: a.icon || "Bot",
      system_prompt: a.system_prompt,
      default_model_id: a.default_model_id ?? "",
      starters: s,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      return toast.error("Name and system prompt are required");
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      icon: form.icon || "Bot",
      system_prompt: form.system_prompt.trim(),
      default_model_id: form.default_model_id || null,
      conversation_starters: form.starters.map((s) => s.trim()).filter(Boolean).slice(0, 5),
    };

    const { error } = editing
      ? await supabase.from("assistants").update(payload).eq("id", editing.id)
      : await supabase.from("assistants").insert({
          ...payload,
          is_prebuilt: true,
          owner_id: null,
          is_active: true,
          sort_order: (items.filter((i) => i.is_prebuilt).reduce((m, i) => Math.max(m, i.sort_order ?? 0), 0)) + 10,
        });

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Assistant updated" : "Prebuilt assistant created");
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("assistants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setItems((arr) => arr.filter((a) => a.id !== id));
  };

  const move = async (a: Assistant, dir: "up" | "down") => {
    if (!a.is_prebuilt) return;
    const prebuilt = items.filter((i) => i.is_prebuilt).sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
    const idx = prebuilt.findIndex((i) => i.id === a.id);
    const swapWith = dir === "up" ? prebuilt[idx - 1] : prebuilt[idx + 1];
    if (!swapWith) return;

    const aOrder = a.sort_order ?? 0;
    const bOrder = swapWith.sort_order ?? 0;

    // optimistic
    setItems((arr) =>
      arr.map((i) =>
        i.id === a.id ? { ...i, sort_order: bOrder } : i.id === swapWith.id ? { ...i, sort_order: aOrder } : i,
      ),
    );

    const [r1, r2] = await Promise.all([
      supabase.from("assistants").update({ sort_order: bOrder }).eq("id", a.id),
      supabase.from("assistants").update({ sort_order: aOrder }).eq("id", swapWith.id),
    ]);
    if (r1.error || r2.error) {
      toast.error("Reorder failed");
      load();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Assistants ({items.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm" className="h-10 w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" /> Add Prebuilt Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Assistant" : "New Prebuilt Assistant"}</DialogTitle>
              <DialogDescription>
                Prebuilt assistants are visible to all users. Free users can activate any 1.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Code Tutor" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short tagline" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Coding" />
                </div>
                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Default Model</Label>
                <Select value={form.default_model_id || "none"} onValueChange={(v) => setForm({ ...form, default_model_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prompt">System Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  placeholder="You are a helpful coding tutor that..."
                  rows={8}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create assistant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a, idx, arr) => {
                  const prebuiltList = arr.filter((i) => i.is_prebuilt);
                  const pIdx = prebuiltList.findIndex((i) => i.id === a.id);
                  const isFirst = pIdx === 0;
                  const isLast = pIdx === prebuiltList.length - 1;
                  return (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.is_prebuilt ? (
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => move(a, "up")}
                            disabled={isFirst}
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => move(a, "down")}
                            disabled={isLast}
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.is_prebuilt ? "default" : "secondary"}>
                        {a.is_prebuilt ? "Prebuilt" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={a.is_active} onCheckedChange={(v) => toggle(a.id, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {a.is_prebuilt && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{a.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the assistant. Conversations using it will lose their reference.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(a.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
