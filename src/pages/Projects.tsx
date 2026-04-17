import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockProjects } from "@/data/mock-data";
import { Plus, FolderOpen, Bot, MessageCircle } from "lucide-react";

export default function Projects() {
  const [projects, setProjects] = useState(mockProjects);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [open, setOpen] = useState(false);

  const create = () => {
    if (!name.trim()) return;
    setProjects([
      ...projects,
      {
        id: `p${Date.now()}`,
        name,
        description: desc,
        assistantCount: 0,
        conversationCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setName("");
    setDesc("");
    setOpen(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">All your AI-powered workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground">
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
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Project" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project about?" />
                </div>
                <Button
                  onClick={create}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
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
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5" /> {p.assistantCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {p.conversationCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
