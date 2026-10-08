/**
 * GET /api/creators?skills=...&tools=...&specialization=...&content_type=...
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { getAllCreatorProfiles } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const skills = url.searchParams.get("skills")?.split(",").filter(Boolean) ?? [];
    const tools = url.searchParams.get("tools")?.split(",").filter(Boolean) ?? [];
    const specialization = url.searchParams.get("specialization");
    const contentType = url.searchParams.get("content_type");

    const supabase = getSupabaseAdmin();
    const profiles = await getAllCreatorProfiles(supabase);

    const filtered = profiles.filter((p) => {
      if (skills.length > 0) {
        const hasSkill = p.skills.some((s) =>
          skills.some((sk) => s.skill.toLowerCase().includes(sk.toLowerCase())),
        );
        if (!hasSkill) return false;
      }
      if (tools.length > 0) {
        const hasTool = p.tools.some((t) =>
          tools.some((tl) => t.tool.toLowerCase().includes(tl.toLowerCase())),
        );
        if (!hasTool) return false;
      }
      if (specialization) {
        const hasSpec = p.specializations.some((s) =>
          s.specialization.toLowerCase().includes(specialization.toLowerCase()),
        );
        if (!hasSpec) return false;
      }
      if (contentType) {
        const hasCt = p.portfolios.some((pf) =>
          pf.metadata?.content_type?.toLowerCase().includes(contentType.toLowerCase()),
        );
        if (!hasCt) return false;
      }
      return true;
    });

    return NextResponse.json({ creators: filtered, count: filtered.length });
  } catch (err) {
    console.error("[api/creators]", err);
    return NextResponse.json(
      { error: "Failed to fetch creators", message: String(err) },
      { status: 500 },
    );
  }
}