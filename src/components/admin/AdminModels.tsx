import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Model = {
  id: string;
  display_name: string;
  provider: string;
  category: "text" | "image" | "reasoning";
  credits_cost: number;
  is_active: boolean;
};

export function AdminModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, Partial<Model>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_models")
      .select("id,display_name,provider,category,credits_cost,is_active")
      .order("credits_cost");
    if (error) toast.error(error.message);
    setModels((data ?? []) as Model[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Model>) => {
    setDirty((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  const save = async (id: string) => {
    const patch = dirty[id];
    if (!patch) return;
    setSavingId(id);
    const { error } = await supabase.from("ai_models").update(patch).eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Model updated");
    setDirty((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Models ({models.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Credits / msg</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => {
                  const cur = { ...m, ...dirty[m.id] };
                  const isDirty = !!dirty[m.id];
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium">{m.display_name}</div>
                        <div className="text-xs text-muted-foreground">{m.id}</div>
                      </TableCell>
                      <TableCell>{m.provider}</TableCell>
                      <TableCell className="capitalize">{m.category}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={cur.credits_cost}
                          onChange={(e) => update(m.id, { credits_cost: parseInt(e.target.value, 10) || 0 })}
                          className="h-8 w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={cur.is_active}
                          onCheckedChange={(v) => update(m.id, { is_active: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" disabled={!isDirty || savingId === m.id} onClick={() => save(m.id)}>
                          {savingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
