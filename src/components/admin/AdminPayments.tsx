import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type PaymentRow = {
  id: string;
  user_id: string;
  kind: "subscription" | "credit_pack";
  method: string;
  amount_pkr: number;
  reference_no: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  proof_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  pack_id: string | null;
  plan_id: string | null;
  user_email?: string;
  pack_name?: string;
  plan_name?: string;
};

export function AdminPayments() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentRow | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as PaymentRow[];
    const userIds = [...new Set(list.map((r) => r.user_id))];
    const packIds = [...new Set(list.map((r) => r.pack_id).filter(Boolean) as string[])];
    const planIds = [...new Set(list.map((r) => r.plan_id).filter(Boolean) as string[])];

    const [{ data: profs }, { data: packs }, { data: plans }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; email: string }[] }),
      packIds.length
        ? supabase.from("credit_packs").select("id,name").in("id", packIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      planIds.length
        ? supabase.from("subscription_plans").select("id,name").in("id", planIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

    const pMap = new Map((profs ?? []).map((p) => [p.id, p.email]));
    const packMap = new Map((packs ?? []).map((p) => [p.id, p.name]));
    const planMap = new Map((plans ?? []).map((p) => [p.id, p.name]));

    setRows(
      list.map((r) => ({
        ...r,
        user_email: pMap.get(r.user_id),
        pack_name: r.pack_id ? packMap.get(r.pack_id) : undefined,
        plan_name: r.plan_id ? planMap.get(r.plan_id) : undefined,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const viewProof = async (path: string) => {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (error) {
      toast.error("Could not load proof");
      return;
    }
    setProofUrl(data.signedUrl);
  };

  const approve = async (id: string) => {
    setActing(id);
    const { error } = await supabase.rpc("approve_payment", { _payment_id: id });
    setActing(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment approved & credits granted");
    load();
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    const { error } = await supabase
      .from("payment_requests")
      .update({
        status: "rejected",
        admin_notes: rejectNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", rejectTarget.id);
    setActing(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment rejected");
    setRejectTarget(null);
    setRejectNotes("");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className="-mx-2 overflow-x-auto px-2">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No {tab} payments.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{r.user_email ?? r.user_id.slice(0, 8)}</span>
                          <Badge variant="outline">{r.kind === "subscription" ? "Subscription" : "Credit Pack"}</Badge>
                          <Badge variant="secondary">{r.method}</Badge>
                          {r.status === "approved" && <Badge>Approved</Badge>}
                          {r.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {r.kind === "subscription" ? r.plan_name : r.pack_name} · Rs. {r.amount_pkr.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {r.reference_no || "—"} · From: {r.sender_name || "—"} ({r.sender_phone || "—"})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {format(new Date(r.created_at), "PPp")}
                        </p>
                        {r.notes && <p className="text-xs italic text-muted-foreground">User note: {r.notes}</p>}
                        {r.admin_notes && <p className="text-xs italic text-destructive">Admin: {r.admin_notes}</p>}
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        {r.proof_url && (
                          <Button size="sm" variant="outline" onClick={() => viewProof(r.proof_url!)}>
                            <Eye className="mr-1 h-4 w-4" /> Proof
                          </Button>
                        )}
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approve(r.id)}
                              disabled={acting === r.id}
                            >
                              {acting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectTarget(r)}
                              disabled={acting === r.id}
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={!!proofUrl} onOpenChange={(o) => !o && setProofUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <img src={proofUrl} alt="Payment proof" className="max-h-[70vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (visible to user)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={acting === rejectTarget?.id}>
              {acting === rejectTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
