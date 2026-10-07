/**
 * POST /api/projects — shortlist / engage a matched creator for a brief.
 * Body: { brief_id: uuid, creator_id: uuid, status?: "shortlisted" | "engaged" }
 */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { TABLES } from "@/lib/db/schema";
import { shortlistSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { brief_id, creator_id, status } = shortlistSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Idempotent: skip if this pair already exists.
    const existing = await supabase
      .from(TABLES.projects)
      .select("id,status")
      .eq("brief_id", brief_id)
      .eq("creator_id", creator_id)
      .maybeSingle();

    if (existing.data) {
      const updated = await supabase
        .from(TABLES.projects)
        .update({ status })
        .eq("id", existing.data.id)
        .select("id,status")
        .single();
      if (updated.error) throw updated.error;
      return NextResponse.json({ project: updated.data, reused: true });
    }

    const inserted = await supabase
      .from(TABLES.projects)
      .insert({ brief_id, creator_id, status })
      .select("id,brief_id,creator_id,status")
      .single();
    if (inserted.error) throw inserted.error;

    return NextResponse.json({ project: inserted.data, reused: false }, { status: 201 });
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
    console.error("[/api/projects]", err);
    return NextResponse.json({ error: "Failed to save shortlist" }, { status: 500 });
  }
}
