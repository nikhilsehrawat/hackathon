/**
 * POST /api/explain
 * Body: { match_id: string }  (or { brief_id, creator_id })
 * Returns: { bullets: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { explainRequestSchema } from "@/lib/validation/schemas";
import { getSupabaseAdmin } from "@/lib/db/client";
import { explainMatch } from "@/lib/ai/explainer";
import { getCreatorProfile, getBriefById } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = explainRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch match row
    const { data: matchRow, error: matchErr } = await supabase
      .from("creator_matches")
      .select("*")
      .eq("id", parsed.data.match_id)
      .single();

    if (matchErr || !matchRow) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const brief = await getBriefById(supabase, matchRow.brief_id);
    const profile = await getCreatorProfile(supabase, matchRow.creator_id);

    const bullets = await explainMatch({
      brief,
      profile,
      match: matchRow as any,
    });

    return NextResponse.json({ bullets });
  } catch (err) {
    console.error("[api/explain]", err);
    return NextResponse.json(
      { error: "Failed to explain", message: String(err) },
      { status: 500 },
    );
  }
}