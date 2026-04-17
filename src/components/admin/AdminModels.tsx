import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Plus, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

type ProviderType = "lovable" | "openai_compatible" | "anthropic";
type Category = "text" | "image" | "reasoning";

type Model = {
  id: string;
  display_name: string;
  provider: string;
  category: Category;
  credits_cost: number;
  is_active: boolean;
  description: string | null;
  provider_type: ProviderType;
  api_base_url: string | null;
  api_model_name: string | null;
  api_key_secret_name: string | null;
};

const emptyForm = {
  id: "",
  display_name: "",
  provider: "",
  category: "text" as Category,
  credits_cost: 1,
  is_active: true,
  description: "",
  provider_type: "openai_compatible" as ProviderType,
  api_base_url: "",
  api_model_name: "",
  api_key_secret_name: "",
};

export function AdminModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, Partial<Model>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_models")
      .select("*")
      .order("provider_type")
      .order("credits_cost");
    if (error) toast.error(error.message);
    setModels((data ?? []) as Model[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Model>) => {
    setDirty((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  const saveInline = async (id: string) => {
    const patch = dirty[id];
    if (!patch) return;
    setSavingId(id);
    const { error } = await supabase.from("ai_models").update(patch).eq("id", id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Model updated");
    setDirty((d) => { const { [id]: _, ...rest } = d; return rest; });
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (m: Model) => {
    setEditing(m);
    setForm({
      id: m.id,
      display_name: m.display_name,
      provider: m.provider,
      category: m.category,
      credits_cost: m.credits_cost,
      is_active: m.is_active,
      description: m.description ?? "",
      provider_type: m.provider_type,
      api_base_url: m.api_base_url ?? "",
      api_model_name: m.api_model_name ?? "",
      api_key_secret_name: m.api_key_secret_name ?? "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.id.trim() || !form.display_name.trim() || !form.provider.trim()) {
      toast.error("Model ID, display name, and provider are required");
      return;
    }
    if (form.provider_type !== "lovable") {
      if (!form.api_model_name.trim() || !form.api_key_secret_name.trim()) {
        toast.error("API model name and secret name are required for custom providers");
        return;
      }
      if (form.provider_type === "openai_compatible" && !form.api_base_url.trim()) {
        toast.error("Base URL is required for OpenAI-compatible providers");
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      display_name: form.display_name.trim(),
      provider: form.provider.trim(),
      category: form.category,
      credits_cost: form.credits_cost,
      is_active: form.is_active,
      description: form.description.trim() || null,
      provider_type: form.provider_type,
      api_base_url: form.provider_type === "lovable" ? null : form.api_base_url.trim() || null,
      api_model_name: form.provider_type === "lovable" ? null : form.api_model_name.trim() || null,
      api_key_secret_name: form.provider_type === "lovable" ? null : form.api_key_secret_name.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("ai_models").update(payload).eq("id", editing.id)
      : await supabase.from("ai_models").insert({ ...payload, id: form.id.trim() });

    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Model updated" : "Model added");
    setDialogOpen(false);
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("ai_models").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); setDeleteId(null); return; }
    toast.success("Model deleted");
    setDeleteId(null);
    load();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>AI Models ({models.length})</CardTitle>
          <Button size="sm" onClick={openCreate} className="h-10 w-full gap-2 sm:w-auto">
            <Plus className="h-4 w-4" /> Add Model
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              To add a custom provider (e.g. OpenRouter, Anthropic): first add the API key as a secret in <strong>Lovable Cloud → Secrets</strong>, then add the model here using that secret name.
              OpenRouter gives access to Claude, Gemini, Llama, Mistral and more with one key.
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((m) => {
                    const cur = { ...m, ...dirty[m.id] };
                    const isDirty = !!dirty[m.id];
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{m.display_name}</div>
                          <div className="text-xs text-muted-foreground">{m.id} · {m.provider}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.provider_type === "lovable" ? "secondary" : "default"} className="text-xs">
                            {m.provider_type === "lovable" ? "Lovable AI" : m.provider_type === "anthropic" ? "Anthropic" : "Custom API"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{m.category}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={cur.credits_cost}
                            onChange={(e) => update(m.id, { credits_cost: parseInt(e.target.value, 10) || 0 })}
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={cur.is_active}
                            onCheckedChange={(v) => update(m.id, { is_active: v })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {isDirty && (
                              <Button size="sm" variant="outline" disabled={savingId === m.id} onClick={() => saveInline(m.id)}>
                                {savingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(m.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Model" : "Add AI Model"}</DialogTitle>
            <DialogDescription>
              Configure a model from Lovable AI or plug in any external provider via API key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Model ID (internal slug) *</Label>
                <Input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  disabled={!!editing}
                  placeholder="e.g. claude-sonnet-or"
                />
              </div>
              <div>
                <Label>Display Name *</Label>
                <Input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="e.g. Claude 3.5 Sonnet"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Provider Label *</Label>
                <Input
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  placeholder="e.g. Anthropic via OpenRouter"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: Category) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="reasoning">Reasoning</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Provider Type *</Label>
              <Select value={form.provider_type} onValueChange={(v: ProviderType) => setForm({ ...form, provider_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">Lovable AI Gateway (built-in)</SelectItem>
                  <SelectItem value="openai_compatible">OpenAI-Compatible (OpenRouter, Groq, DeepSeek, etc.)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (native API)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.provider_type !== "lovable" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs font-medium text-muted-foreground">External Provider Settings</div>

                <div>
                  <Label>API Model Name *</Label>
                  <Input
                    value={form.api_model_name}
                    onChange={(e) => setForm({ ...form, api_model_name: e.target.value })}
                    placeholder={form.provider_type === "anthropic" ? "claude-3-5-sonnet-20241022" : "anthropic/claude-3.5-sonnet"}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">The model id sent to the provider's API.</p>
                </div>

                {form.provider_type === "openai_compatible" && (
                  <div>
                    <Label>Base URL *</Label>
                    <Input
                      value={form.api_base_url}
                      onChange={(e) => setForm({ ...form, api_base_url: e.target.value })}
                      placeholder="https://openrouter.ai/api/v1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Without trailing slash. /chat/completions will be appended.</p>
                  </div>
                )}

                <div>
                  <Label>Secret Name *</Label>
                  <Input
                    value={form.api_key_secret_name}
                    onChange={(e) => setForm({ ...form, api_key_secret_name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                    placeholder="OPENROUTER_API_KEY"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Name of the secret you've added in Lovable Cloud → Secrets that contains the API key.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Credits / Message *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.credits_cost}
                  onChange={(e) => setForm({ ...form, credits_cost: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Short description shown to users"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this model?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the model. Existing conversations referencing it will lose the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
