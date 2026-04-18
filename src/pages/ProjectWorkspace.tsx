import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Send, Bookmark, BookmarkCheck, Bot, User, Plus, ArrowLeft, Menu,
  GraduationCap, Building2, Bug, Lightbulb, Code, MessageCircle, MessageSquare, CreditCard, Loader2, Trash2, Info,
} from "lucide-react";
import { creditsToMessages, DEFAULT_CREDITS_PER_MESSAGE } from "@/lib/credits";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function getChatHealth(messages: Array<{ content: string }>) {
  const count = messages.length;
  const lastChars = messages.slice(-20).reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const score = count + lastChars / 2000;
  if (score < 20) return { label: "Healthy", color: "bg-emerald-500", tone: "text-emerald-600 dark:text-emerald-400", level: "ok" as const };
  if (score < 50) return { label: "Getting long", color: "bg-amber-500", tone: "text-amber-600 dark:text-amber-400", level: "warn" as const };
  return { label: "Very long", color: "bg-red-500", tone: "text-red-600 dark:text-red-400", level: "danger" as const };
}

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code, Bot,
};

type Project = { id: string; name: string; description: string | null };
type Assistant = {
  id: string; name: string; description: string | null; icon: string;
  category: string | null; is_prebuilt: boolean;
  system_prompt: string; default_model_id: string | null;
};
type Conversation = { id: string; title: string; assistant_id: string };
type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  conversation_id: string;
  isSaved?: boolean;
};

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeAssistantIds, setActiveAssistantIds] = useState<Set<string>>(new Set());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newAssistantId, setNewAssistantId] = useState<string>("");
  const [chatTooLong, setChatTooLong] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatHealth = useMemo(() => getChatHealth(messages), [messages]);

  // Load project, assistants, conversations
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [projRes, assistRes, activeRes, convoRes, savedRes] = await Promise.all([
        supabase.from("projects").select("id,name,description").eq("id", id).maybeSingle(),
        supabase.from("assistants").select("id,name,description,icon,category,is_prebuilt,system_prompt,default_model_id").eq("is_active", true),
        supabase.from("user_active_assistants").select("assistant_id").eq("user_id", user.id),
        supabase.from("conversations").select("id,title,assistant_id").eq("project_id", id).order("updated_at", { ascending: false }),
        supabase.from("saved_responses").select("message_id").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      if (projRes.error || !projRes.data) {
        toast.error("Project not found");
        navigate("/projects");
        return;
      }
      setProject(projRes.data);
      setAssistants((assistRes.data as Assistant[]) ?? []);
      setActiveAssistantIds(new Set(((activeRes.data as { assistant_id: string }[]) ?? []).map((a) => a.assistant_id)));
      const convos = (convoRes.data as Conversation[]) ?? [];
      setConversations(convos);
      setSavedMessageIds(new Set(((savedRes.data as { message_id: string }[]) ?? []).map((s) => s.message_id)));
      if (convos.length > 0) setSelectedConvoId(convos[0].id);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, id, navigate]);

  // Load messages for selected convo
  useEffect(() => {
    if (!selectedConvoId) { setMessages([]); return; }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,role,content,created_at,conversation_id")
        .eq("conversation_id", selectedConvoId)
        .order("created_at", { ascending: true });
      if (error) { toast.error(error.message); return; }
      setMessages((data as Message[]) ?? []);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    })();
  }, [selectedConvoId]);

  const currentConvo = conversations.find((c) => c.id === selectedConvoId);
  const currentAssistant = assistants.find((a) => a.id === currentConvo?.assistant_id);
  const AssistantIcon = currentAssistant ? iconMap[currentAssistant.icon] || Bot : Bot;

  const availableAssistants = useMemo(() => {
    // Custom (owned) or active prebuilt
    return assistants.filter((a) => !a.is_prebuilt || activeAssistantIds.has(a.id));
  }, [assistants, activeAssistantIds]);

  const createConversation = async () => {
    if (!user || !id) return;
    const assistantId = newAssistantId || availableAssistants[0]?.id;
    if (!assistantId) {
      toast.error("Activate an assistant first from the Assistants page.");
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, project_id: id, assistant_id: assistantId, title: "New conversation" })
      .select("id,title,assistant_id")
      .single();
    if (error) { toast.error(error.message); return; }
    setConversations([data as Conversation, ...conversations]);
    setSelectedConvoId(data.id);
    setNewAssistantId("");
  };

  const deleteConversation = async (convoId: string) => {
    if (!confirm("Delete this conversation?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", convoId);
    if (error) { toast.error(error.message); return; }
    const next = conversations.filter((c) => c.id !== convoId);
    setConversations(next);
    if (selectedConvoId === convoId) setSelectedConvoId(next[0]?.id ?? "");
    toast.success("Conversation deleted");
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !selectedConvoId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    // Insert user message
    const { data: userMsg, error: uErr } = await supabase
      .from("messages")
      .insert({ conversation_id: selectedConvoId, user_id: user.id, role: "user", content })
      .select("id,role,content,created_at,conversation_id")
      .single();
    if (uErr) { toast.error(uErr.message); setSending(false); return; }

    setMessages((prev) => [...prev, userMsg as Message]);

    // Auto-title on first message
    if (messages.length === 0) {
      const title = content.slice(0, 50);
      await supabase.from("conversations").update({ title }).eq("id", selectedConvoId);
      setConversations((prev) => prev.map((c) => c.id === selectedConvoId ? { ...c, title } : c));
    }

    // Resolve assistant + model for this conversation
    const convo = conversations.find((c) => c.id === selectedConvoId);
    const assistant = assistants.find((a) => a.id === convo?.assistant_id);
    const modelId = assistant?.default_model_id || "google/gemini-2.5-flash";

    if (!assistant) {
      toast.error("Assistant not found for this conversation");
      setSending(false);
      return;
    }

    // Build full message history for context (include the just-inserted user msg)
    const history = [...messages, userMsg as Message].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          conversation_id: selectedConvoId,
          model_id: modelId,
          messages: history,
          system_prompt: assistant.system_prompt,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const aiMsg = data.message as Message;
      setMessages((prev) => [...prev, aiMsg]);
      // Refresh credits in header/sidebar
      await refreshProfile();
    } catch (err: any) {
      const msg = err?.message || "AI request failed";
      if (msg.includes("Insufficient")) {
        toast.error("Out of credits", { description: "Top up to keep chatting." });
      } else if (msg.includes("Rate") || msg.includes("429")) {
        toast.error("Rate limited", { description: "Please wait a moment and try again." });
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  };

  const toggleSave = async (msg: Message) => {
    if (!user) return;
    const isSaved = savedMessageIds.has(msg.id);
    if (isSaved) {
      const { error } = await supabase
        .from("saved_responses")
        .delete()
        .eq("user_id", user.id)
        .eq("message_id", msg.id);
      if (error) { toast.error(error.message); return; }
      setSavedMessageIds((prev) => { const n = new Set(prev); n.delete(msg.id); return n; });
      toast.success("Removed from saved");
    } else {
      const { error } = await supabase
        .from("saved_responses")
        .insert({ user_id: user.id, message_id: msg.id, project_id: id });
      if (error) {
        toast.error(error.message.includes("Free plan") ? "Free plan: max 10 saved. Upgrade for more." : error.message);
        return;
      }
      setSavedMessageIds((prev) => new Set(prev).add(msg.id));
      toast.success("Saved");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link to="/projects" className="mb-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>
      <h3 className="mb-1 truncate font-heading text-base font-semibold">{project?.name}</h3>
      {project?.description && (
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="space-y-2">
        <Select value={newAssistantId} onValueChange={setNewAssistantId}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Choose assistant..." />
          </SelectTrigger>
          <SelectContent>
            {availableAssistants.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No active assistants. Activate one first.</div>
            ) : (
              availableAssistants.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-10 w-full" onClick={createConversation} disabled={availableAssistants.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> New Conversation
        </Button>
      </div>

      <div className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversations</div>
      <div className="-mr-2 flex-1 space-y-1 overflow-y-auto pr-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground">No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg pr-1 ${
                selectedConvoId === c.id ? "bg-primary/10" : "hover:bg-muted"
              }`}
            >
              <button
                onClick={() => setSelectedConvoId(c.id)}
                className={`flex-1 px-3 py-2.5 text-left text-sm ${
                  selectedConvoId === c.id ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
              </button>
              <button
                onClick={() => deleteConversation(c.id)}
                className="rounded-md p-2 opacity-60 transition-opacity hover:bg-muted-foreground/10 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-hidden border-r border-border bg-card p-4 md:block">
          {SidebarContent}
        </aside>

        {/* Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selectedConvoId ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {/* Mobile menu trigger */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 md:hidden" aria-label="Conversations">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 max-w-[85vw] p-4">
                      <SheetHeader className="mb-2 text-left">
                        <SheetTitle className="text-base">Project</SheetTitle>
                      </SheetHeader>
                      {SidebarContent}
                    </SheetContent>
                  </Sheet>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <AssistantIcon className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{currentAssistant?.name || "AI Assistant"}</p>
                    <p className="truncate text-xs text-muted-foreground">{currentConvo?.title}</p>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">
                    ≈ {creditsToMessages(profile?.credits).toLocaleString()}
                  </span>
                  <span>left · {DEFAULT_CREDITS_PER_MESSAGE}/msg</span>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Start the conversation by sending a message below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSaved = savedMessageIds.has(m.id);
                      return (
                        <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                          {m.role === "assistant" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                              <Bot className="h-4 w-4 text-secondary" />
                            </div>
                          )}
                          <div className={`relative max-w-[85%] break-words rounded-xl px-3.5 py-3 text-sm sm:max-w-[75%] sm:px-4 ${
                            m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            {m.role === "assistant" && (
                              <button
                                onClick={() => toggleSave(m)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-primary"
                                aria-label={isSaved ? "Unsave" : "Save"}
                              >
                                {isSaved ? (
                                  <>
                                    <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-primary">Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="h-3.5 w-3.5" />
                                    <span>Save</span>
                                  </>
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
                      );
                    })
                  )}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                        <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                      </div>
                      <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Thinking...</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border p-3 sm:p-4">
                <div className="mx-auto flex max-w-3xl gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Ask your AI assistant..."
                    className="h-11 flex-1"
                    disabled={sending}
                  />
                  <Button onClick={handleSend} size="icon" className="h-11 w-11" disabled={sending || !input.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile menu trigger when no convo selected */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5 md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Menu className="h-4 w-4" /> Project Menu
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 max-w-[85vw] p-4">
                    <SheetHeader className="mb-2 text-left">
                      <SheetTitle className="text-base">Project</SheetTitle>
                    </SheetHeader>
                    {SidebarContent}
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center sm:p-8">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No conversation selected</p>
                <p className="text-sm text-muted-foreground">Create a new conversation to get started.</p>
                {availableAssistants.length === 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/assistants">Activate an assistant</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel */}
        <aside className="hidden w-64 shrink-0 border-l border-border bg-card p-4 lg:block">
          {currentAssistant && (
            <Card className="border border-border">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <AssistantIcon className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-base">{currentAssistant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentAssistant.description}</p>
                {currentAssistant.category && (
                  <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Category: {currentAssistant.category}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
