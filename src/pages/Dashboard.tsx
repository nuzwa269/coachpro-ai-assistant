import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockProjects, mockUser } from "@/data/mock-data";
import { Plus, FolderOpen, MessageCircle, Bot, CreditCard, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [projects, setProjects] = useState(mockProjects);
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        {/* Welcome & Credits */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Welcome, {mockUser.name}</h1>
            <p className="text-muted-foreground">Manage your projects and continue learning.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold">{mockUser.credits}</span>
              <span className="text-sm text-muted-foreground">Credits</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">Buy More</Link>
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Your Projects</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Awesome Project" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this project about?" />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/project/${p.id}`}>
              <Card className="h-full border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5" /> {p.assistantCount} assistants
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" /> {p.conversationCount} chats
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                    Open Project <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
