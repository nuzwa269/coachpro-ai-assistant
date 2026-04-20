import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Coins, Crown } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  plan: "free" | "basic" | "pro";
  created_at: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<UserRow | null>(null);
  const [credits, setCredits] = useState("");
  const [plan, setPlan] = useState<"free" | "basic" | "pro">("free");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,name,credits,plan,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setUsers((data ?? []) as UserRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (u: UserRow) => {
    setEdit(u);
    setCredits(String(u.credits));
    setPlan(u.plan);
  };

  const save = async () => {
    if (!edit) return;
    const newCredits = parseInt(credits, 10);
    if (isNaN(newCredits) || newCredits < 0) {
      toast.error("Invalid credit amount");
      return;
    }
    setSaving(true);
    const delta = newCredits - edit.credits;
    const { error } = await supabase
      .from("profiles")
      .update({ credits: newCredits, plan })
      .eq("id", edit.id);

    if (!error && delta !== 0) {
      await supabase.from("credit_transactions").insert({
        user_id: edit.id,
        amount: delta,
        kind: "admin_adjust",
        balance_after: newCredits,
        notes: `Admin adjustment (${delta > 0 ? "+" : ""}${delta})`,
      });
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User updated");
    setEdit(null);
    load();
  };

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(q.toLowerCase()) || (u.name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Users ({users.length})</CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-8" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">{u.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">{u.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.plan === "free" ? "secondary" : "default"}>
                        {u.plan === "pro" && <Crown className="mr-1 h-3 w-3" />}
                        {u.plan}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-primary" />{u.credits}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {edit?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plan</label>
              <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Credits</label>
              <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Difference will be logged as admin adjustment.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
