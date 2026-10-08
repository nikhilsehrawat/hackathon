import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

interface AuthIdentity {
  id: string;
  email: string;
}

export interface CreatedProfile {
  user: {
    id: string;
    email: string;
    role: UserRole;
    created_at: string;
  };
  details: Record<string, unknown>;
}

/**
 * Creates a user row and its role-specific marketplace profile idempotently.
 */
export async function createProfileForAuthUser(
  admin: SupabaseClient,
  identity: AuthIdentity,
  role: UserRole,
  displayName?: string,
): Promise<CreatedProfile> {
  const { data: currentProfile, error: lookupError } = await admin
    .from("users")
    .select("role")
    .eq("id", identity.id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (currentProfile && currentProfile.role !== role) {
    throw new Error("This account already has a different profile role.");
  }

  const { data: user, error: userError } = await admin
    .from("users")
    .upsert(
      { id: identity.id, email: identity.email, role },
      { onConflict: "id" },
    )
    .select("id, email, role, created_at")
    .single();

  if (userError) throw userError;

  const defaultName =
    displayName?.trim() || identity.email.split("@")[0] || "PromptFolio member";

  if (role === "creator") {
    const { error } = await admin.from("creators").upsert(
      {
        id: identity.id,
        display_name: defaultName,
        bio: "",
        location: "",
        years_experience: 0,
        hourly_rate: 0,
        availability: "Unknown",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw error;

    const { data: details, error: detailsError } = await admin
      .from("creators")
      .select("*")
      .eq("id", identity.id)
      .single();
    if (detailsError) throw detailsError;

    return { user, details };
  }

  const { error } = await admin.from("brands").upsert(
    {
      id: identity.id,
      company_name: defaultName,
      industry: "",
      website: "",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw error;

  const { data: details, error: detailsError } = await admin
    .from("brands")
    .select("*")
    .eq("id", identity.id)
    .single();
  if (detailsError) throw detailsError;

  return { user, details };
}
