import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Bot,
  BrainCircuit,
  Bug,
  Building2,
  CheckCircle2,
  Code,
  Coins,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatarMenu } from "@/components/layout/UserAvatarMenu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { creditsToMessages } from "@/lib/credits";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Building2,
  Bug,
  Lightbulb,
  Code,
  Bot,
};

type AssistantRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string | null;
  is_prebuilt: boolean;
  conversation_starters: string[] | null;
};

const fallbackAssistants: AssistantRow[] = [
  {
    id: "code-tutor",
    name: "Code Tutor",
    description: "Learn programming concepts with clear explanations and practical examples.",
    icon: "GraduationCap",
    category: "Education",
    is_prebuilt: true,
    conversation_starters: ["Explain a concept", "Walk through code", "Practice with examples"],
  },
  {
    id: "system-architect",
    name: "System Architect",
    description: "Design scalable software architectures while understanding tradeoffs and patterns.",
    icon: "Building2",
    category: "Architecture",
    is_prebuilt: true,
    conversation_starters: ["Plan an app", "Review architecture", "Compare tradeoffs"],
  },
  {
    id: "debug-helper",
    name: "Debug Helper",
    description: "Identify, isolate, and fix bugs with step-by-step debugging guidance.",
    icon: "Bug",
    category: "Development",
    is_prebuilt: true,
    conversation_starters: ["Diagnose an error", "Create hypotheses", "Fix step by step"],
  },
  {
    id: "tech-explainer",
    name: "Tech Explainer",
    description: "Understand complex technology topics in simple, accessible language.",
    icon: "Lightbulb",
    category: "Education",
    is_prebuilt: true,
    conversation_starters: ["Simplify jargon", "Use analogies", "Compare options"],
  },
];

const platformFeatures = [
  {
    title: "Guided AI conversations",
    description: "Start with a focused prompt and CoachPro AI creates a project conversation with the right assistant.",
    icon: MessageSquare,
  },
  {
    title: "Project workspaces",
    description: "Keep chats, context, and follow-up work organized by project instead of losing answers in one long thread.",
    icon: FolderKanban,
  },
  {
    title: "Saved outputs",
    description: "Bookmark the best AI responses so important code snippets, explanations, and plans stay easy to find.",
    icon: Bookmark,
  },
  {
    title: "Credit-aware AI usage",
    description: "See your balance, estimated messages, plans, and top-ups before you run out of AI credits.",
    icon: Coins,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Choose your coach",
    description: "Activate a prebuilt assistant or create a custom coach for a specialized workflow.",
  },
  {
    step: "02",
    title: "Ask a clear question",
    description: "Describe the goal, paste relevant context, or choose a starter prompt to begin faster.",
  },
  {
    step: "03",
    title: "Work inside projects",
    description: "CoachPro AI creates or reuses a project, stores the conversation, and keeps useful context together.",
  },
  {
    step: "04",
    title: "Save and continue",
    description: "Save the strongest responses, start fresh chats when work grows large, and switch assistants as your project evolves.",
  },
];

const usageTips = [
  "No API keys or setup are required — the AI engine is already connected after sign-in.",
  "Use Code Tutor for learning, Debug Helper for errors, System Architect for planning, and Tech Explainer for simple explanations.",
  "Free users can keep one prebuilt assistant active at a time and can switch by deactivating the current one.",
  "Open a fresh conversation when a thread becomes very large; the platform keeps your project history available.",
];

function assistantOutcome(assistant: AssistantRow) {
  const name = assistant.name.toLowerCase();
  if (name.includes("code")) return "A clearer understanding, example code, and next exercises or implementation steps.";
  if (name.includes("architect")) return "A structured design direction with tradeoffs, patterns, and scalability considerations.";
  if (name.includes("debug")) return "A practical debugging path with likely causes, checks, and fixes to try.";
  if (name.includes("explain")) return "A plain-language explanation with analogies, definitions, and confident next steps.";
  return "A focused response tailored to the assistant instructions and your project context.";
}

function assistantUseCase(assistant: AssistantRow) {
  const name = assistant.name.toLowerCase();
  if (name.includes("code")) return "Use it when you want to learn a concept, review code, or build programming confidence.";
  if (name.includes("architect")) return "Use it before building, refactoring, or choosing between architecture options.";
  if (name.includes("debug")) return "Use it when an error, failing behavior, or confusing bug blocks your progress.";
  if (name.includes("explain")) return "Use it when a technical topic feels complex and you need a simple mental model.";
  return assistant.is_prebuilt
    ? "Use it when its specialty matches the outcome you want from your next conversation."
    : "Use it for your custom workflow, saved tone, or specialized project instructions.";
}

