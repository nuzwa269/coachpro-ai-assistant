import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prebuiltAssistants, subscriptionPlans, creditPacks } from "@/data/mock-data";
import {
  Zap, ArrowRight, BookOpen, Code, Building2, Lightbulb, Bug,
  GraduationCap, CreditCard, Smartphone, Landmark, MessageCircle,
  Check, Sparkles, Users, FolderOpen, Bookmark
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, Building2, Bug, Lightbulb, Code,
};

const features = [
  { icon: Sparkles, title: "AI-Powered Learning", desc: "Learn any tech topic with personalized AI tutors that adapt to your pace." },
  { icon: FolderOpen, title: "Project-Based", desc: "Organize your learning into projects. Each project gets its own AI workspace." },
  { icon: Users, title: "Custom Assistants", desc: "Create your own AI assistants with custom system prompts for specific tasks." },
  { icon: Bookmark, title: "Save & Review", desc: "Bookmark important AI responses and review them anytime." },
  { icon: CreditCard, title: "Flexible Credits", desc: "Pay as you go or subscribe. Use JazzCash, Easypaisa, or bank transfer." },
  { icon: BookOpen, title: "Build Systems", desc: "Go beyond learning. Build real software systems with AI guidance." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-purple-gradient opacity-5" />
        <div className="container relative text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary" />
              AI Platform for Tech Education
            </div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-6xl">
              Learn Tech. Build Systems.{" "}
              <span className="text-primary">With AI.</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              CoachPro AI helps you learn programming, design architectures, and build
              real software systems with intelligent AI assistants.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="gap-2">
                <Link to="/signup">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">20 free credits on signup. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Everything You Need to Learn & Build</h2>
            <p className="mt-3 text-muted-foreground">Powerful tools designed for tech education and system building.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border border-border bg-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Assistants Preview */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Pre-Built AI Assistants</h2>
            <p className="mt-3 text-muted-foreground">Start learning instantly with our ready-made expert assistants.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {prebuiltAssistants.map((a) => {
              const Icon = iconMap[a.icon] || Code;
              return (
                <Card key={a.id} className="border border-border bg-card text-center transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
                      <Icon className="h-7 w-7 text-secondary" />
                    </div>
                    <CardTitle className="text-lg">{a.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Simple, Flexible Pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
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
                  <p className="text-sm text-muted-foreground">{plan.credits} credits{plan.price > 0 ? "/month" : " on signup"}</p>
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
                  <Button className="mt-6 w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/signup">{plan.price === 0 ? "Start Free" : "Subscribe"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Credit Packs */}
          <div className="mt-16">
            <h3 className="mb-6 text-center font-heading text-2xl font-bold">Or Buy Credit Packs</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {creditPacks.map((p) => (
                <Card key={p.id} className="border border-border bg-card text-center">
                  <CardContent className="pt-6">
                    <p className="font-heading text-lg font-semibold">{p.name}</p>
                    <p className="mt-1 text-3xl font-bold text-primary">{p.credits} Credits</p>
                    <p className="mt-1 text-muted-foreground">Rs {p.price}</p>
                    <Button className="mt-4 w-full" variant="outline">Buy Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm font-medium text-muted-foreground">Payment Methods</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: Smartphone, label: "JazzCash" },
                { icon: Smartphone, label: "Easypaisa" },
                { icon: Landmark, label: "Bank Transfer" },
                { icon: MessageCircle, label: "WhatsApp" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-purple-gradient py-20 text-center text-white">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold">Ready to Start Learning?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Join CoachPro AI today and start building your tech skills with the power of AI.
          </p>
          <Button size="lg" className="mt-8 bg-white text-foreground hover:bg-white/90" asChild>
            <Link to="/signup">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
