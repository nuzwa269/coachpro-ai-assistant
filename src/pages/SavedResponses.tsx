import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { savedResponses, mockConversations } from "@/data/mock-data";
import { BookmarkCheck, Search, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function SavedResponses() {
  const [search, setSearch] = useState("");

  const allSaved = mockConversations.flatMap((c) =>
    c.messages
      .filter((m) => m.isSaved && m.role === "assistant")
      .map((m) => ({ ...m, convoTitle: c.title, projectId: c.projectId }))
  );

  const filtered = allSaved.filter((r) =>
    r.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Saved Responses</h1>
          <p className="mt-1 text-muted-foreground">Your bookmarked AI responses for quick reference.</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved responses..."
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border border-dashed border-border bg-card p-8 text-center">
            <BookmarkCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No saved responses found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <Card key={r.id} className="border border-border bg-card">
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {r.convoTitle}
                    <span className="ml-auto">
                      <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{r.content}</p>
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
