import { redirect } from "next/navigation";
import { connection } from "next/server";
import Nav from "@/components/layout/Nav";
import SettingsPanel from "@/components/profile/SettingsPanel";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";
import { resolveAccountRole } from "@/lib/supabase/account";


/**
 * Renders private settings for the currently authenticated account.
 */
export default async function SettingsPage() {
  await connection();
  const auth = await createServerSupabaseClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error && !isMissingAuthSession(error)) throw error;
  if (!user?.email) redirect("/login");

  const role = await resolveAccountRole(getSupabaseAdmin(), user);
  if (role !== "brand" && role !== "creator") redirect("/login");

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-8 md:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-gray-400">Manage your account, sign-in security, and profile role.</p>
        </header>
        <SettingsPanel email={user.email} role={role} />
      </section>
    </main>
  );
}
