import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { prebuiltAssistants, customAssistants } from "@/data/mock-data";
import {
  Plus, GraduationCap, Building2, Bug, Lightbulb, Code, Bot,
  Pencil, Trash2,
} from "lucide-react";
import type { Assistant } from "@/data/mock-data";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code,
};

export default function Assistants() {
  const [customs, setCustoms] = useState<Assistant[]>(customAssistants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "" });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    setCustoms([
      ...customs,
      {
        id: `ca${Date.now()}`,
        name: form.name,
        description: form.description,
        systemPrompt: form.systemPrompt,
        icon: "Bot",
        isPrebuilt: false,
        category: "Custom",
      },
    ]);
    setForm({ name: "", description: "", systemPrompt: "" });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCustoms(customs.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        {/* Pre-built */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-bold">AI Assistants</h1>
          <p className="mt-1 text-muted-foreground">Choose a pre-built assistant or create your own.</p>
        </div>

        <h2 className="mb-4 font-heading text-xl font-semibold">Pre-Built Assistants</h2>
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prebuiltAssistants.map((a) => {
            const Icon = iconMap[a.icon] || Bot;
            return (
              <Card key={a.id} className="border border-border bg-card">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <Icon className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <CardDescription className="text-xs">{a.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Your Custom Assistants</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Create Assistant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Assistant</DialogTitle>
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
                <Button onClick={handleCreate} className="w-full">Create Assistant</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {customs.length === 0 ? (
          <Card className="border border-dashed border-border bg-card p-8 text-center">
            <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No custom assistants yet. Create one to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customs.map((a) => (
              <Card key={a.id} className="border border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base">{a.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
