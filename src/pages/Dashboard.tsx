import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderOpen, Sparkles, Bot } from "lucide-react";
import { toast } from "sonner";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id,name,description,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setProjects(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, user_id: user.id })
      .select("id,name,description,created_at")
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProjects([data, ...projects]);
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
    toast.success("Project created");
  };

  const displayName = profile?.name || profile?.email?.split("@")[0] || "there";

  return (
    <AppShell>
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">Welcome back, {displayName}!</h1>
              <p className="mt-2 text-sm text-primary-foreground/90 sm:text-base">
                Your AI-powered development coach is ready. Start a project to get personalized guidance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Credits</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{profile?.credits ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">credits remaining</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
            <p className="mt-2 font-heading text-3xl font-bold capitalize text-foreground">{profile?.plan ?? "free"}</p>
            <p className="mt-1 text-sm text-muted-foreground">current plan</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{projects.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">total projects</p>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground">Recent Projects</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Project Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Awesome Project" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this project about?" />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start working with AI assistants.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-5 gap-2">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description || "No description"}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground">AI Assistants</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/assistants")} className="gap-2">
              <Bot className="h-4 w-4" /> Manage Assistants
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Activate prebuilt assistants or create your own from the Assistants page.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
