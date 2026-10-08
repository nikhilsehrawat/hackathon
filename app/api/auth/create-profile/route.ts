import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createProfileForAuthUser } from "@/lib/supabase/profiles";
import { z } from "zod";

const createProfileBodySchema = z.object({
  email: z.email(),
  role: z.enum(["brand", "creator"]),
  display_name: z.string().trim().max(100).optional(),
});

/**
 * Provisions a marketplace profile for the authenticated Supabase user.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedBody = createProfileBodySchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Provide a valid email, role, and optional display name (up to 100 characters)." },
      { status: 400 },
    );
  }
  const body = parsedBody.data;

  try {
    const admin = getSupabaseAdmin();
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(accessToken);

    if (authError || !user?.email) {
      return NextResponse.json({ error: "The access token is invalid or expired." }, { status: 401 });
    }
    if (user.email.toLowerCase() !== body.email.trim().toLowerCase()) {
      return NextResponse.json({ error: "Email does not match the authenticated account." }, { status: 403 });
    }

    const profile = await createProfileForAuthUser(
      admin,
      { id: user.id, email: user.email },
      body.role,
      body.display_name,
    );

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile creation failed.";
    console.error("[api/auth/create-profile] Profile creation failed:", error);
    const status = message.includes("different profile role") ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? message : "Unable to create your marketplace profile." },
      { status },
    );
  }
}
