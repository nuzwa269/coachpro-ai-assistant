import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Search, Loader2, Trash2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SavedRow = {
  id: string;
  message_id: string;
  created_at: string;
  project_id: string | null;
  message_content: string;
  message_created_at: string;
  conversation_id: string;
  conversation_title: string;
  project_name: string | null;
  category: string;
  assistant_name: string | null;
};

const norm = (c: string | null | undefined) => (c && c.trim() ? c.trim() : "General");

export default function SavedResponses() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: saved, error } = await supabase
        .from("saved_responses")
        .select(
          "id, message_id, created_at, project_id, messages!inner(content, created_at, conversation_id, conversations!inner(title, project_id, projects(name), assistants(name, category)))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const rows: SavedRow[] = (saved ?? []).map((s: any) => ({
        id: s.id,
        message_id: s.message_id,
        created_at: s.created_at,
        project_id: s.messages?.conversations?.project_id ?? s.project_id,
        message_content: s.messages?.content ?? "",
        message_created_at: s.messages?.created_at ?? s.created_at,
        conversation_id: s.messages?.conversation_id ?? "",
        conversation_title: s.messages?.conversations?.title ?? "Conversation",
        project_name: s.messages?.conversations?.projects?.name ?? null,
        assistant_name: s.messages?.conversations?.assistants?.name ?? null,
        category: norm(s.messages?.conversations?.assistants?.category),
      }));
      setItems(rows);
      setLoading(false);
    })();
  }, [user]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filtered = items.filter((m) => {
    const matchesCat = activeCategory === "All" || m.category === activeCategory;
    const ql = q.toLowerCase();
    const matchesQ =
      !ql ||
      m.message_content.toLowerCase().includes(ql) ||
      (m.project_name ?? "").toLowerCase().includes(ql) ||
      (m.assistant_name ?? "").toLowerCase().includes(ql) ||
      m.conversation_title.toLowerCase().includes(ql);
    return matchesCat && matchesQ;
  });

  const unsave = async (savedId: string) => {
    const { error } = await supabase.from("saved_responses").delete().eq("id", savedId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== savedId));
    toast.success("Removed from saved");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <AppShell>
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Saved Outputs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your bookmarked AI responses. Tap "Save" under any AI reply in a conversation to add it here.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search saved responses..."
            className="pl-10"
          />
        </div>

        {/* Category chips */}
        <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1">
          {categories.map((cat) => {
            const count = cat === "All" ? items.length : items.filter((i) => i.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {items.length === 0 ? "No saved outputs yet" : "No matches"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {items.length === 0
                ? "Open any conversation and tap the Save button under an AI reply to bookmark it."
                : "Try a different search or category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Bookmark className="h-3.5 w-3.5 text-primary" />
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {m.category}
                    </span>
                    {m.project_name && (
                      <>
                        <span className="font-medium text-foreground">{m.project_name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="truncate">{m.conversation_title}</span>
                    <span>•</span>
                    <span>{new Date(m.message_created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => copyText(m.message_content)}
                      aria-label="Copy"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {m.project_id && (
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7" aria-label="Open conversation">
                        <Link to={`/project/${m.project_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => unsave(m.id)}
                      aria-label="Unsave"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{m.message_content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
