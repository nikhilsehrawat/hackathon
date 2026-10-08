import { NextRequest, NextResponse } from "next/server";
import { buildBrief } from "@/lib/ai/briefBuilder";
import { briefGenerateRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = briefGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const result = await buildBrief(parsed.data.raw_input);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/brief/generate]", err);
    return NextResponse.json(
      { error: "Failed to generate brief", message: String(err) },
      { status: 500 },
    );
  }
}