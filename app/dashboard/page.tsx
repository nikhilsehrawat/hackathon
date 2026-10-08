import Link from "next/link";
import { getSupabaseAdmin, getAllCreatorProfiles } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Nav from "@/components/layout/Nav";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";
import { resolveAccountRole } from "@/lib/supabase/account";

export const instant = false;

/**
 * Renders the signed-in user's dashboard and marketplace activity.
 */
export default async function DashboardPage() {
  await connection();
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError && !isMissingAuthSession(authError)) throw authError;
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();
  const role = await resolveAccountRole(supabase, user);
  if (role !== "brand" && role !== "creator") redirect("/login");
  const profileTable = role === "creator" ? "creators" : "brands";
  const { data: accountProfile, error: profileError } = await supabase
    .from(profileTable).select("*").eq("id", user.id).maybeSingle();
  if (profileError) throw profileError;
  const profileName = role === "creator"
    ? accountProfile?.display_name
    : accountProfile?.company_name;
  const profileAvatar = role === "creator"
    ? accountProfile?.avatar_url
    : accountProfile?.logo_url;
  const profileUrl = `/profile/${role}/${user.id}`;

  // Get briefs
  const { data: briefs } = await supabase
    .from("briefs")
    .select("*")
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get creators count
  const creators = await getAllCreatorProfiles(supabase);

  // Get matches count
  const { count: matchesCount } = await supabase
    .from("creator_matches")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <Nav>
          <Link
            href="/brief/new"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/50 transition"
          >
            + New Brief
          </Link>
      </Nav>

      <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="glass mb-8 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatar} alt="" className="h-full w-full object-cover" />
            ) : (profileName || user.email || "P").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-white">{profileName || user.email}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${role === "creator" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"}`}>
              {role}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile" className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white">Edit Profile</Link>
            <Link href={profileUrl} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">View Public Profile</Link>
          </div>
        </div>
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Your briefs, matches, and creator activity · {user.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Total Briefs",
              value: briefs?.length ?? 0,
              icon: "📝",
            },
            {
              label: "Total Creators",
              value: creators.length,
              icon: "🎨",
            },
            {
              label: "Matches Run",
              value: matchesCount ?? 0,
              icon: "🎯",
            },
            {
              label: "Avg Match Score",
              value: "92%",
              icon: "⭐",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 glass-hover"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Briefs */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Recent Briefs
              </h2>
              <Link
                href="/brief/new"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {(!briefs || briefs.length === 0) && (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-gray-500 mb-4">No briefs yet</p>
                  <Link
                    href="/brief/new"
                    className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                  >
                    Create Your First Brief
                  </Link>
                </div>
              )}

              {briefs?.map((brief) => (
                <Link
                  key={brief.id}
                  href={`/brief/${brief.id}/matches`}
                  className="glass rounded-2xl p-5 glass-hover block"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium line-clamp-1 mb-1">
                        {brief.raw_input}
                      </p>
                      <p className="text-xs text-gray-500">
                        {brief.content_type} · {brief.platform} ·{" "}
                        {brief.aspect_ratio}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-xs text-green-400 border border-green-500/30 shrink-0">
                      {brief.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
                      {brief.style}
                    </span>
                    {brief.required_tools?.slice(0, 2).map((tool: string) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 rounded-full bg-purple-500/15 text-xs text-purple-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Creators */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Top Creators
              </h2>
              <Link
                href="/creators"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {creators.slice(0, 5).map((profile) => (
                <Link
                  key={profile.creator.id}
                  href={`/creator/${profile.creator.id}`}
                  className="glass rounded-2xl p-4 glass-hover flex items-center gap-3 block"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                    {profile.creator.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-sm font-medium truncate">
                        {profile.creator.display_name}
                      </h3>
                      {profile.verified_badge && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {profile.specializations[0]?.specialization ?? "AI Creator"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  href="/brief/new"
                  className="glass rounded-xl p-4 glass-hover flex items-center gap-3 block"
                >
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="text-white text-sm font-medium">
                      New Brief
                    </div>
                    <div className="text-xs text-gray-500">
                      AI-powered builder
                    </div>
                  </div>
                </Link>
                <Link
                  href="/creators"
                  className="glass rounded-xl p-4 glass-hover flex items-center gap-3 block"
                >
                  <span className="text-2xl">🔍</span>
                  <div>
                    <div className="text-white text-sm font-medium">
                      Browse Creators
                    </div>
                    <div className="text-xs text-gray-500">
                      15 verified AI creators
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}