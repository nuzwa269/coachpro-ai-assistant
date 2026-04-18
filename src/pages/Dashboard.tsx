import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Send, Sparkles, Bot, FolderOpen, Plus, Loader2, MessageSquare,
  GraduationCap, Building2, Bug, Lightbulb, Code, ArrowRight, AlertCircle,
  Crown, X,
} from "lucide-react";
import { toast } from "sonner";
import { creditsToMessages, costLabel, DEFAULT_CREDITS_PER_MESSAGE } from "@/lib/credits";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code, Bot,
};

type Assistant = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string | null;
  is_prebuilt: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const SUGGESTED_PROMPTS = [
  "Explain how databases work in simple terms",
  "Help me design a REST API for a todo app",
  "Walk me through deploying a Next.js app",
  "What's the difference between SQL and NoSQL?",
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeAssistantIds, setActiveAssistantIds] = useState<Set<string>>(new Set());
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load projects, assistants, and active assistants in parallel
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [projRes, assistRes, activeRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id,name,description,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("assistants")
          .select("id,name,description,icon,category,is_prebuilt")
          .eq("is_active", true),
        supabase
          .from("user_active_assistants")
          .select("assistant_id")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      if (projRes.error) toast.error(projRes.error.message);
      setProjects((projRes.data as ProjectRow[]) ?? []);
      setAssistants((assistRes.data as Assistant[]) ?? []);
      const activeSet = new Set(
        ((activeRes.data as { assistant_id: string }[]) ?? []).map((a) => a.assistant_id),
      );
      setActiveAssistantIds(activeSet);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Pick a sensible default assistant: first active prebuilt, else first prebuilt, else first owned
  const usableAssistants = useMemo(() => {
    const active = assistants.filter((a) => a.is_prebuilt && activeAssistantIds.has(a.id));
    const ownedCustom = assistants.filter((a) => !a.is_prebuilt);
    const allPrebuilt = assistants.filter((a) => a.is_prebuilt);
    // Order: active prebuilt → custom → other prebuilt
    const seen = new Set<string>();
    return [...active, ...ownedCustom, ...allPrebuilt].filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [assistants, activeAssistantIds]);

  useEffect(() => {
    if (!selectedAssistantId && usableAssistants.length > 0) {
      setSelectedAssistantId(usableAssistants[0].id);
    }
  }, [usableAssistants, selectedAssistantId]);

  const selectedAssistant = assistants.find((a) => a.id === selectedAssistantId);
  const SelectedIcon = selectedAssistant ? iconMap[selectedAssistant.icon] || Bot : Bot;

  const displayName = profile?.name || profile?.email?.split("@")[0] || "there";

  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? input).trim();
    if (!content || !user || sending) return;
    if (!selectedAssistantId) {
      toast.error("No assistant available. Activate one from the Assistants page.");
      return;
    }
    setSending(true);
    try {
      // 1. Auto-activate the assistant if it's a prebuilt and not already active
      const assistant = assistants.find((a) => a.id === selectedAssistantId);
      if (assistant?.is_prebuilt && !activeAssistantIds.has(selectedAssistantId)) {
        await supabase
          .from("user_active_assistants")
          .insert({ user_id: user.id, assistant_id: selectedAssistantId });
        // ignore error (e.g. free-plan limit) — we still try to chat
      }

      // 2. Find or create a project lazily
      let projectId = projects[0]?.id;
      if (!projectId) {
        const { data: newProj, error: pErr } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: "Quick Chat",
            description: "Auto-created from dashboard",
          })
          .select("id,name,description,created_at")
          .single();
        if (pErr) throw pErr;
        projectId = newProj.id;
      }

      // 3. Create a conversation in that project
      const { data: convo, error: cErr } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          project_id: projectId,
          assistant_id: selectedAssistantId,
          title: content.slice(0, 50),
        })
        .select("id")
        .single();
      if (cErr) throw cErr;

      // 4. Insert the user's first message
      const { error: mErr } = await supabase.from("messages").insert({
        conversation_id: convo.id,
        user_id: user.id,
        role: "user",
        content,
      });
      if (mErr) throw mErr;

      // 5. Route into the workspace — it will pick up this convo as the most recent
      navigate(`/project/${projectId}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start chat");
      setSending(false);
    }
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Compact welcome */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              Hi {displayName}, what are you building today?
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Ask anything. Your AI coach is ready.
            </p>
          </div>
        </div>

        {/* Chat box */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          {/* Assistant selector chip */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Coach:</span>
            {loading ? (
              <div className="h-7 w-32 animate-pulse rounded-full bg-muted" />
            ) : usableAssistants.length === 0 ? (
              <Link
                to="/assistants"
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
              >
                <Bot className="h-3 w-3" /> Activate an assistant
              </Link>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {usableAssistants.slice(0, 4).map((a) => {
                  const Icon = iconMap[a.icon] || Bot;
                  const isSelected = a.id === selectedAssistantId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAssistantId(a.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="max-w-[8rem] truncate">{a.name}</span>
                    </button>
                  );
                })}
                {usableAssistants.length > 4 && (
                  <Link
                    to="/assistants"
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    +{usableAssistants.length - 4} more
                  </Link>
                )}
              </div>
            )}
          </div>

          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              selectedAssistant
                ? `Message ${selectedAssistant.name}…`
                : "Ask your AI coach anything…"
            }
            className="min-h-[96px] resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
            disabled={sending || !selectedAssistantId}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {selectedAssistant && (
                <span className="inline-flex items-center gap-1.5">
                  <SelectedIcon className="h-3.5 w-3.5" />
                  {costLabel(DEFAULT_CREDITS_PER_MESSAGE)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">
                  ≈ {creditsToMessages(profile?.credits).toLocaleString()}
                </span>
                <span className="hidden xs:inline">left</span>
              </span>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={sending || !input.trim() || !selectedAssistantId}
              className="h-10 gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                </>
              ) : (
                <>
                  Send <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Low-credits non-blocking banner */}
        {!loading && (profile?.credits ?? 0) <= 5 && (
          <Link
            to="/buy-credits"
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm transition-colors hover:bg-primary/10"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                Running low — only ≈ {creditsToMessages(profile?.credits)} messages left
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Top up credits to keep chatting without interruption.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </Link>
        )}

        {/* Suggested prompts (only for first-time / empty users) */}
        {!loading && projects.length === 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Try asking
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSuggestion(p)}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="line-clamp-2">{p}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent projects (only when user has any) */}
        {!loading && projects.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold text-foreground sm:text-lg">
                Recent projects
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/projects")}
                className="h-8 gap-1 text-xs"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="truncate font-heading text-sm font-semibold text-foreground">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {p.description || "No description"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
