import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { upsertBrief } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    // Use seed brand if no real brand
    const { data: brands } = await supabase
      .from("brands")
      .select("id")
      .limit(1);

    const brand_id = brands?.[0]?.id;
    if (!brand_id) {
      return NextResponse.json(
        { error: "No brand found. Run seed first." },
        { status: 500 },
      );
    }

    const brief = await upsertBrief(supabase, {
      brand_id,
      raw_input: body.raw_input,
      campaign_objective: body.campaign_objective,
      content_type: body.content_type,
      style: body.style,
      duration: body.duration,
      platform: body.platform,
      aspect_ratio: body.aspect_ratio,
      target_audience: body.target_audience,
      visual_direction: body.visual_direction,
      required_tools: body.required_tools,
      commercial_usage: body.commercial_usage,
      deliverables: body.deliverables,
      constraints: body.constraints,
    });

    return NextResponse.json({ brief });
  } catch (err) {
    console.error("[api/brief/save]", err);
    return NextResponse.json(
      { error: "Failed to save brief", message: String(err) },
      { status: 500 },
    );
  }
}