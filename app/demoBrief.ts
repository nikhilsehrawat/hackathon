/**
 * app/demoBrief.ts — Offline demo data for the hackathon walkthrough.
 * When Supabase is unavailable (or a route param isn't a UUID), pages fall
 * back to these seeded objects so the 3-minute demo never dead-ends.
 */
import type { Brief, CreatorMatch, ExplanationPayload } from "@/lib/types";
import { SEED_BRIEFS, SEED_CREATORS, deterministicId } from "@/scripts/seedData";

export { SEED_BRIEFS, SEED_CREATORS, deterministicId };

const DEMO_BRAND_ID = deterministicId("user-brand", 0);

export const DEMO_SLUGS: Record<string, number> = {
  demo: 0, // Volt Sneakers — cinematic sneaker ad (main demo scenario)
  "demo-ugc": 1, // GlowLab — UGC TikTok
  "demo-ev": 2, // Aurora Motors — EV launch film
  "demo-furniture": 3, // Casa Verde — image set
  "demo-anime": 4, // Hexa Games — anime reveal
};

export function getDemoBriefByParam(param: string): Brief | null {
  const idx = DEMO_SLUGS[param];
  if (idx === undefined) return null;
  const bf = SEED_BRIEFS[idx];
  const { company: _company, ...fields } = bf;
  return { id: deterministicId("brief", idx), brand_id: DEMO_BRAND_ID, status: "ready", ...fields };
}

export function getAllDemoBriefs(): Brief[] {
  return SEED_BRIEFS.map((bf, idx) => {
    const { company, ...fields } = bf;
    return {
      id: deterministicId("brief", idx),
      brand_id: DEMO_BRAND_ID,
      status: "ready" as const,
      company,
      ...fields,
    } as Brief & { company: string };
  });
}

/* ---------------- Demo matches (deterministic, no DB needed) ---------------- */

/** Score a demo creator against a demo brief with lightweight rules. */
function demoScore(brief: Brief, creatorIndex: number): number {
  const c = SEED_CREATORS[creatorIndex];
  const text = JSON.stringify(c).toLowerCase();
  let s = 0.35;
  for (const tool of brief.required_tools) {
    if (text.includes(tool.toLowerCase().split(" ")[0])) s += 0.14;
  }
  if (text.includes(brief.content_type.toLowerCase())) s += 0.12;
  const styleWords = brief.style.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
  const hits = styleWords.filter((w) => text.includes(w)).length;
  s += Math.min(hits / Math.max(styleWords.length, 1), 1) * 0.2;
  return Math.min(s, 0.98);
}

export function buildDemoMatches(brief: Brief): CreatorMatch[] {
  const matches: CreatorMatch[] = SEED_CREATORS.map((_c, i) => {
    const total = demoScore(brief, i);
    const creator = SEED_CREATORS[i];
    const matchedTools = brief.required_tools.filter((t) =>
      creator.tools.some((ct) => ct[0].toLowerCase().includes(t.toLowerCase().split(" ")[0])),
    );
    const explanation: ExplanationPayload = {
      bullets: [
        creator.specializations.length > 0
          ? `Creator specializes in ${creator.specializations.slice(0, 2).join(" and ")}.`
          : `Experienced AI creator (${creator.years_experience} yrs).`,
        matchedTools.length > 0
          ? `Uses ${matchedTools.join(", ")} — exactly what this brief requires.`
          : `Toolchain: ${creator.tools.slice(0, 3).map((t) => t[0]).join(", ")}.`,
        `Portfolio includes “${creator.portfolios[0]?.title ?? "client work"}” (${
          creator.portfolios[0]?.aspect_ratio ?? "9:16"
        }) with ${Math.round(total * 100)}% style similarity to “${brief.style}”.`,
        `Has ${creator.portfolios[0]?.commercial_use?.toLowerCase() ?? "commercial rights"} experience.`,
        creator.signals.length >= 3
          ? `Verified AI Creator: ${creator.signals.length} evidence-backed signals declared.`
          : "Self-declared profile — verification signals pending.",
      ],
      matched_skills: [],
      matched_tools: matchedTools,
      matched_specializations: creator.specializations.slice(0, 2),
      top_portfolio_title: creator.portfolios[0]?.title ?? null,
      similarity_pct: Math.round(total * 100),
    };
    return {
      id: deterministicId(`demo-match-${brief.id}`, i),
      brief_id: brief.id,
      creator_id: deterministicId("user-creator", i),
      total_score: total,
      skill_score: Math.min(total + 0.02, 1),
      tool_score: matchedTools.length / Math.max(brief.required_tools.length, 1),
      specialization_score: total,
      content_type_score: JSON.stringify(creator.portfolios).toLowerCase().includes(
        brief.content_type.toLowerCase(),
      )
        ? 1
        : 0.5,
      style_score: total,
      rights_score: 1,
      portfolio_score: total,
      explanation,
    };
  });
  return matches.sort((a, b) => Number(b.total_score) - Number(a.total_score));
}

export function demoCreatorMeta(index: number) {
  const c = SEED_CREATORS[index];
  return {
    id: deterministicId("user-creator", index),
    display_name: c.display_name,
    bio: c.bio,
    location: c.location,
    hourly_rate: c.hourly_rate,
    availability: c.availability,
    tools: c.tools.map(([t]) => t),
    verified_badge: c.signals.length >= 3,
  };
}
