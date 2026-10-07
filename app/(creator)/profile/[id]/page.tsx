/**
 * app/(creator)/profile/[id]/page.tsx — Full creator capability view.
 * Header + verification badges, skills, tools (with proficiency), portfolio
 * grid with structured metadata (style/tools/rights/workflow). Live Supabase
 * read for UUID ids; deterministic seed fallback for demo ids (0-14 or slug).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wrench,
  Clapperboard,
  Scale,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCreatorProfile, getSupabaseAdmin } from "@/lib/db/client";
import type { CreatorProfile } from "@/lib/types";
import { SEED_CREATORS, deterministicId } from "@/scripts/seedData";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function demoProfileFromSeed(index: number): CreatorProfile | null {
  const c = SEED_CREATORS[index];
  if (!c) return null;
  const cid = deterministicId("user-creator", index);
  return {
    creator: {
      id: cid,
      display_name: c.display_name,
      bio: c.bio,
      location: c.location,
      years_experience: c.years_experience,
      hourly_rate: c.hourly_rate,
      availability: c.availability,
    },
    skills: c.skills.map(([skill, proficiency], k) => ({ id: `${cid}-s${k}`, creator_id: cid, skill, proficiency })),
    tools: c.tools.map(([tool, proficiency, verified], k) => ({ id: `${cid}-t${k}`, creator_id: cid, tool, proficiency, verified })),
    specializations: c.specializations.map((specialization, k) => ({ id: `${cid}-sp${k}`, creator_id: cid, specialization })),
    portfolios: c.portfolios.map((pf, k) => ({
      id: `${cid}-p${k}`,
      creator_id: cid,
      title: pf.title,
      media_url: "#demo",
      media_type: pf.media_type,
      thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(pf.title)}/640/360`,
      description: pf.description,
      metadata: {
        id: `${cid}-pm${k}`,
        portfolio_id: `${cid}-p${k}`,
        content_type: pf.content_type,
        style: pf.style,
        tools: pf.tools,
        industry: pf.industry,
        aspect_ratio: pf.aspect_ratio,
        duration_seconds: pf.duration_seconds,
        commercial_use: pf.commercial_use,
        workflow_notes: pf.workflow_notes,
      },
    })),
    signals: c.signals.map((signal_type, k) => ({
      id: `${cid}-sig${k}`,
      creator_id: cid,
      signal_type,
      evidence_url: `https://verify.promptfolio.demo/${c.email.split("@")[0]}/${signal_type}`,
      verified: true,
    })),
    verified_badge: c.signals.length >= 3,
  };
}

async function loadProfile(id: string): Promise<CreatorProfile | null> {
  if (UUID_RE.test(id)) {
    try {
      return await getCreatorProfile(getSupabaseAdmin(), id);
    } catch (err) {
      console.warn("[profile page] live load failed:", String(err));
    }
  }
  const idx = Number(id);
  if (Number.isInteger(idx) && idx >= 0 && idx < SEED_CREATORS.length) {
    return demoProfileFromSeed(idx);
  }
  // Slug fallback: match display name kebab-case.
  const byName = SEED_CREATORS.findIndex(
    (c) => c.display_name.toLowerCase().replace(/[^a-z]+/g, "-") === id.toLowerCase(),
  );
  return byName >= 0 ? demoProfileFromSeed(byName) : null;
}

const SIGNAL_LABELS: Record<string, { label: string; icon: typeof Wrench }> = {
  tool: { label: "Tool access declared", icon: Wrench },
  workflow: { label: "Workflow documented", icon: Workflow },
  portfolio: { label: "Portfolio evidence", icon: Clapperboard },
  rights: { label: "Commercial rights track record", icon: Scale },
};

export default async function CreatorProfilePage({ params }: { params: { id: string } }) {
  const profile = await loadProfile(params.id);
  if (!profile) notFound();
  const { creator } = profile;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> PromptFolio
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        {/* Profile header */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {creator.display_name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{creator.display_name}</h1>
                {profile.verified_badge && (
                  <Badge variant="verified" className="gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified AI Creator
                  </Badge>
                )}
                <Badge variant={creator.availability === "Available" ? "success" : "secondary"}>
                  {creator.availability}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{creator.bio}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {creator.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {creator.years_experience} yrs experience</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> ${creator.hourly_rate}/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-blue-600" /> Verification signals
            </CardTitle>
            <CardDescription>
              Self-declared + evidence-backed. Not legal or identity verification. Badge unlocks at 3+ signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {profile.signals.map((s) => {
              const meta = SIGNAL_LABELS[s.signal_type] ?? { label: s.signal_type, icon: ShieldCheck };
              const Icon = meta.icon;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {meta.label}
                  </span>
                  {s.verified ? (
                    <a href={s.evidence_url ?? "#"} target="_blank" rel="noreferrer">
                      <Badge variant="success">Evidence ↗</Badge>
                    </a>
                  ) : (
                    <Badge variant="outline">Declared</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          <Card>
            <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {profile.skills.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{s.skill}</span>
                    <span className="text-xs text-muted-foreground">{s.proficiency}/5</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(s.proficiency / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-4 w-4" /> AI tool stack</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {profile.tools.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    {t.tool}
                    {t.verified && <BadgeCheck className="h-4 w-4 text-blue-600" />}
                  </span>
                  <span className="text-xs text-muted-foreground">Proficiency {t.proficiency}/5</span>
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.specializations.map((sp) => (
                  <Badge key={sp.id} variant="secondary">{sp.specialization}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clapperboard className="h-4 w-4" /> Portfolio ({profile.portfolios.length})
            </CardTitle>
            <CardDescription>Structured intelligence per piece — content type, style, tools, rights and workflow.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {profile.portfolios.map((pf) => (
              <div key={pf.id} className="overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pf.thumbnail_url} alt={pf.title} className="aspect-video w-full object-cover" loading="lazy" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{pf.title}</h3>
                    <Badge variant="outline">{pf.media_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pf.description}</p>
                  {pf.metadata && (
                    <>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <Badge variant="secondary">{pf.metadata.content_type}</Badge>
                        <Badge variant="secondary">{pf.metadata.aspect_ratio}</Badge>
                        {pf.metadata.duration_seconds ? <Badge variant="secondary">{pf.metadata.duration_seconds}s</Badge> : null}
                        <Badge variant="secondary">{pf.metadata.industry}</Badge>
                      </div>
                      <p className="text-xs"><span className="font-semibold">Style:</span> {pf.metadata.style}</p>
                      <p className="text-xs"><span className="font-semibold">Tools:</span> {pf.metadata.tools.join(", ")}</p>
                      <p className="text-xs"><span className="font-semibold">Rights:</span> {pf.metadata.commercial_use}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Workflow:</span> {pf.metadata.workflow_notes}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
