/**
 * GET /api/creators?skills=&tools=&specialization=&content_type=
 * -> Lists creator profiles with optional substring filters. Matching is
 *    case-insensitive across skills / tools / specializations / portfolio
 *    content types.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getAllCreatorProfiles, getSupabaseAdmin } from "@/lib/db/client";
import { creatorsQuerySchema, type CreatorsQuery } from "@/lib/validation/schemas";
import type { CreatorProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contains(haystacks: string[], needle: string): boolean {
  const n = needle.toLowerCase().trim();
  if (!n) return true;
  return haystacks.some((h) => h.toLowerCase().includes(n));
}

function applyFilters(profiles: CreatorProfile[], q: CreatorsQuery): CreatorProfile[] {
  return profiles.filter((p) => {
    if (q.skills && !contains(p.skills.map((s) => s.skill), q.skills)) return false;
    if (q.tools && !contains(p.tools.map((t) => t.tool), q.tools)) return false;
    if (
      q.specialization &&
      !contains(p.specializations.map((s) => s.specialization), q.specialization)
    ) {
      return false;
    }
    if (
      q.content_type &&
      !contains(p.portfolios.map((pf) => pf.metadata?.content_type ?? ""), q.content_type)
    ) {
      return false;
    }
    return true;
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = creatorsQuerySchema.safeParse({
      skills: req.nextUrl.searchParams.get("skills") ?? undefined,
      tools: req.nextUrl.searchParams.get("tools") ?? undefined,
      specialization: req.nextUrl.searchParams.get("specialization") ?? undefined,
      content_type: req.nextUrl.searchParams.get("content_type") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const profiles = await getAllCreatorProfiles(supabase);
    const creators = applyFilters(profiles, parsed.data);

    return NextResponse.json({ creators, count: creators.length });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    console.error("[/api/creators]", err);
    return NextResponse.json({ error: "Failed to load creators" }, { status: 500 });
  }
}
