import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles, Bot, MessageSquare, Coins, Zap, Settings, ArrowRight,
  PlayCircle, Wand2, ShieldCheck, HelpCircle,
} from "lucide-react";

const steps = [
  {
    icon: Bot,
    title: "1. Pick an assistant",
    body:
      "Open the Assistants page and browse the prebuilt coaches we've designed for coding, writing, marketing, study and more. Each one is preloaded with an expert persona — no setup, no API keys, no configuration.",
    cta: { label: "Open Assistants", to: "/assistants" },
  },
  {
    icon: PlayCircle,
    title: "2. Activate it",
    body:
      "Tap Activate on any assistant card. Free plans can keep one assistant active at a time; paid plans unlock more. You can switch the active one anytime.",
    cta: { label: "Activate now", to: "/assistants" },
  },
  {
    icon: MessageSquare,
    title: "3. Start chatting",
    body:
      "Go to the Dashboard and your active assistants appear right above the chat box. Pick one, type your question, hit Send. The assistant remembers the whole conversation and responds in seconds.",
    cta: { label: "Go to Dashboard", to: "/dashboard" },
  },
  {
    icon: Sparkles,
    title: "4. Use Conversation Starters",
    body:
      "When an assistant has starter prompts, they appear as clickable chips below the input. Tap any chip to drop a ready-made prompt into the box — perfect for quick exploration.",
  },
  {
    icon: Wand2,
    title: "5. Build your own (optional)",
    body:
      "Want a custom expert? On the Assistants page, choose Create Assistant, give it a name, a short description and a system prompt that describes its personality and skills. Save — it's instantly usable.",
    cta: { label: "Create assistant", to: "/assistants" },
  },
  {
    icon: Coins,
    title: "6. Credits per message",
    body:
      "Each message uses a small amount of credits depending on the AI model behind the assistant. Your remaining credits are always shown in the sidebar and at the bottom of the chat box.",
    cta: { label: "Top up credits", to: "/buy-credits" },
  },
];

const faqs = [
  {
    q: "Do I need to add my own OpenAI or Gemini API key?",
    a: "No. CoachPro AI ships with a built-in AI gateway that connects to multiple top models out of the box. You just sign in and start chatting.",
  },
  {
    q: "Which AI models are available?",
    a: "Modern models from Google Gemini and OpenAI GPT families, including fast lightweight options for quick replies and more powerful reasoning models for harder tasks. Admins can assign a default model to each assistant.",
  },
  {
    q: "Will an assistant remember earlier messages?",
    a: "Yes. Every conversation keeps full context. Very long chats are quietly summarized in the background so the assistant never loses the thread.",
  },
  {
    q: "What happens when I run out of credits?",
    a: "The chat will pause until you top up. You can buy a credit pack or upgrade your plan from the Buy Credits page — your conversations stay safe.",
  },
  {
    q: "Can I edit or delete my custom assistants?",
    a: "Yes. Open the Assistants page, find your custom assistant, and use the Edit or Delete options. Prebuilt assistants are managed by admins.",
  },
  {
    q: "Is my chat data private?",
    a: "Your conversations are stored in your account and only visible to you. Admins can see aggregate usage but cannot read personal chats unless you ask for support.",
  },
];

export default function HelpAssistants() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                How to use AI Assistants
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Everything you need to start chatting with your AI coach in under a minute.
                No API keys, no setup, no friction — just pick an assistant and ask anything.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-1.5">
                  <Link to="/assistants">
                    Browse Assistants <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/dashboard">Open Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick reassurance card */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-start gap-3 p-4 sm:p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Already activated for you</p>
              <p className="mt-1 text-muted-foreground">
                The AI engine is built in and ready. There is nothing to install, connect or
                configure — just sign in and start a conversation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-step */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground sm:text-xl">
            Step-by-step guide
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                    {s.cta && (
                      <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <Link to={s.cta.to}>
                          {s.cta.label} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Power tip */}
        <Card className="border-primary/30">
          <CardContent className="flex items-start gap-3 p-4 sm:p-5">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Pro tip — switch coaches mid-project</p>
              <p className="mt-1 text-muted-foreground">
                Inside any project workspace you can start a new conversation with a different
                assistant. Use a coding coach for the bug, a writing coach for the docs, and a
                marketing coach for the launch — all in one project.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground sm:text-xl">
            Frequently asked questions
          </h2>
          <Card>
            <CardContent className="p-2 sm:p-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Footer CTA */}
        <div className="rounded-2xl border border-border bg-card p-5 text-center sm:p-6">
          <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
            Ready to chat with your AI coach?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the dashboard and send your first message.
          </p>
          <Button asChild className="mt-4 gap-1.5">
            <Link to="/dashboard">
              Start a conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
