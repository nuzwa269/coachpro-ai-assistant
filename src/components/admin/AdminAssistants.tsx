import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Assistant = {
  id: string;
  name: string;
  category: string | null;
  is_prebuilt: boolean;
  is_active: boolean;
  owner_id: string | null;
};

export function AdminAssistants() {
  const [items, setItems] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assistants")
      .select("id,name,category,is_prebuilt,is_active,owner_id")
      .order("is_prebuilt", { ascending: false })
      .order("name");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Assistant[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("assistants").update({ is_active }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(is_active ? "Activated" : "Deactivated");
    setItems((arr) => arr.map((a) => (a.id === id ? { ...a, is_active } : a)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistants ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.is_prebuilt ? "default" : "secondary"}>
                        {a.is_prebuilt ? "Prebuilt" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={a.is_active} onCheckedChange={(v) => toggle(a.id, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
