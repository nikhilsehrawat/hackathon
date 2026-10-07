/**
 * POST /api/brief/generate
 * Body: { raw_input: string, brand_id?: uuid }
 * -> Runs the AI brief builder (GPT-4o JSON mode with rule-based fallback),
 *    persists the brief when a valid brand_id is supplied, otherwise returns
 *    the structured brief only (demo mode).
 */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { buildBrief } from "@/lib/ai/briefBuilder";
import { getSupabaseAdmin, upsertBrief } from "@/lib/db/client";
import { briefGenerateRequestSchema } from "@/lib/validation/schemas";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { raw_input, brand_id } = briefGenerateRequestSchema.parse(body);

    const { brief, source } = await buildBrief(raw_input);

    // Persist if we have a brand; otherwise stay in demo (preview-only) mode.
    if (brand_id) {
      try {
        const supabase = getSupabaseAdmin();
        const saved: Brief = await upsertBrief(supabase, { ...brief, raw_input, brand_id });
        return NextResponse.json({ brief: saved, id: saved.id, source });
      } catch (dbErr) {
        console.warn("[/api/brief/generate] DB persist failed, returning preview:", String(dbErr));
      }
    }

    return NextResponse.json({ brief, id: null, source });
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
    console.error("[/api/brief/generate]", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
