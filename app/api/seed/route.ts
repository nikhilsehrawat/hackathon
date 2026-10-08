/**
 * POST /api/seed
 * Triggers the idempotent seed runner. Safe to call multiple times.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { runSeed } from "@/scripts/seedRunner";

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const result = await runSeed(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/seed]", err);
    return NextResponse.json(
      { error: "Seed failed", message: String(err) },
      { status: 500 },
    );
  }
}