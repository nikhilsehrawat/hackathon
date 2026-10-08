import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";
import { createProfileForAuthUser } from "@/lib/supabase/profiles";

/**
 * Reads the database role, provisioning a missing legacy account from verified auth metadata.
 */
export async function resolveAccountRole(
  admin: SupabaseClient,
  user: SupabaseUser,
): Promise<UserRole | null> {
  const { data: account, error } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  if (account?.role === "brand" || account?.role === "creator") {
    return account.role;
  }
  if (account) return null;

  const metadataRole = user.user_metadata.role;
  if (
    !user.email ||
    (metadataRole !== "brand" && metadataRole !== "creator")
  ) {
    return null;
  }

  await createProfileForAuthUser(
    admin,
    { id: user.id, email: user.email },
    metadataRole,
  );
  return metadataRole;
}
