import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { mockConversations } from "@/data/mock-data";
import { Bookmark, Search } from "lucide-react";

export default function SavedResponses() {
  const [q, setQ] = useState("");
  const saved = mockConversations
    .flatMap((c) => c.messages.map((m) => ({ ...m, projectTitle: c.title })))
    .filter((m) => m.isSaved && m.content.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
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

        {saved.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">No saved outputs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Bookmark AI responses to find them here later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">{m.projectTitle}</span>
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
