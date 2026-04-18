import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionPlans, creditPacks } from "@/data/mock-data";
import { Check, Smartphone, Landmark, MessageCircle } from "lucide-react";

export default function Pricing() {
  return (
    <AppShell>
      <div className="container max-w-6xl py-8 md:py-12">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Pricing Plans</h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Choose a plan that works for you. Start free, upgrade anytime.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border bg-card transition-shadow hover:shadow-md ${
                plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="font-heading text-4xl font-bold">
                    {plan.price === 0 ? "Free" : `Rs ${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.credits} credits{plan.price > 0 ? "/month" : " on signup"}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/buy-credits">{plan.price === 0 ? "Current Plan" : "Subscribe"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Packs */}
        <div className="mt-16">
          <h2 className="mb-6 text-center font-heading text-2xl font-bold">One-Time Credit Packs</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {creditPacks.map((p) => (
              <Card key={p.id} className="border border-border bg-card text-center">
                <CardContent className="pt-6">
                  <p className="font-heading text-lg font-semibold">{p.name}</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{p.credits} Credits</p>
                  <p className="mt-1 text-muted-foreground">Rs {p.price}</p>
                  <Button className="mt-4 w-full" variant="outline" asChild>
                    <Link to="/buy-credits">Buy Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 mb-8 text-center">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Accepted Payment Methods</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Smartphone, label: "JazzCash" },
              { icon: Smartphone, label: "Easypaisa" },
              { icon: Landmark, label: "Bank Transfer" },
              { icon: MessageCircle, label: "WhatsApp" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm"
              >
                <m.icon className="h-4 w-4 text-muted-foreground" />
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
