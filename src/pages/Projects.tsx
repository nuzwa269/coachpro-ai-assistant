import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDesc("");
    setOpen(true);
  };

  const openEdit = (p: ProjectRow) => {
    setEditing(p);
    setName(p.name);
    setDesc(p.description ?? "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setSubmitting(true);
    if (editing) {
      const { data, error } = await supabase
        .from("projects")
        .update({ name: name.trim(), description: desc.trim() || null })
        .eq("id", editing.id)
        .select("id,name,description,created_at")
        .single();
      setSubmitting(false);
      if (error) return toast.error(error.message);
      setProjects(projects.map((p) => (p.id === data.id ? data : p)));
      toast.success("Project updated");
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name: name.trim(), description: desc.trim() || null, user_id: user.id })
        .select("id,name,description,created_at")
        .single();
      setSubmitting(false);
      if (error) return toast.error(error.message);
      setProjects([data, ...projects]);
      toast.success("Project created");
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProjects(projects.filter((p) => p.id !== id));
    toast.success("Project deleted");
  };

  return (
    <AppShell>
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">All your AI-powered workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="h-10 shrink-0 gap-2">
                <Plus className="h-4 w-4" /> <span className="hidden xs:inline">New Project</span><span className="xs:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Project" : "Create New Project"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Project Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Project" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project about?" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? "Saving..." : editing ? "Save Changes" : "Create Project"}
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
            <p className="mt-2 text-sm text-muted-foreground">Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="group relative rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
                <Link to={`/project/${p.id}`} className="block">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description || "No description"}</p>
                </Link>
                <div className="mt-3 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{p.name}" and all its conversations. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
