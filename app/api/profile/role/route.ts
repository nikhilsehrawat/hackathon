import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Changes a creator account to a brand account without accepting client identity.
 */
export async function PATCH(request: Request) {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  if (!user?.email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = z.object({ role: z.literal("brand") }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Only creator-to-brand role changes are supported." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: account, error } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to read account." }, { status: 500 });
  if (account?.role !== "creator") return NextResponse.json({ error: "Only creator accounts can change to a brand account." }, { status: 403 });

  const displayName = user.email.split("@")[0] || "My Company";
  const { error: profileError } = await admin.from("brands").upsert({
    id: user.id,
    company_name: displayName,
    industry: "",
    website: "",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) {
    console.error("[api/profile/role] Brand profile creation failed:", profileError);
    return NextResponse.json({ error: "Unable to create the brand profile." }, { status: 500 });
  }

  const { error: updateError } = await admin.from("users").update({ role: "brand" }).eq("id", user.id);
  if (updateError) {
    console.error("[api/profile/role] Role update failed:", updateError);
    return NextResponse.json({ error: "Brand profile was created, but account role could not be changed." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  revalidatePath("/dashboard");
  return NextResponse.json({ success: true });
}
