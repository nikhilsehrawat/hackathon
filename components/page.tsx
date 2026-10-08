import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/db/client";
import { getAllCreatorProfiles } from "@/lib/db/client";

export default async function CreatorsPage() {
  const supabase = getSupabaseAdmin();
  const creators = await getAllCreatorProfiles(supabase);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-semibold text-white">
            CreatorIQ
          </span>
        </Link>
        <Link
          href="/brief/new"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/50 transition"
        >
          Create Brief
        </Link>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Verified AI Creators
          </h1>
          <p className="text-gray-400">
            {creators.length} creators specializing in AI-native content
            production
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {creators.map((profile) => (
            <Link
              key={profile.creator.id}
              href={`/creator/${profile.creator.id}`}
              className="glass rounded-2xl p-5 glass-hover block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {profile.creator.display_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {profile.creator.display_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {profile.creator.location}
                    </p>
                  </div>
                </div>
                {profile.verified_badge && (
                  <div className="px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                    <span className="text-xs text-green-400 font-medium">
                      ✓ Verified
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {profile.creator.bio}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.specializations.slice(0, 2).map((spec) => (
                  <span
                    key={spec.id}
                    className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs"
                  >
                    {spec.specialization}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {profile.tools.slice(0, 2).map((tool) => (
                    <span
                      key={tool.id}
                      className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded"
                    >
                      {tool.tool}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ${profile.creator.hourly_rate}/hr
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}