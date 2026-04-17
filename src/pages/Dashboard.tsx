import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { mockProjects, mockUser, prebuiltAssistants } from "@/data/mock-data";
import { Plus, FolderOpen, Sparkles, Code2, Database, Globe, FileText, Terminal, Search, Bot } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const aiAssistants = [
  { name: "Programming Tutor", description: "Get guidance on code structure, patterns, and best practices", icon: Code2 },
  { name: "Database Expert", description: "Design schemas, write queries, and optimize databases", icon: Database },
  { name: "API Architect", description: "Design RESTful APIs, plan endpoints, and handle auth flows", icon: Globe },
  { name: "Documentation Writer", description: "Generate README files, API docs, and technical guides", icon: FileText },
  { name: "DevOps Guide", description: "CI/CD pipelines, Docker, deployment strategies", icon: Terminal },
  { name: "Code Reviewer", description: "Get code reviews, find bugs, and improve quality", icon: Search },
];

export default function Dashboard() {
  const [projects, setProjects] = useState(mockProjects.slice(0, 0));
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    setProjects([
      ...projects,
      {
        id: `p${Date.now()}`,
        name: newName,
        description: newDesc,
        assistantCount: 0,
        conversationCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground sm:p-8">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                Welcome back, {mockUser.name}!
              </h1>
              <p className="mt-2 text-sm text-primary-foreground/90 sm:text-base">
                Your AI-powered development coach is ready. Start a project to get personalized guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Credits</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{mockUser.credits}</p>
            <p className="mt-1 text-sm text-muted-foreground">credits remaining</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</p>
            <p className="mt-2 font-heading text-3xl font-bold text-foreground">{projects.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">total projects</p>
          </div>
        </div>

        {/* Recent Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground">Recent Projects</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Awesome Project" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this project about?" />
                  </div>
                  <Button
                    onClick={handleCreate}
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
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start working with AI assistants and build your workspace.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="mt-5 gap-2 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> New Project
              </Button>
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
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5" /> {p.assistantCount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* AI Assistants */}
        <section>
          <h2 className="mb-4 font-heading text-xl font-bold text-foreground">AI Assistants</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiAssistants.map((a) => (
              <div
                key={a.name}
                className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{a.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
