/**
 * lib/matching/engine.ts — Hybrid weighted matching engine.
 *
 * For a brief: embed style + visual direction once, score every creator on 7
 * components, combine with MATCH_WEIGHTS, and emit ranked matches with an
 * explanation payload (template bullets; LLM polish is optional in explainer).
 */
import type { Brief, CreatorProfile, RankedMatch, MatchScoreBreakdown } from "../types";
import { embedText, styleEmbeddingText } from "../ai/embeddings";
import { MATCH_WEIGHTS } from "./weights";
import {
  scoreSkills,
  scoreTools,
  scoreSpecialization,
  scoreContentType,
  scoreStyle,
  scoreRights,
  scorePortfolio,
} from "./scoring";

const round = (n: number): number => Math.round(n * 1000) / 1000;

export async function rankCreatorsForBrief(
  brief: Brief,
  profiles: CreatorProfile[],
): Promise<RankedMatch[]> {
  // One embedding for the brief's creative signature (style + visual direction).
  const briefEmbedding = await embedText(
    styleEmbeddingText(brief.style, `${brief.visual_direction} ${brief.content_type}`),
  );

  const results: RankedMatch[] = profiles.map((profile) => {
    const skill = scoreSkills(brief, profile);
    const tool = scoreTools(brief, profile);
    const spec = scoreSpecialization(brief, profile);
    const contentType = scoreContentType(brief, profile);
    const style = scoreStyle(briefEmbedding, profile);
    const rights = scoreRights(brief, profile);
    const portfolio = scorePortfolio(brief, profile, briefEmbedding);

    const scores: MatchScoreBreakdown = {
      skill_score: round(skill.score),
      tool_score: round(tool.score),
      specialization_score: round(spec.score),
      content_type_score: round(contentType),
      style_score: round(style),
      rights_score: round(rights),
      portfolio_score: round(portfolio.score),
      total_score: round(
        skill.score * MATCH_WEIGHTS.skill +
          tool.score * MATCH_WEIGHTS.tool +
          spec.score * MATCH_WEIGHTS.specialization +
          contentType * MATCH_WEIGHTS.content_type +
          style * MATCH_WEIGHTS.style +
          rights * MATCH_WEIGHTS.rights +
          portfolio.score * MATCH_WEIGHTS.portfolio,
      ),
    };

    const similarityPct = Math.round(Math.max(0, portfolio.similarity) * 100);

    return {
      creator_id: profile.creator.id,
      scores,
      explanation: {
        bullets: buildTemplateBullets(profile, brief, skill.matched, tool.matched, spec.matched, portfolio.topTitle, similarityPct, rights >= 1),
        matched_skills: skill.matched,
        matched_tools: tool.matched,
        matched_specializations: spec.matched,
        top_portfolio_title: portfolio.topTitle,
        similarity_pct: similarityPct,
      },
    };
  });

  return results.sort((a, b) => b.scores.total_score - a.scores.total_score);
}

/* ---------------- Template explanation bullets ---------------- */

function buildTemplateBullets(
  profile: CreatorProfile,
  brief: Brief,
  matchedSkills: string[],
  matchedTools: string[],
  matchedSpecs: string[],
  topPortfolio: string | null,
  similarityPct: number,
  rightsOk: boolean,
): string[] {
  const bullets: string[] = [];

  if (matchedSpecs.length > 0) {
    bullets.push(`Creator specializes in ${matchedSpecs.slice(0, 2).join(" and ")}.`);
  } else {
    bullets.push(`Adjacent expertise: ${profile.specializations[0]?.specialization ?? "generalist AI creator"}.`);
  }

  if (matchedTools.length > 0) {
    bullets.push(`Uses ${matchedTools.join(", ")} — exactly what this brief requires.`);
  }

  if (matchedSkills.length > 0) {
    bullets.push(`Demonstrated skills: ${matchedSkills.slice(0, 3).join(", ")}.`);
  }

  if (topPortfolio) {
    bullets.push(
      `Portfolio includes "${topPortfolio}" (${brief.aspect_ratio}) with ${similarityPct}% style similarity to "${brief.style}".`,
    );
  }

  bullets.push(
    rightsOk
      ? `Has ${brief.commercial_usage.toLowerCase()} experience on past work.`
      : "Commercial rights coverage is partial — confirm licensing before contracting.",
  );

  if (profile.verified_badge) {
    bullets.push(`Verified AI Creator: ${profile.signals.length} evidence-backed signals declared.`);
  }

  return bullets.slice(0, 5);
}
