/**
 * lib/matching/scoring.ts — Individual scoring functions (each returns 0..1).
 * Hybrid: deterministic rules for skills/tools/spec/type/rights + embeddings
 * for style similarity and portfolio intelligence.
 */
import type { Brief, CreatorProfile } from "../types";
import { cosineSimilarity } from "../ai/embeddings";
import { rightsRank } from "./weights";

/* ---------------- Text utilities ---------------- */

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Token-set overlap fuzzy match (Jaccard on content tokens). */
export function fuzzyOverlap(a: string, b: string): number {
  const ta = new Set(normalize(a).split(" ").filter(Boolean));
  const tb = new Set(normalize(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter++;
  });
  const union = ta.size + tb.size - inter;
  return inter / union;
}

/** Loose containment: "Runway Gen-3" matches required tool "Runway". */
export function toolMatches(required: string, held: string): boolean {
  const r = normalize(required);
  const h = normalize(held);
  return h.includes(r) || r.includes(h) || fuzzyOverlap(r, h) >= 0.5;
}

/* ---------------- Component scores ---------------- */

export interface SkillResult {
  score: number;
  matched: string[];
}

/**
 * skill_match: brief implies skills via content_type/style/platform vocabulary.
 * We build the expected-skill set from the brief text, then measure creator
 * coverage weighted by proficiency.
 */
export function deriveBriefSkills(brief: Brief): string[] {
  const text = normalize(
    [brief.content_type, brief.style, brief.visual_direction, brief.raw_input].join(" "),
  );
  const map: Array<[RegExp, string]> = [
    [/video|film|ad|commercial/, "AI video generation"],
    [/prompt/, "Prompt engineering"],
    [/color|grade|cinemat/, "Color grading"],
    [/motion|animation|kinetic/, "Motion design"],
    [/photo|image|still/, "AI image generation"],
    [/ugc|creator|authentic|selfie/, "UGC production"],
    [/voice|narration|audio/, "Voiceover & sound design"],
    [/edit|cut/, "Editing & post-production"],
    [/upscale|restor/, "Upscaling & enhancement"],
    [/product/, "Product visualization"],
    [/fashion|model|lookbook/, "Fashion & virtual modeling"],
    [/story|script|copy/, "Creative storytelling"],
    [/music|song/, "AI music generation"],
    [/character|avatar/, "Character & avatar design"],
  ];
  return map.filter(([re]) => re.test(text)).map(([, skill]) => skill);
}

export function scoreSkills(brief: Brief, profile: CreatorProfile): SkillResult {
  const expected = deriveBriefSkills(brief);
  if (expected.length === 0) return { score: 0.5, matched: [] }; // neutral when underspecified
  const matched = expected.filter((skill) =>
    profile.skills.some((s) => toolMatches(skill, s.skill)),
  );
  // Proficiency-weighted coverage: require at least competent (>=3) creators to shine.
  let weighted = 0;
  for (const skill of matched) {
    const best = Math.max(
      ...profile.skills.filter((s) => toolMatches(skill, s.skill)).map((s) => s.proficiency),
    );
    weighted += Math.min(best / 5, 1);
  }
  return { score: matched.length / expected.length > 0 ? weighted / expected.length : 0, matched };
}

export interface ToolResult {
  score: number;
  matched: string[];
}

export function scoreTools(brief: Brief, profile: CreatorProfile): ToolResult {
  const required = brief.required_tools;
  if (required.length === 0) return { score: 0.5, matched: [] };
  const matched: string[] = [];
  let profSum = 0;
  for (const req of required) {
    const hit = profile.tools.find((t) => toolMatches(req, t.tool));
    if (hit) {
      matched.push(hit.tool);
      profSum += 0.7 + (hit.proficiency / 5) * 0.3 + (hit.verified ? 0.05 : 0);
    }
  }
  return { score: Math.min(profSum / required.length, 1), matched };
}

export interface SpecResult {
  score: number;
  matched: string[];
}

export function scoreSpecialization(brief: Brief, profile: CreatorProfile): SpecResult {
  const want = normalize(
    `${brief.content_type} ${brief.campaign_objective} ${brief.target_audience}`,
  );
  const matched: string[] = [];
  let best = 0;
  for (const spec of profile.specializations) {
    const s = normalize(spec.specialization);
    if (want.includes(s) || s.includes(want)) {
      best = 1;
      matched.push(spec.specialization);
    } else {
      const ov = fuzzyOverlap(want, s);
      if (ov >= 0.25) {
        best = Math.max(best, ov * 1.4); // partial credit, capped below
        matched.push(spec.specialization);
      }
    }
  }
  return { score: Math.min(best, 1), matched };
}

export function scoreContentType(brief: Brief, profile: CreatorProfile): number {
  const want = normalize(brief.content_type);
  const ctTokens = want.split(" ");
  let best = 0;
  for (const p of profile.portfolios) {
    const have = normalize(p.metadata?.content_type ?? "");
    if (!have) continue;
    if (have === want) return 1;
    if (have.includes(want) || want.includes(have)) best = Math.max(best, 0.85);
    else {
      const shared = ctTokens.filter((t) => have.includes(t)).length;
      best = Math.max(best, shared / ctTokens.length);
    }
  }
  // Also allow specialization signal as secondary evidence.
  const specHit = profile.specializations.some((s) => fuzzyOverlap(want, s.specialization) >= 0.3);
  if (specHit) best = Math.max(best, 0.6);
  return Math.min(best, 1);
}

export function scoreStyle(briefStyleEmbedding: number[], profile: CreatorProfile): number {
  let best = 0;
  for (const p of profile.portfolios) {
    const emb = p.metadata?.embedding;
    if (emb && emb.length === briefStyleEmbedding.length) {
      best = Math.max(best, cosineSimilarity(briefStyleEmbedding, emb));
    }
  }
  // Map raw cosine [-1,1] -> [0,1]; typical similarities land 0.2-0.9.
  return Math.max(0, Math.min(1, best));
}

export function scoreRights(brief: Brief, profile: CreatorProfile): number {
  const need = rightsRank(brief.commercial_usage);
  const creatorBest = Math.max(
    0,
    ...profile.portfolios.map((p) => rightsRank(p.metadata?.commercial_use ?? "")),
  );
  if (need === 0) return 1;
  if (creatorBest >= need) return 1;
  if (creatorBest >= need - 1) return 0.75;
  return 0.5;
}

export interface PortfolioResult {
  score: number;
  topTitle: string | null;
  similarity: number;
  aspectMatch: boolean;
}

export function scorePortfolio(
  brief: Brief,
  profile: CreatorProfile,
  briefEmbedding: number[],
): PortfolioResult {
  let bestSim = 0;
  let topTitle: string | null = null;
  for (const p of profile.portfolios) {
    const emb = p.metadata?.embedding;
    if (!emb) continue;
    const sim = cosineSimilarity(briefEmbedding, emb);
    if (sim > bestSim) {
      bestSim = sim;
      topTitle = p.title;
    }
  }
  const aspectMatch = profile.portfolios.some(
    (p) => p.metadata?.aspect_ratio === brief.aspect_ratio,
  );
  const simNorm = Math.max(0, Math.min(1, (bestSim + 1) / 2)); // cosine -> [0,1]
  const score = Math.min(1, simNorm * 0.8 + (aspectMatch ? 0.2 : 0));
  return { score, topTitle, similarity: bestSim, aspectMatch };
}
