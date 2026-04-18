import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Copy, Zap, Check, Loader2, Upload, Crown, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { creditsToMessages } from "@/lib/credits";

type Pack = { id: string; name: string; credits: number; price_pkr: number; is_popular: boolean };
type Plan = { id: string; name: string; monthly_credits: number; price_pkr: number; is_popular: boolean };
type Method = "jazzcash" | "easypaisa" | "bank_transfer" | "whatsapp";

const paymentMethods: { id: Method; name: string; value: string; note: string }[] = [
  { id: "jazzcash", name: "JazzCash", value: "03XX-XXXXXXX", note: "Send payment to the JazzCash mobile account above. Use your full name as the reference." },
  { id: "easypaisa", name: "Easypaisa", value: "03XX-XXXXXXX", note: "Send payment to the Easypaisa account above. Include your email in the message." },
  { id: "bank_transfer", name: "Bank Transfer", value: "IBAN: PK00XXXX0000000000000000", note: "Bank: HBL | Account Title: CoachProAI | Transfer the exact amount." },
  { id: "whatsapp", name: "WhatsApp", value: "+92 3XX XXXXXXX", note: "Send payment screenshot on WhatsApp. We'll verify and add credits within 24 hours." },
];

type Selection =
  | { kind: "credit_pack"; id: string; name: string; amount: number }
  | { kind: "subscription"; id: string; name: string; amount: number };

export default function BuyCredits() {
  const { user, profile, refreshProfile } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [method, setMethod] = useState<Method>("jazzcash");
  const [reference, setReference] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [packsRes, plansRes] = await Promise.all([
        supabase.from("credit_packs").select("id,name,credits,price_pkr,is_popular,sort_order").eq("is_active", true).order("sort_order"),
        supabase.from("subscription_plans").select("id,name,monthly_credits,price_pkr,is_popular,sort_order").eq("is_active", true).order("sort_order"),
      ]);
      if (packsRes.data) setPacks(packsRes.data as Pack[]);
      if (plansRes.data) setPlans(plansRes.data.filter((p: any) => p.price_pkr > 0) as Plan[]);
      const popularPack = packsRes.data?.find((p: any) => p.is_popular) ?? packsRes.data?.[0];
      if (popularPack) {
        setSelection({ kind: "credit_pack", id: popularPack.id, name: popularPack.name, amount: popularPack.price_pkr });
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (user && !senderName && profile?.name) setSenderName(profile.name);
  }, [user, profile, senderName]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in"); return; }
    if (!selection) { toast.error("Please select a pack or plan"); return; }
    if (!reference.trim()) { toast.error("Transaction reference required"); return; }
    if (!senderName.trim()) { toast.error("Your name is required"); return; }

    setSubmitting(true);
    try {
      let proof_url: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, proofFile, { contentType: proofFile.type, upsert: false });
        if (upErr) throw upErr;
        proof_url = path;
      }

      const payload: any = {
        user_id: user.id,
        kind: selection.kind,
        method,
        amount_pkr: selection.amount,
        reference_no: reference.trim(),
        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim() || null,
        notes: notes.trim() || null,
        proof_url,
        status: "pending",
      };
      if (selection.kind === "credit_pack") payload.pack_id = selection.id;
      else payload.plan_id = selection.id;

      const { error } = await supabase.from("payment_requests").insert(payload);
      if (error) throw error;

      toast.success("Payment submitted", { description: "We'll verify and add credits within 24 hours." });
      setReference(""); setNotes(""); setProofFile(null);
      const fileInput = document.getElementById("proof") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      refreshProfile();
    } catch (err: any) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full space-y-8 p-4 sm:p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Buy Credits & Plans</h1>
          <div className="mt-3 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              ≈ {creditsToMessages(profile?.credits).toLocaleString()} messages left
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              {profile?.credits ?? 0} credits
            </span>
            {profile?.plan && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Crown className="h-3.5 w-3.5" />
                <span className="capitalize">{profile.plan}</span> plan
              </span>
            )}
          </div>
        </div>

        {/* Credit Packs */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Credit Packs (one-time)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((p) => {
              const active = selection?.kind === "credit_pack" && selection.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelection({ kind: "credit_pack", id: p.id, name: p.name, amount: p.price_pkr })}
                  className={`relative rounded-2xl border bg-card p-6 text-left transition-colors ${
                    active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {p.is_popular && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Zap className="h-3 w-3" /> Most Popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="mt-2 font-heading text-3xl font-bold text-foreground">Rs.{p.price_pkr.toLocaleString()}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-semibold">≈ {creditsToMessages(p.credits).toLocaleString()}</span>
                    <span className="text-muted-foreground">messages</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.credits.toLocaleString()} credits · Rs.{(p.price_pkr / p.credits).toFixed(2)} each
                  </p>
                  <div className={`mt-4 flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {active ? <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Selected</span> : "Select"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Subscription Plans */}
        {plans.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Subscription Plans (monthly)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map((p) => {
                const active = selection?.kind === "subscription" && selection.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelection({ kind: "subscription", id: p.id, name: p.name, amount: p.price_pkr })}
                    className={`relative rounded-2xl border bg-card p-6 text-left transition-colors ${
                      active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {p.is_popular && (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        <Crown className="h-3 w-3" /> Recommended
                      </span>
                    )}
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="mt-2 font-heading text-3xl font-bold text-foreground">
                      Rs.{p.price_pkr.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/mo</span>
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-semibold">≈ {creditsToMessages(p.monthly_credits).toLocaleString()}</span>
                      <span className="text-muted-foreground">messages / month</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.monthly_credits.toLocaleString()} credits / month
                    </p>
                    <div className={`mt-4 flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      {active ? <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Selected</span> : "Select"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* How to Pay */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">How to Pay</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {paymentMethods.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{m.value}</code>
                  <button
                    onClick={() => copy(m.value)}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Copy ${m.name}`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{m.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Payment Proof */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Submit Payment Proof</h2>
          <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-4">
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                {selection ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected</p>
                      <p className="mt-1 truncate font-semibold text-foreground">
                        {selection.name} <span className="text-muted-foreground">({selection.kind === "credit_pack" ? "one-time" : "monthly"})</span>
                      </p>
                    </div>
                    <p className="font-heading text-xl font-bold text-foreground">Rs.{selection.amount.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a pack or plan above first.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as Method)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref">Transaction Reference *</Label>
                  <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN-1234567890" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sname">Sender Name *</Label>
                  <Input id="sname" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Full name on payment" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sphone">Sender Phone</Label>
                  <Input id="sphone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proof">Payment Screenshot (optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="cursor-pointer"
                  />
                  {proofFile && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" /> {proofFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Upload a screenshot of your payment confirmation (max 5MB).</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details we should know..." rows={3} />
              </div>

              <Button type="submit" disabled={submitting || !selection} className="h-11 w-full text-base font-semibold">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Payment Request"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                After verification (within 24 hours), credits will be added to your account automatically.
              </p>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
