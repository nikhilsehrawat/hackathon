import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const creatorProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(100).optional(),
  tagline: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(120).optional(),
  years_experience: z.number().int().min(0).max(80).optional(),
  hourly_rate: z.number().min(0).max(1000000).optional(),
  availability: z.string().trim().max(80).optional(),
  website: z.string().trim().max(300).optional(),
  twitter: z.string().trim().max(100).optional(),
  linkedin: z.string().trim().max(300).optional(),
  portfolio_link: z.string().trim().max(300).optional(),
}).strict();

/**
 * Updates the signed-in creator's own profile.
 */
export async function PATCH(request: Request) {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = creatorProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json({ error: "Provide valid creator profile fields." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("users").select("role").eq("id", user.id).maybeSingle();
  if (accountError) return NextResponse.json({ error: "Unable to verify profile ownership." }, { status: 500 });
  if (account?.role !== "creator") return NextResponse.json({ error: "Creator profile access required." }, { status: 403 });

  const { data, error } = await admin.from("creators")
    .update(parsed.data).eq("id", user.id).select("*").single();
  if (error) {
    console.error("[api/profile/creator] Update failed:", error);
    return NextResponse.json({ error: "Unable to update creator profile." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  return NextResponse.json({ profile: data });
}
