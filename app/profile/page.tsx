import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/db/client";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";
import { resolveAccountRole } from "@/lib/supabase/account";


/**
 * Routes each authenticated user to the public URL for their own profile.
 */
export default async function ProfileRouter() {
  await connection();
  const auth = await createServerSupabaseClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error && !isMissingAuthSession(error)) throw error;
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const role = await resolveAccountRole(admin, user);
  if (role === "creator") redirect(`/profile/creator/${user.id}`);
  if (role === "brand") redirect(`/profile/brand/${user.id}`);
  redirect("/login");
}
