import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const brandProfileSchema = z.object({
  company_name: z.string().trim().min(1).max(160).optional(),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  industry: z.string().trim().max(120).optional(),
  website: z.string().trim().max(300).optional(),
  contact_name: z.string().trim().max(120).optional(),
  contact_email: z.union([z.email(), z.literal("")]).optional(),
  contact_phone: z.string().trim().max(40).optional(),
  linkedin: z.string().trim().max(300).optional(),
  twitter: z.string().trim().max(100).optional(),
}).strict();

/**
 * Updates the signed-in brand's own profile.
 */
export async function PATCH(request: Request) {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = brandProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json({ error: "Provide valid brand profile fields." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("users").select("role").eq("id", user.id).maybeSingle();
  if (accountError) return NextResponse.json({ error: "Unable to verify profile ownership." }, { status: 500 });
  if (account?.role !== "brand") return NextResponse.json({ error: "Brand profile access required." }, { status: 403 });

  const { data, error } = await admin.from("brands")
    .update(parsed.data).eq("id", user.id).select("*").single();
  if (error) {
    console.error("[api/profile/brand] Update failed:", error);
    return NextResponse.json({ error: "Unable to update brand profile." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  return NextResponse.json({ profile: data });
}
