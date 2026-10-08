import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";
import { createProfileForAuthUser } from "@/lib/supabase/profiles";

/**
 * Returns the authenticated user's role-specific profile for the account menu.
 */
export async function GET() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await auth.auth.getUser();

  if (authError && !isMissingAuthSession(authError)) {
    console.error("[api/profile/me] Session lookup failed:", authError.message);
    return NextResponse.json({ error: "Unable to verify session." }, { status: 401 });
  }
  if (!user?.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (accountError) {
    console.error("[api/profile/me] Account lookup failed:", accountError);
    return NextResponse.json({ error: "Unable to load account." }, { status: 500 });
  }
  const metadataRole = user.user_metadata.role;
  const role =
    account?.role === "brand" || account?.role === "creator"
      ? account.role
      : !account && (metadataRole === "brand" || metadataRole === "creator")
        ? metadataRole
        : null;
  if (!role) {
    return NextResponse.json({ error: "Account role is missing or invalid." }, { status: 404 });
  }

  const table = role === "creator" ? "creators" : "brands";
  let { data: details, error: profileError } = await admin
    .from(table)
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!account || (!profileError && !details)) {
    try {
      await createProfileForAuthUser(admin, { id: user.id, email: user.email }, role);
      const refreshed = await admin
        .from(table)
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      details = refreshed.data;
      profileError = refreshed.error;
    } catch (error) {
      console.error("[api/profile/me] Profile provisioning failed:", error);
      return NextResponse.json({ error: "Unable to provision marketplace profile." }, { status: 500 });
    }
  }

  if (profileError) {
    console.error("[api/profile/me] Profile lookup failed:", profileError);
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }
  if (!details) {
    return NextResponse.json({ error: "Marketplace profile not found." }, { status: 404 });
  }

  const displayName =
    role === "creator" ? details.display_name : details.company_name;
  const avatarUrl =
    role === "creator" ? details.avatar_url : details.logo_url;

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      role,
      display_name:
        typeof displayName === "string" && displayName.trim()
          ? displayName.trim()
          : user.email.split("@")[0],
      avatar_url: typeof avatarUrl === "string" && avatarUrl ? avatarUrl : null,
    },
  });
}
