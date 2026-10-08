/**
 * POST /api/match
 * Body: { brief_id: string }
 * Returns: { matches: RankedMatch[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { matchRequestSchema } from "@/lib/validation/schemas";
import { getSupabaseAdmin } from "@/lib/db/client";
import { rankCreatorsForBrief } from "@/lib/matching/engine";
import { getAllCreatorProfiles, getBriefById, insertMatches } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = matchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const brief = await getBriefById(supabase, parsed.data.brief_id);
    const profiles = await getAllCreatorProfiles(supabase);

    const ranked = await rankCreatorsForBrief(brief, profiles);

    // Save matches to DB
    await insertMatches(
      supabase,
      brief.id,
      ranked.map((m) => ({
        creator_id: m.creator_id,
        total_score: m.scores.total_score,
        skill_score: m.scores.skill_score,
        tool_score: m.scores.tool_score,
        specialization_score: m.scores.specialization_score,
        content_type_score: m.scores.content_type_score,
        style_score: m.scores.style_score,
        rights_score: m.scores.rights_score,
        portfolio_score: m.scores.portfolio_score,
        explanation: m.explanation,
      })),
    );

    // Attach creator details to each match
    const withCreators = ranked.map((m) => {
      const profile = profiles.find((p) => p.creator.id === m.creator_id);
      return {
        ...m,
        creator: profile,
      };
    });

    return NextResponse.json({ matches: withCreators });
  } catch (err) {
    console.error("[api/match]", err);
    return NextResponse.json(
      { error: "Failed to match", message: String(err) },
      { status: 500 },
    );
  }
}