export default function Onboarding() {
  const { profile } = useAuth();
  const [assistants, setAssistants] = useState<AssistantRow[]>(fallbackAssistants);
  const messagesLeft = creditsToMessages(profile?.credits ?? 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("assistants")
        .select("id,name,description,icon,category,is_prebuilt,conversation_starters")
        .eq("is_active", true)
        .order("is_prebuilt", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!cancelled && !error && data?.length) {
        setAssistants(data as AssistantRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prebuiltCount = useMemo(() => assistants.filter((a) => a.is_prebuilt).length, [assistants]);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/welcome" className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="CoachPro AI" className="h-9 w-auto" />
            <span className="hidden font-heading text-sm font-semibold tracking-tight text-foreground sm:inline">
              AI Assistant Platform
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#ai-tools" className="transition-colors hover:text-foreground">AI tools</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link to="/assistants">Explore Assistants</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/dashboard">
                Launch Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>
      </header>

      <main>
        <section className="hero-bg hero-pattern relative">
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge className="mb-5 w-fit gap-1.5 rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                <Sparkles className="h-3.5 w-3.5" /> Welcome to your AI workspace
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                CoachPro AI
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                A guided AI assistant platform for learning, building, debugging, planning,
                and saving high-value answers inside organized project workspaces.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 gap-2 px-6 text-base">
                  <Link to="/dashboard">
                    Launch Dashboard <Rocket className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 gap-2 px-6 text-base">
                  <Link to="/help/assistants">
                    Read AI Guide <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center sm:text-left">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <p className="font-heading text-2xl font-bold text-foreground">{prebuiltCount}+</p>
                  <p className="mt-1 text-xs text-muted-foreground">AI assistants</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <p className="font-heading text-2xl font-bold text-foreground">≈ {messagesLeft.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">messages left</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <p className="font-heading text-2xl font-bold capitalize text-foreground">{profile?.plan ?? "Free"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">current plan</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
              <div className="absolute -bottom-8 left-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative w-full max-w-lg rounded-[2rem] border border-border bg-card/90 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
                <div className="rounded-[1.5rem] border border-border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Today’s flow</p>
                      <h2 className="font-heading text-xl font-bold text-foreground">From question to saved outcome</h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {howItWorks.slice(0, 3).map((item) => (
                      <div key={item.step} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-xs font-bold text-secondary">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="mt-4 w-full gap-2">
                    <Link to="/dashboard">
                      Open workspace <LayoutDashboard className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-warm px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-3">Platform features</Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything after sign-in is built around faster, clearer AI work.
              </h2>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                The onboarding experience turns the existing app guide into a practical path:
                choose a coach, ask well, organize the response, and keep the best outputs.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="border-border/80 bg-card/90 shadow-sm transition-transform hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <Badge variant="outline" className="mb-3">How to use this platform</Badge>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  A simple workflow for every AI session.
                </h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  CoachPro AI is ready immediately after authentication. Start with a coach,
                  provide context, use the response inside a project, and save anything you want to reuse.
                </p>
                <div className="mt-6 space-y-3">
                  {usageTips.map((tip) => (
                    <div key={tip} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {howItWorks.map((item) => (
                  <Card key={item.step} className="overflow-hidden border-border bg-card">
                    <CardContent className="p-6">
                      <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-sm font-bold text-secondary">
                        {item.step}
                      </span>
                      <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ai-tools" className="bg-muted/40 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <Badge variant="outline" className="mb-3">AI tools overview</Badge>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Meet the assistants and AI-powered tools available now.
                </h2>
                <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                  Each assistant has a different role. Pick the one that matches your task, then launch the dashboard to begin.
                </p>
              </div>
              <Button asChild variant="outline" className="w-fit gap-2">
                <Link to="/assistants">
                  Manage assistants <WandSparkles className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {assistants.map((assistant) => {
                const Icon = iconMap[assistant.icon] || Bot;
                const starters = (assistant.conversation_starters ?? []).filter(Boolean).slice(0, 3);
                return (
                  <Card key={assistant.id} className="border-border bg-card shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading text-xl font-semibold text-foreground">{assistant.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {assistant.category ?? (assistant.is_prebuilt ? "Prebuilt" : "Custom")}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {assistant.description || "A specialized AI assistant for focused project conversations."}
                          </p>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-muted/60 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Use when</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">{assistantUseCase(assistant)}</p>
                            </div>
                            <div className="rounded-2xl bg-muted/60 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Expected outcome</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">{assistantOutcome(assistant)}</p>
                            </div>
                            <div className="rounded-2xl bg-muted/60 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Try asking</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {starters.length > 0 ? starters.join(" · ") : "Describe the goal, context, and the exact output you need."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] section-purple-gradient p-6 text-primary-foreground shadow-2xl shadow-secondary/20 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to work with your AI coach?
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
                  Your authenticated session is active, your profile is protected, and the dashboard is ready when you are.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild size="lg" variant="secondary" className="h-12 gap-2 px-6 text-base">
                  <Link to="/dashboard">
                    Launch Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white">
                  <Link to="/projects">View Projects</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
