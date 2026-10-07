/**
 * app/(brand)/brief/[id]/matches/page.tsx — Ranked, explainable creator matches.
 * Server component: tries the live matching engine against Supabase; if the
 * brief id is a demo slug (or the DB is unavailable) it renders deterministic
 * demo matches built from the seed dataset. Client island handles filtering
 * and on-demand LLM explanation refresh.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { MatchResults } from "@/components/MatchResults";
import { getBriefById, getAllCreatorProfiles, getSupabaseAdmin } from "@/lib/db/client";
import { rankCreatorsForBrief } from "@/lib/matching/engine";
import type { Brief, CreatorMatch, CreatorProfile } from "@/lib/types";
import { getDemoBriefByParam, buildDemoMatches, SEED_CREATORS, deterministicId } from "@/app/demoBrief";
import type { SeedCreator } from "@/scripts/seedData";

/** Build a demo CreatorProfile from seed data (no DB required). */
function seedProfile(c: SeedCreator, cid: string): CreatorProfile {
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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageData {
  brief: Brief;
  matches: CreatorMatch[];
  profilesById: Record<string, CreatorProfile>;
  mode: "live" | "demo";
}

async function loadData(id: string): Promise<PageData | null> {
  /* ---- Live path: real UUID + reachable Supabase ---- */
  if (UUID_RE.test(id)) {
    try {
      const supabase = getSupabaseAdmin();
      const brief = await getBriefById(supabase, id);
      const profiles = await getAllCreatorProfiles(supabase);
      const ranked = await rankCreatorsForBrief(brief, profiles);
      const matches: CreatorMatch[] = ranked.map((r, i) => ({
        id: deterministicId(`live-match-${brief.id}`, i),
        brief_id: brief.id,
        creator_id: r.creator_id,
        ...r.scores,
        explanation: r.explanation,
      }));
      const profilesById = Object.fromEntries(profiles.map((p) => [p.creator.id, p]));
      return { brief, matches, profilesById, mode: "live" };
    } catch (err) {
      console.warn("[matches] live path failed, using demo:", String(err));
    }
  }

  /* ---- Demo path: seeded data, no DB required ---- */
  const brief = getDemoBriefByParam(id) ?? getDemoBriefByParam("demo");
  if (!brief) return null;
  const matches = buildDemoMatches(brief);
  const profilesById: Record<string, CreatorProfile> = {};
  SEED_CREATORS.forEach((c, i) => {
    const cid = deterministicId("user-creator", i);
    profilesById[cid] = seedProfile(c, cid);
  });
  return { brief, matches, profilesById, mode: "demo" };
}

export default async function MatchesPage({ params }: { params: { id: string } }) {
  const data = await loadData(params.id);
  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 text-primary" /> PromptFolio
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creator recommendations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="italic">“{data.brief.raw_input}”</span> — scored across skills, tools,
            specialization, content type, style embeddings, rights and portfolio fit.
          </p>
          {data.mode === "demo" && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
              <Loader2 className="h-3 w-3" /> Demo dataset (seeded). Connect Supabase & run
              <code className="mx-1 rounded bg-amber-100 px-1">npm run seed</code> for live matches.
            </p>
          )}
        </div>

        <MatchResults brief={data.brief} matches={data.matches} profilesById={data.profilesById} />
      </main>
    </div>
  );
}
