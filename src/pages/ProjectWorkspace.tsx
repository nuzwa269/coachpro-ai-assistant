import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockConversations, prebuiltAssistants, mockProjects } from "@/data/mock-data";
import {
  Send, Bookmark, BookmarkCheck, Bot, User, Plus, ArrowLeft,
  GraduationCap, Building2, Bug, Lightbulb, Code, MessageCircle, CreditCard,
} from "lucide-react";
import type { Message } from "@/data/mock-data";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code,
};

export default function ProjectWorkspace() {
  const { id } = useParams();
  const project = mockProjects.find((p) => p.id === id) || mockProjects[0];
  const projectConvos = mockConversations.filter((c) => c.projectId === id);

  const [selectedConvo, setSelectedConvo] = useState(projectConvos[0]?.id || "");
  const [messages, setMessages] = useState<Message[]>(
    projectConvos[0]?.messages || []
  );
  const [input, setInput] = useState("");

  const currentConvo = projectConvos.find((c) => c.id === selectedConvo);
  const assistant = prebuiltAssistants.find((a) => a.id === currentConvo?.assistantId);
  const AssistantIcon = assistant ? iconMap[assistant.icon] || Bot : Bot;

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `m${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      isSaved: false,
    };
    const aiMsg: Message = {
      id: `m${Date.now() + 1}`,
      role: "assistant",
      content: "This is a mock AI response. In the production version, this will be powered by the AI assistant you selected. The response will be contextual and helpful based on your question and the assistant's expertise.",
      timestamp: new Date().toISOString(),
      isSaved: false,
    };
    setMessages([...messages, userMsg, aiMsg]);
    setInput("");
  };

  const toggleSave = (msgId: string) => {
    setMessages(messages.map((m) =>
      m.id === msgId ? { ...m, isSaved: !m.isSaved } : m
    ));
  };

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card p-4 md:block">
          <Link to="/dashboard" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h3 className="mb-1 font-heading text-lg font-semibold">{project.name}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium">Conversations</span>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {projectConvos.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConvo(c.id);
                  setMessages(c.messages);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedConvo === c.id
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <span className="text-sm font-medium">Assistants</span>
            <div className="mt-2 space-y-1">
              {prebuiltAssistants.slice(0, 3).map((a) => {
                const Icon = iconMap[a.icon] || Bot;
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <AssistantIcon className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{assistant?.name || "AI Assistant"}</p>
                <p className="text-xs text-muted-foreground">{currentConvo?.title || "New conversation"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> 1 credit per message
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                      <Bot className="h-4 w-4 text-secondary" />
                    </div>
                  )}
                  <div className={`group relative max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => toggleSave(m.id)}
                        className="absolute -right-8 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {m.isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="mx-auto flex max-w-3xl gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask your AI assistant..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="hidden w-64 shrink-0 border-l border-border bg-card p-4 lg:block">
          {assistant && (
            <Card className="border border-border">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <AssistantIcon className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-base">{assistant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{assistant.description}</p>
                <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Category: {assistant.category}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
