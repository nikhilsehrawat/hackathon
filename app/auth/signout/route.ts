import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function signOut(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth/signout] Sign-out failed:", error.message);
    return NextResponse.json({ error: "Unable to sign out. Please try again." }, { status: 500 });
  }

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (/^sb-.+-(?:auth-token(?:\.\d+)?|auth-token-code-verifier)$/.test(cookie.name)) {
      cookieStore.set(cookie.name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
    }
  }

  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}

/**
 * Signs out the current Supabase session and redirects to the home page.
 */
export async function POST(request: NextRequest) {
  return signOut(request);
}

/**
 * Supports sign-out links from older clients and redirects home after logout.
 */
export async function GET(request: NextRequest) {
  return signOut(request);
}
