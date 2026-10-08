import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const skillSchema = z.object({
  skill: z.string().trim().min(1).max(80),
  proficiency: z.number().int().min(1).max(5),
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
 * Adds a skill to the authenticated creator's profile.
 */
export async function POST(request: Request) {
  const owner = await getOwnerId();
  if (owner.error) return owner.error;
  const parsed = skillSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a skill and proficiency from 1 to 5." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_skills")
    .insert({ creator_id: owner.userId, ...parsed.data }).select("*").single();
  if (error) {
    console.error("[api/profile/creator/skills] Insert failed:", error);
    return NextResponse.json({ error: "Unable to add skill." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  return NextResponse.json({ skill: data }, { status: 201 });
}

/**
 * Removes a skill belonging to the authenticated creator.
 */
export async function DELETE(request: Request) {
  const owner = await getOwnerId();
  if (owner.error) return owner.error;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid skill id is required." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_skills").delete()
    .eq("id", parsed.data.id).eq("creator_id", owner.userId).select("id").maybeSingle();
  if (error) {
    console.error("[api/profile/creator/skills] Delete failed:", error);
    return NextResponse.json({ error: "Unable to remove skill." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  revalidatePath("/profile", "layout");
  return NextResponse.json({ success: true });
}
