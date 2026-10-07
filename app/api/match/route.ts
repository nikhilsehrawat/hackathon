/**
 * POST /api/match
 * Body: { brief_id: uuid }
 * -> Loads the brief + every creator profile, runs the hybrid weighted
 *    matching engine, persists ranked creator_matches, and returns them.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { rankCreatorsForBrief } from "@/lib/matching/engine";
import {
  getAllCreatorProfiles,
  getBriefById,
  getSupabaseAdmin,
  insertMatches,
  setBriefStatus,
} from "@/lib/db/client";
import { matchRequestSchema } from "@/lib/validation/schemas";
import type { CreatorMatch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let briefId = "";
  try {
    const body = await req.json().catch(() => ({}));
    ({ brief_id: briefId } = matchRequestSchema.parse(body));

    const supabase = getSupabaseAdmin();
    const [brief, profiles] = await Promise.all([
      getBriefById(supabase, briefId),
      getAllCreatorProfiles(supabase),
    ]);

    const ranked = await rankCreatorsForBrief(brief, profiles);

    const matches: CreatorMatch[] = await insertMatches(
      supabase,
      briefId,
      ranked.map((r) => ({
        creator_id: r.creator_id,
        ...r.scores,
        explanation: r.explanation,
      })),
    );

    await setBriefStatus(supabase, briefId, "matched").catch(() => undefined);

    return NextResponse.json({ matches });
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
    console.error("[/api/match]", err);
    return NextResponse.json(
      { error: "Matching failed", detail: String(err) },
      { status: 500 },
    );
  }
}
