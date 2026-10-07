/**
 * POST /api/explain
 * Body: { match_id: uuid }
 * -> Loads the stored creator_match row + its brief and creator profile,
 *    then returns 4-5 explanation bullets (LLM-polished when possible,
 *    template fallback otherwise).
 */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { explainMatch } from "@/lib/ai/explainer";
import { getBriefById, getCreatorProfile, getSupabaseAdmin } from "@/lib/db/client";
import { explainRequestSchema } from "@/lib/validation/schemas";
import { TABLES } from "@/lib/db/schema";
import type { CreatorMatch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { match_id: matchId } = explainRequestSchema.parse(body);

    const supabase = getSupabaseAdmin();

    const matchRes = await supabase
      .from(TABLES.creatorMatches)
      .select("*")
      .eq("id", matchId)
      .single();
    if (matchRes.error || !matchRes.data) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const match = matchRes.data as unknown as CreatorMatch;

    const [brief, profile] = await Promise.all([
      getBriefById(supabase, match.brief_id),
      getCreatorProfile(supabase, match.creator_id),
    ]);

    const bullets = await explainMatch({ brief, profile, match });

    // Persist polished bullets back onto the match row (best-effort).
    if (match.explanation) {
      try {
        await supabase
          .from(TABLES.creatorMatches)
          .update({ explanation: { ...match.explanation, bullets } })
          .eq("id", matchId);
      } catch {
        /* non-critical */
      }
    }

    return NextResponse.json({ bullets });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 },
      );
    }
    console.error("[/api/explain]", err);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
