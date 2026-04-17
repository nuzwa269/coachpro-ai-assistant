import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Search, Loader2, Trash2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

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
};

export default function SavedResponses() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: saved, error } = await supabase
        .from("saved_responses")
        .select("id, message_id, created_at, project_id, messages!inner(content, created_at, conversation_id, conversations!inner(title, project_id, projects(name)))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) { toast.error(error.message); setLoading(false); return; }
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
      }));
      setItems(rows);
      setLoading(false);
    })();
  }, [user]);

  const filtered = items.filter((m) =>
    m.message_content.toLowerCase().includes(q.toLowerCase()) ||
    (m.project_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    m.conversation_title.toLowerCase().includes(q.toLowerCase())
  );

  const unsave = async (savedId: string) => {
    const { error } = await supabase.from("saved_responses").delete().eq("id", savedId);
    if (error) { toast.error(error.message); return; }
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
          <p className="mt-1 text-sm text-muted-foreground">Your bookmarked AI responses, all in one place.</p>
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

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {items.length === 0 ? "No saved outputs" : "No matches"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {items.length === 0 ? "Bookmark AI responses to find them here later." : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => (
              <div key={m.id} className="group rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Bookmark className="h-3.5 w-3.5 text-primary" />
                    {m.project_name && (
                      <>
                        <span className="font-medium text-foreground">{m.project_name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{m.conversation_title}</span>
                    <span>•</span>
                    <span>{new Date(m.message_created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyText(m.message_content)} aria-label="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {m.project_id && (
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7" aria-label="Open conversation">
                        <Link to={`/project/${m.project_id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => unsave(m.id)} aria-label="Unsave">
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
