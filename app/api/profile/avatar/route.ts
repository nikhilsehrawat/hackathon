import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/**
 * Uploads an account avatar/logo and saves its public URL to the owned profile.
 */
export async function POST(request: Request) {
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError) return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload form is invalid." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 413 });
  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed." }, { status: 415 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng = file.type === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isJpeg = file.type === "image/jpeg" &&
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = file.type === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isPng && !isJpeg && !isWebp) {
    return NextResponse.json({ error: "The selected file is not a valid JPG, PNG, or WebP image." }, { status: 415 });
  }

  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("users").select("role").eq("id", user.id).maybeSingle();
  if (accountError) return NextResponse.json({ error: "Unable to verify profile ownership." }, { status: 500 });
  if (!account || (account.role !== "brand" && account.role !== "creator")) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const path = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await admin.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true,
    cacheControl: "3600",
  });
  if (uploadError) {
    console.error("[api/profile/avatar] Upload failed:", uploadError);
    return NextResponse.json({ error: "Unable to upload image. Check that the avatars storage bucket exists." }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = urlData.publicUrl;
  const table = account.role === "creator" ? "creators" : "brands";
  const column = account.role === "creator" ? "avatar_url" : "logo_url";
  const { error: updateError } = await admin.from(table)
    .update({ [column]: avatarUrl }).eq("id", user.id);
  if (updateError) {
    console.error("[api/profile/avatar] Profile image update failed:", updateError);
    return NextResponse.json({ error: "Image uploaded but profile could not be updated." }, { status: 500 });
  }

  revalidatePath("/profile", "layout");
  return NextResponse.json({ url: avatarUrl });
}
