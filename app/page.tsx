import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Target,
  ShieldCheck,
  ArrowRight,
  Wand2,
  Users,
  MessageSquareText,
} from "lucide-react";

const STEPS = [
  {
    icon: Wand2,
    title: "Describe your idea",
    text: "A rough sentence — “cinematic 30-second sneaker ad for Instagram” — is all it takes.",
  },
  {
    icon: Sparkles,
    title: "AI builds the brief",
    text: "GPT-4o converts it into a structured creative brief: style, tools, rights, deliverables.",
  },
  {
    icon: Target,
    title: "Hybrid matching engine",
    text: "Weighted scoring across skills, tools, specialization, style embeddings, rights and portfolio fit.",
  },
  {
    icon: MessageSquareText,
    title: "Every match explained",
    text: "Ranked creators arrive with plain-language bullets on exactly why they fit your campaign.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      {/* Nav */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          PromptFolio
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Brand dashboard
            </Button>
          </Link>
          <Link href="/creator/dashboard">
            <Button variant="outline" size="sm">
              Creator hub
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          The trust layer for AI creative work
        </Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Brief-to-verified-creator
          <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            in 60 seconds.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Brands waste weeks finding trustworthy AI creators. PromptFolio turns a rough idea into a
          structured brief, matches it against verified AI creators with a hybrid scoring engine —
          and explains every single match.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/brief/new" className="group">
            <Button size="lg" className="gap-2">
              I&apos;m a brand — start a brief
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/creator/profile/setup">
            <Button size="lg" variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              I&apos;m an AI creator — build my profile
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Fiverr for AI creators — but with a brain. Rights-native · workflow-aware · explainable.
        </p>
      </section>

      {/* How it works */}
      <section className="pb-24">
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">
                  {i + 1}. {s.title}
                </CardTitle>
                <CardDescription>{s.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo shortcut */}
      <section className="pb-24">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Watch the demo flow instantly</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Skip straight to the seeded sneaker-launch brief and its ranked, explainable
                creator matches — no signup required.
              </p>
            </div>
            <Link href="/brief/demo/matches">
              <Button size="lg" className="gap-2">
                See live matches <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        PromptFolio · Hackathon MVP · Self-declared + evidence-backed verification. Not legal or
        identity verification.
      </footer>
    </main>
  );
}
