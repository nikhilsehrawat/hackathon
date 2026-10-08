import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the authenticated user's Supabase auth account and profile.
 */
export async function DELETE(request: Request) {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = z.object({ confirmation: z.literal("DELETE") }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Type DELETE to confirm account removal." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    console.error("[api/profile/delete] Auth user deletion failed:", authDeleteError);
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }

  const { error: profileDeleteError } = await admin.from("users").delete().eq("id", user.id);
  if (profileDeleteError) {
    console.error("[api/profile/delete] Profile row deletion failed:", profileDeleteError);
    return NextResponse.json({ error: "Auth account was deleted, but marketplace data cleanup failed. Contact support." }, { status: 500 });
  }
  revalidatePath("/");
  return NextResponse.json({ success: true });
}
