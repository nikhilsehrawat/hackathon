import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const portfolioSchema = z.object({
  title: z.string().trim().min(1).max(160),
  media_url: z.url().max(1000).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }),
  media_type: z.enum(["image", "video"]),
  description: z.string().trim().max(2000).default(""),
}).strict();

async function getCreatorOwner() {
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
 * Adds a portfolio item to the authenticated creator's profile.
 */
export async function POST(request: Request) {
  const owner = await getCreatorOwner();
  if (owner.error) return owner.error;
  const parsed = portfolioSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a title, valid media URL, and media type." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_portfolios").insert({
    creator_id: owner.userId,
    ...parsed.data,
    thumbnail_url: "",
  }).select("*").single();
  if (error) {
    console.error("[api/profile/creator/portfolio] Insert failed:", error);
    return NextResponse.json({ error: "Unable to add portfolio item." }, { status: 500 });
  }
  revalidatePath("/profile", "layout");
  return NextResponse.json({ item: data }, { status: 201 });
}

/**
 * Removes only a portfolio item owned by the authenticated creator.
 */
export async function DELETE(request: Request) {
  const owner = await getCreatorOwner();
  if (owner.error) return owner.error;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid portfolio item id is required." }, { status: 400 });
  const { data, error } = await owner.admin.from("creator_portfolios").delete()
    .eq("id", parsed.data.id).eq("creator_id", owner.userId).select("id").maybeSingle();
  if (error) {
    console.error("[api/profile/creator/portfolio] Delete failed:", error);
    return NextResponse.json({ error: "Unable to remove portfolio item." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Portfolio item not found." }, { status: 404 });
  revalidatePath("/profile", "layout");
  return NextResponse.json({ success: true });
}
