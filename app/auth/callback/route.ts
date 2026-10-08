import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createProfileForAuthUser } from "@/lib/supabase/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Exchanges a confirmation code, provisions its role profile, and continues.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.email) throw new Error("The confirmed account has no email address.");

    const role = user.user_metadata.role;
    if (role !== "brand" && role !== "creator") {
      throw new Error("The confirmed account has no valid marketplace role.");
    }

    await createProfileForAuthUser(
      getSupabaseAdmin(),
      { id: user.id, email: user.email },
      role,
      typeof user.user_metadata.display_name === "string"
        ? user.user_metadata.display_name
        : undefined,
    );

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("[auth/callback] Confirmation failed:", error);
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }
}
