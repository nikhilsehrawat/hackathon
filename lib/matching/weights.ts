/**
 * lib/matching/weights.ts — Weighted hybrid scoring configuration.
 * Weights must sum to 1.0 (asserted at module load).
 */

export const MATCH_WEIGHTS = {
  skill: 0.2,
  tool: 0.2,
  specialization: 0.15,
  content_type: 0.15,
  style: 0.1,
  rights: 0.1,
  portfolio: 0.1,
} as const;

export type WeightKey = keyof typeof MATCH_WEIGHTS;

const total = Object.values(MATCH_WEIGHTS).reduce((s, w) => s + w, 0);
if (Math.abs(total - 1.0) > 1e-9) {
  throw new Error(`MATCH_WEIGHTS must sum to 1.0 (got ${total})`);
}

/** Rights ladder used by rights_match scoring. Higher rank = stronger rights. */
export const RIGHTS_LADDER: string[] = [
  "none",
  "personal use only",
  "social media use",
  "commercial use (organic)",
  "full commercial rights",
  "full commercial rights, paid media",
];

export function rightsRank(text: string): number {
  const lower = text.toLowerCase();
  let best = 0;
  RIGHTS_LADDER.forEach((level, idx) => {
    const key = level.split(",")[0].trim();
    if (lower.includes(key)) best = Math.max(best, idx);
  });
  // Heuristics for phrasing variants.
  if (/paid media|whitelisting|performance/.test(lower)) best = Math.max(best, 5);
  else if (/full commercial|all rights|buyout/.test(lower)) best = Math.max(best, 4);
  else if (/commercial/.test(lower)) best = Math.max(best, 3);
  else if (/social/.test(lower)) best = Math.max(best, 2);
  return best;
}
