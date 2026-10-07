/**
 * POST /api/seed
 * Body: {} (optional { confirm: "seed" })
 * -> Runs the idempotent seed routine (15 creators + 5 briefs) against
 *    Supabase via the service-role client. Safe to call repeatedly.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { runSeed } from "@/scripts/seedRunner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdmin();
    const result = await runSeed(supabase);
    return NextResponse.json({
      inserted: result.inserted,
      creators: result.creators,
      briefs: result.briefs,
    });
  } catch (err) {
    console.error("[/api/seed]", err);
    return NextResponse.json(
      { error: "Seeding failed", detail: String(err) },
      { status: 500 },
    );
  }
}
