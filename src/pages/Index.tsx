import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prebuiltAssistants, subscriptionPlans, creditPacks } from "@/data/mock-data";
import {
  ArrowRight, BookOpen, Code, Building2, Lightbulb, Bug,
  GraduationCap, CreditCard, Smartphone, Landmark, MessageCircle,
  Check, Sparkles, Users, FolderOpen, Bookmark, Cpu, Layers,
  PenTool, FileText, ClipboardList, Palette,
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

const educationSuite = [
  { icon: Cpu, title: "EduAssess Pro", desc: "AI-powered tools to create and manage assessments." },
  { icon: PenTool, title: "StudyByte Pro", desc: "Get AI-powered bite-sized study content for quick learning." },
  { icon: GraduationCap, title: "EduPlanner Pro", desc: "AI makes lesson planning simple and effective." },
  { icon: ClipboardList, title: "EduPaper Pro", desc: "AI-powered tools to create and manage papers." },
  { icon: Palette, title: "EduActivity Pro", desc: "Interactive activities and puzzles for learning." },
  { icon: FileText, title: "24x7 Tutor Pro", desc: "AI-powered tutoring for 24x7 doubt-solving and effective learning." },
];

const smartSolutions = [
  { icon: Layers, title: "Your AI Journey", desc: "Explore AI tools tailored for your workflow.", color: "text-primary" },
  { icon: Cpu, title: "Get Started Now", desc: "Jump into AI-powered learning and building.", color: "text-secondary" },
  { icon: BookOpen, title: "Power User Tools", desc: "Advanced tools for creators and educators.", color: "text-primary" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero — matching coachproai.com warm gradient with geometric patterns */}
      <section className="hero-bg hero-pattern relative overflow-hidden py-24 md:py-36">
        <div className="container relative z-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="font-heading text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
              CoachProAi
            </h1>
            <h2 className="font-heading text-2xl font-semibold text-foreground/80 md:text-3xl">
              Where Ideas Become Tools
            </h2>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Simple, fast, powerful AI tools for learning, teaching, and creating.
            </p>
            <div className="pt-4">
              <Button size="lg" asChild className="rounded-full bg-primary px-8 py-6 text-base font-semibold text-primary-foreground shadow-lg hover:bg-brand-orange-hover hover:shadow-xl transition-all">
                <Link to="/signup">
                  Explore More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Endless Possibilities — Purple gradient section */}
      <section className="section-purple-gradient py-16 text-white">
        <div className="container">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Endless <span className="italic">Possibilities</span>
            </h2>
            <p className="mt-3 text-white/80">
              Dive in and let AI transform the way you learn, teach, and create.
            </p>
          </div>
        </div>
      </section>

      {/* Prompt & Image Generation Tools */}
      <section className="py-16 md:py-20">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold">
            Prompt & <span className="text-secondary italic">Image Generation</span> Tools
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            We turn text, style, and simple ideas into beautiful visuals.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["AI Image FX", "Prompt Studio", "Quick Image Tools"].map((tool) => (
              <Button key={tool} variant="outline" className="rounded-full border-primary/30 px-6 text-foreground hover:bg-primary/5">
                {tool}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Connecting Teachers Section */}
      <section className="section-purple-gradient py-16 text-white">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            AI <span className="italic underline decoration-white/40">Connecting Teachers</span>
          </h2>
          <h3 className="mt-2 font-heading text-xl font-semibold">
            with Smarter Tools
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            CoachPro bridges the gap between education and innovation by equipping educators with AI tools that simplify teaching and amplify learning.
          </p>
        </div>
      </section>

      {/* Featured Education Suite */}
      <section className="section-warm py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Featured Education Suite</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {educationSuite.map((item) => (
              <Card key={item.title} className="border border-border bg-card text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Everything You Need — Features */}
      <section id="features" className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Everything You Need to Learn & Build</h2>
            <p className="mt-3 text-muted-foreground">Powerful tools designed for tech education and system building.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
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

      {/* Smart Solutions */}
      <section className="py-16 md:py-20">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold">
            Here are your <span className="text-secondary italic">Smart Solutions</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {smartSolutions.map((s) => (
              <Button key={s.title} variant="outline" className="rounded-full border-primary/30 px-6 py-5 text-foreground hover:bg-primary/5">
                <s.icon className={`mr-2 h-4 w-4 ${s.color}`} />
                {s.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Built AI Assistants */}
      <section className="section-warm py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Pre-Built AI Assistants</h2>
            <p className="mt-3 text-muted-foreground">Start learning instantly with our ready-made expert assistants.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {prebuiltAssistants.map((a) => {
              const Icon = iconMap[a.icon] || Code;
              return (
                <Card key={a.id} className="border border-border bg-card text-center transition-all hover:shadow-lg hover:-translate-y-1">
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
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Simple, Flexible Pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border bg-card transition-all hover:shadow-lg ${
                  plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
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
                  <Button className="mt-6 w-full rounded-full" variant={plan.popular ? "default" : "outline"} asChild>
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
                <Card key={p.id} className="border border-border bg-card text-center transition-all hover:shadow-md">
                  <CardContent className="pt-6">
                    <p className="font-heading text-lg font-semibold">{p.name}</p>
                    <p className="mt-1 text-3xl font-bold text-primary">{p.credits} Credits</p>
                    <p className="mt-1 text-muted-foreground">Rs {p.price}</p>
                    <Button className="mt-4 w-full rounded-full" variant="outline">Buy Now</Button>
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
                <div key={m.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tomorrow Starts Here CTA */}
      <section className="section-purple-gradient py-20 text-center text-white">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Tomorrow Starts Here</h2>
          <p className="mx-auto mt-4 max-w-lg text-white/80">
            At CoachPro, we believe in a future powered by AI. Whether you are a teacher, a student, or a creator — the power is in your hands. Join us and start building something extraordinary.
          </p>
          <Button size="lg" className="mt-8 rounded-full bg-white px-8 text-foreground hover:bg-white/90 shadow-lg" asChild>
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
