"use client";

/**
 * app/(brand)/brief/new/page.tsx — AI Brief Builder.
 * Rough idea -> POST /api/brief/generate -> structured form + raw JSON view,
 * then "Find creators" persists via the API (when a brand is configured) and
 * navigates to the matches page. Loading state on every AI call.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, Loader2, ArrowRight, Braces, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StructuredBrief } from "@/lib/types";

const DEMO_IDEA =
  "I need a cinematic 30-second Instagram ad for a premium sneaker brand — moody urban night shots, slow-motion product moments. Full commercial rights for paid media.";

interface GenerateResponse {
  brief: StructuredBrief;
  id: string | null;
  source: "llm" | "fallback";
  error?: string;
}

export default function NewBriefPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [brief, setBrief] = useState<StructuredBrief | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [source, setSource] = useState<"llm" | "fallback" | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(): Promise<void> {
    if (rawInput.trim().length < 10) {
      setError("Describe your idea in at least a few words.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brief/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: rawInput }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setBrief(data.brief);
      setBriefId(data.id);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function findCreators(): Promise<void> {
    // If the brief was persisted, use its DB id; otherwise fall back to demo brief.
    const target = briefId ?? "demo";
    setMatching(true);
    try {
      if (briefId) {
        await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief_id: briefId }),
        }).catch(() => undefined);
      }
    } finally {
      setMatching(false);
      router.push(`/brief/${target}/matches`);
    }
  }

  function updateField<K extends keyof StructuredBrief>(key: K, value: StructuredBrief[K]): void {
    if (!brief) return;
    setBrief({ ...brief, [key]: value });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> PromptFolio
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Brief Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a rough idea. GPT-4o turns it into a structured creative brief you can edit.
          </p>
        </div>

        {/* Step 1: rough idea */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1 · Your rough idea</CardTitle>
            <CardDescription>In plain language — platform, vibe and duration help most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="e.g. I need a cinematic 30-second Instagram ad for a premium sneaker brand…"
              rows={4}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> AI is writing your brief…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Generate structured brief
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRawInput(DEMO_IDEA)}>
                Use demo idea
              </Button>
              {source && (
                <Badge variant={source === "llm" ? "success" : "secondary"}>
                  {source === "llm" ? "GPT-4o" : "Rule-based fallback"}
                </Badge>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Step 2: structured brief */}
        {brief && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">2 · Structured brief</CardTitle>
                <CardDescription>Review & tweak before matching.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowJson((v) => !v)}>
                <Braces className="h-4 w-4" /> {showJson ? "Form view" : "Raw JSON"}
              </Button>
            </CardHeader>
            <CardContent>
              {showJson ? (
                <pre className="max-h-[480px] overflow-auto rounded-lg bg-muted p-4 text-xs">
                  {JSON.stringify(brief, null, 2)}
                </pre>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Campaign objective" value={brief.campaign_objective} onChange={(v) => updateField("campaign_objective", v)} />
                  <Field label="Content type" value={brief.content_type} onChange={(v) => updateField("content_type", v)} />
                  <Field label="Style" value={brief.style} onChange={(v) => updateField("style", v)} />
                  <Field label="Duration" value={brief.duration} onChange={(v) => updateField("duration", v)} />
                  <Field label="Platform" value={brief.platform} onChange={(v) => updateField("platform", v)} />
                  <Field label="Aspect ratio" value={brief.aspect_ratio} onChange={(v) => updateField("aspect_ratio", v)} />
                  <Field label="Target audience" value={brief.target_audience} onChange={(v) => updateField("target_audience", v)} />
                  <Field label="Commercial usage" value={brief.commercial_usage} onChange={(v) => updateField("commercial_usage", v)} />
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visual direction</label>
                    <Textarea rows={2} value={brief.visual_direction} onChange={(e) => updateField("visual_direction", e.target.value)} />
                  </div>
                  <ListField label="Required tools" value={brief.required_tools} onChange={(v) => updateField("required_tools", v)} />
                  <ListField label="Deliverables" value={brief.deliverables} onChange={(v) => updateField("deliverables", v)} />
                  <ListField label="Constraints" value={brief.constraints} onChange={(v) => updateField("constraints", v)} />
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button size="lg" className="gap-2" onClick={findCreators} disabled={matching}>
                  {matching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Scoring creators…
                    </>
                  ) : (
                    <>
                      Find matching creators <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                {!briefId && (
                  <span className="text-xs text-muted-foreground">
                    Demo mode — opens matches for the seeded equivalent brief.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} <span className="normal-case font-normal">(comma separated)</span>
      </label>
      <Input value={value.join(", ")} onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
    </div>
  );
}
