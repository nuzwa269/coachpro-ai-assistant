import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, GraduationCap, Building2, Bug, Lightbulb, Code, Bot, Pencil, Trash2, Check, Lock,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code, Bot,
};

type AssistantRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string | null;
  system_prompt: string;
  is_prebuilt: boolean;
  owner_id: string | null;
};

export default function Assistants() {
  const { user, profile } = useAuth();
  const isFree = (profile?.plan ?? "free") === "free";

  const [prebuilt, setPrebuilt] = useState<AssistantRow[]>([]);
  const [custom, setCustom] = useState<AssistantRow[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssistantRow | null>(null);
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("assistants").select("id,name,description,icon,category,system_prompt,is_prebuilt,owner_id").order("created_at"),
      supabase.from("user_active_assistants").select("assistant_id").eq("user_id", user.id),
    ]).then(([aRes, actRes]) => {
      if (aRes.error) toast.error(aRes.error.message);
      else {
        const all = aRes.data ?? [];
        setPrebuilt(all.filter((a) => a.is_prebuilt));
        setCustom(all.filter((a) => !a.is_prebuilt && a.owner_id === user.id));
      }
      if (actRes.data) setActiveIds(new Set(actRes.data.map((r) => r.assistant_id)));
      setLoading(false);
    });
  }, [user]);

  const toggleActive = async (assistantId: string) => {
    if (!user) return;
    if (activeIds.has(assistantId)) {
      const { error } = await supabase
        .from("user_active_assistants")
        .delete()
        .eq("user_id", user.id)
        .eq("assistant_id", assistantId);
      if (error) return toast.error(error.message);
      const next = new Set(activeIds);
      next.delete(assistantId);
      setActiveIds(next);
      toast.success("Deactivated");
    } else {
      const { error } = await supabase
        .from("user_active_assistants")
        .insert({ user_id: user.id, assistant_id: assistantId });
      if (error) {
        toast.error(error.message.includes("Free plan") ? "Free plan: deactivate current assistant first or upgrade." : error.message);
        return;
      }
      const next = new Set(activeIds);
      next.add(assistantId);
      setActiveIds(next);
      toast.success("Activated");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", systemPrompt: "" });
    setDialogOpen(true);
  };

  const openEdit = (a: AssistantRow) => {
    setEditing(a);
    setForm({ name: a.name, description: a.description ?? "", systemPrompt: a.system_prompt });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !user) return;
    setSubmitting(true);
    if (editing) {
      const { data, error } = await supabase
        .from("assistants")
        .update({ name: form.name.trim(), description: form.description.trim() || null, system_prompt: form.systemPrompt })
        .eq("id", editing.id)
        .select("id,name,description,icon,category,system_prompt,is_prebuilt,owner_id")
        .single();
      setSubmitting(false);
      if (error) return toast.error(error.message);
      setCustom(custom.map((c) => (c.id === data.id ? data : c)));
      toast.success("Assistant updated");
    } else {
      const { data, error } = await supabase
        .from("assistants")
        .insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          system_prompt: form.systemPrompt || "You are a helpful assistant.",
          icon: "Bot",
          is_prebuilt: false,
          owner_id: user.id,
          category: "Custom",
        })
        .select("id,name,description,icon,category,system_prompt,is_prebuilt,owner_id")
        .single();
      setSubmitting(false);
      if (error) {
        toast.error(error.message.includes("Free plan") ? "Free plan: max 1 custom assistant. Upgrade for more." : error.message);
        return;
      }
      setCustom([...custom, data]);
      toast.success("Assistant created");
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assistants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCustom(custom.filter((a) => a.id !== id));
    const next = new Set(activeIds);
    next.delete(id);
    setActiveIds(next);
    toast.success("Assistant deleted");
  };

  return (
    <AppShell>
      <div className="w-full space-y-8 p-4 sm:p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">AI Assistants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFree
              ? "Free plan: activate any 1 prebuilt assistant. Switch anytime by deactivating the current one."
              : "Activate prebuilt assistants or create your own."}
          </p>
        </div>

        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Prebuilt Assistants</h2>
          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {prebuilt.map((a) => {
                const Icon = iconMap[a.icon] || Bot;
                const isActive = activeIds.has(a.id);
                const lockedForFree = isFree && !isActive && activeIds.size >= 1;
                return (
                  <Card key={a.id} className={`border bg-card transition-colors ${isActive ? "border-primary" : "border-border"}`}>
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                        <Icon className="h-6 w-6 text-secondary" />
                      </div>
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      <CardDescription className="text-xs">{a.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                      {isActive && <Badge className="w-full justify-center" variant="default"><Check className="mr-1 h-3 w-3" /> Active</Badge>}
                      <Button
                        onClick={() => toggleActive(a.id)}
                        disabled={lockedForFree}
                        variant={isActive ? "outline" : "default"}
                        size="sm"
                        className="w-full"
                      >
                        {lockedForFree ? <><Lock className="mr-1 h-3 w-3" /> Locked</> : isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Your Custom Assistants</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Create Assistant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Assistant" : "Create Custom Assistant"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Assistant" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this assistant do?" />
                  </div>
                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea
                      value={form.systemPrompt}
                      onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                      placeholder="You are an expert in..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? "Saving..." : editing ? "Save Changes" : "Create Assistant"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {custom.length === 0 ? (
            <Card className="border border-dashed border-border bg-card p-8 text-center">
              <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No custom assistants yet. {isFree && "Free plan allows 1 custom assistant."}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {custom.map((a) => {
                const isActive = activeIds.has(a.id);
                return (
                  <Card key={a.id} className={`border bg-card ${isActive ? "border-primary" : "border-border"}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-base">{a.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      {isActive && <Badge className="w-full justify-center"><Check className="mr-1 h-3 w-3" /> Active</Badge>}
                      <Button onClick={() => toggleActive(a.id)} variant={isActive ? "outline" : "default"} size="sm" className="w-full">
                        {isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
