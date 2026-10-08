import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const toolSchema = z.object({
  tool: z.string().trim().min(1).max(80),
  proficiency: z.number().int().min(1).max(5),
  verified: z.boolean().default(false),
}).strict();

async function getOwnerId() {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  const { data: account, error: roleError } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (roleError) return { error: NextResponse.json({ error: "Unable to verify account role." }, { status: 500 }) };
  if (account?.role !== "creator") return { error: NextResponse.json({ error: "Creator profile access required." }, { status: 403 }) };
  return { admin, userId: user.id };
}

/**
 * Adds a tool to the authenticated creator's profile.
 */
export async function POST(request: Request) {
  const owner = await getOwnerId();
  if (owner.error) return owner.error;
  const parsed = toolSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a tool and proficiency from 1 to 5." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_tools")
    .insert({ creator_id: owner.userId, ...parsed.data, verified: false }).select("*").single();
  if (error) {
    console.error("[api/profile/creator/tools] Insert failed:", error);
    return NextResponse.json({ error: "Unable to add tool." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  return NextResponse.json({ tool: data }, { status: 201 });
}

/**
 * Removes a tool belonging to the authenticated creator.
 */
export async function DELETE(request: Request) {
  const owner = await getOwnerId();
  if (owner.error) return owner.error;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid tool id is required." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_tools").delete()
    .eq("id", parsed.data.id).eq("creator_id", owner.userId).select("id").maybeSingle();
  if (error) {
    console.error("[api/profile/creator/tools] Delete failed:", error);
    return NextResponse.json({ error: "Unable to remove tool." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  revalidatePath("/profile", "layout");
  return NextResponse.json({ success: true });
}
