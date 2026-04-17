import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  price_pkr: number;
  monthly_credits: number;
  max_projects: number | null;
  max_custom_assistants: number | null;
  max_saved_responses: number | null;
  is_active: boolean;
  is_popular: boolean;
};

type Pack = {
  id: string;
  name: string;
  price_pkr: number;
  credits: number;
  is_active: boolean;
  is_popular: boolean;
};

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyPlan, setDirtyPlan] = useState<Record<string, Partial<Plan>>>({});
  const [dirtyPack, setDirtyPack] = useState<Record<string, Partial<Pack>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: pl }, { data: pk }] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("sort_order"),
      supabase.from("credit_packs").select("*").order("sort_order"),
    ]);
    setPlans((pl ?? []) as Plan[]);
    setPacks((pk ?? []) as Pack[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePlan = async (id: string) => {
    const patch = dirtyPlan[id];
    if (!patch) return;
    setSaving(id);
    const { error } = await supabase.from("subscription_plans").update(patch).eq("id", id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Plan updated");
    setDirtyPlan((d) => { const { [id]: _, ...r } = d; return r; });
    load();
  };

  const savePack = async (id: string) => {
    const patch = dirtyPack[id];
    if (!patch) return;
    setSaving(id);
    const { error } = await supabase.from("credit_packs").update(patch).eq("id", id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Pack updated");
    setDirtyPack((d) => { const { [id]: _, ...r } = d; return r; });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="plans" className="space-y-4">
      <div className="-mx-2 overflow-x-auto px-2">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="packs">Credit Packs ({packs.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="plans">
        <Card>
          <CardHeader><CardTitle>Subscription Plans</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (PKR)</TableHead>
                    <TableHead>Credits/mo</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => {
                    const cur = { ...p, ...dirtyPlan[p.id] };
                    const isDirty = !!dirtyPlan[p.id];
                    const upd = (patch: Partial<Plan>) => setDirtyPlan((d) => ({ ...d, [p.id]: { ...d[p.id], ...patch } }));
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Input type="number" value={cur.price_pkr} onChange={(e) => upd({ price_pkr: parseInt(e.target.value, 10) || 0 })} className="h-8 w-24" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={cur.monthly_credits} onChange={(e) => upd({ monthly_credits: parseInt(e.target.value, 10) || 0 })} className="h-8 w-24" />
                        </TableCell>
                        <TableCell><Switch checked={cur.is_active} onCheckedChange={(v) => upd({ is_active: v })} /></TableCell>
                        <TableCell><Switch checked={cur.is_popular} onCheckedChange={(v) => upd({ is_popular: v })} /></TableCell>
                        <TableCell>
                          <Button size="sm" disabled={!isDirty || saving === p.id} onClick={() => savePlan(p.id)}>
                            {saving === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="packs">
        <Card>
          <CardHeader><CardTitle>Credit Packs</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (PKR)</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((p) => {
                    const cur = { ...p, ...dirtyPack[p.id] };
                    const isDirty = !!dirtyPack[p.id];
                    const upd = (patch: Partial<Pack>) => setDirtyPack((d) => ({ ...d, [p.id]: { ...d[p.id], ...patch } }));
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Input type="number" value={cur.price_pkr} onChange={(e) => upd({ price_pkr: parseInt(e.target.value, 10) || 0 })} className="h-8 w-24" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={cur.credits} onChange={(e) => upd({ credits: parseInt(e.target.value, 10) || 0 })} className="h-8 w-24" />
                        </TableCell>
                        <TableCell><Switch checked={cur.is_active} onCheckedChange={(v) => upd({ is_active: v })} /></TableCell>
                        <TableCell><Switch checked={cur.is_popular} onCheckedChange={(v) => upd({ is_popular: v })} /></TableCell>
                        <TableCell>
                          <Button size="sm" disabled={!isDirty || saving === p.id} onClick={() => savePack(p.id)}>
                            {saving === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
