import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Copy, Zap, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const creditPacks = [
  { id: "starter", name: "Starter Pack", price: 500, credits: 100, perCredit: 5.0 },
  { id: "popular", name: "Popular Pack", price: 900, credits: 200, perCredit: 4.5, popular: true },
  { id: "mega", name: "Mega Pack", price: 2000, credits: 500, perCredit: 4.0 },
];

const paymentMethods = [
  { name: "JazzCash", value: "03XX-XXXXXXX", note: "Send payment to the JazzCash mobile account above. Use your full name as the reference." },
  { name: "Easypaisa", value: "03XX-XXXXXXX", note: "Send payment to the Easypaisa account above. Include your email in the message." },
  { name: "Bank Transfer", value: "IBAN: PK00XXXX0000000000000000", note: "Bank: HBL | Account Title: CoachProAI | Transfer the exact amount." },
  { name: "WhatsApp", value: "+92 3XX XXXXXXX", note: "Send payment screenshot on WhatsApp. We'll verify and add credits within 24 hours." },
];

export default function BuyCredits() {
  const [selected, setSelected] = useState("popular");
  const [packChoice, setPackChoice] = useState("starter");
  const [method, setMethod] = useState("JazzCash");
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState("");

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      toast({ title: "Reference required", description: "Please enter the transaction reference." });
      return;
    }
    toast({ title: "Payment submitted", description: "We'll verify and add credits shortly." });
    setReference("");
    setScreenshot("");
  };

  return (
    <AppShell>
      <div className="w-full space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Buy Credits</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each AI message costs 1 credit. New accounts start with 50 free credits.
          </p>
        </div>

        {/* Choose a Pack */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Choose a Pack</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creditPacks.map((p) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelected(p.id);
                    setPackChoice(p.id);
                  }}
                  className={`relative rounded-2xl border bg-card p-6 text-left transition-colors ${
                    active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Zap className="h-3 w-3" /> Most Popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="mt-2 font-heading text-3xl font-bold text-foreground">Rs.{p.price.toLocaleString()}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{p.credits}</span>
                    <span className="text-muted-foreground">AI credits</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Rs.{p.perCredit.toFixed(1)} per credit</p>
                  <div
                    className={`mt-4 flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary text-primary-foreground hover:text-white"
                    }`}
                  >
                    {active ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Selected
                      </span>
                    ) : (
                      "Buy Now"
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* How to Pay */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">How to Pay</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {paymentMethods.map((m) => (
              <div key={m.name} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {m.value}
                  </code>
                  <button
                    onClick={() => copy(m.value)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              <div className="space-y-1.5">
                <Label htmlFor="pack">Credit Pack</Label>
                <select
                  id="pack"
                  value={packChoice}
                  onChange={(e) => setPackChoice(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {creditPacks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.credits} credits (Rs.{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ref">Transaction Reference Number</Label>
                <Input
                  id="ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TXN-1234567890"
                />
                <p className="text-xs text-muted-foreground">
                  The reference/confirmation number from your payment app.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ss">Screenshot URL (optional)</Label>
                <Input
                  id="ss"
                  type="url"
                  value={screenshot}
                  onChange={(e) => setScreenshot(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Upload your screenshot to Imgur or Google Drive and paste the link here.
                </p>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                Submit Payment
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
