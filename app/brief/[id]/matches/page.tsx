import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/db/client";
import { getBriefById, getAllCreatorProfiles } from "@/lib/db/client";
import { rankCreatorsForBrief } from "@/lib/matching/engine";
import Nav from "@/components/layout/Nav";

export const instant = false;

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let brief;
  try {
    brief = await getBriefById(supabase, id);
  } catch {
    notFound();
  }

  const profiles = await getAllCreatorProfiles(supabase);
  const ranked = await rankCreatorsForBrief(brief, profiles);

  // Attach creator details
  const matches = ranked.map((m) => ({
    ...m,
    creator: profiles.find((p) => p.creator.id === m.creator_id),
  }));

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <Nav><Link href="/brief/new" className="hidden text-sm text-gray-300 hover:text-white sm:block">New Brief</Link></Nav>

      <section className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        {/* Brief summary */}
        <div className="glass rounded-2xl p-5 mb-8">
          <div className="text-xs text-gray-500 mb-2">Your Brief</div>
          <div className="text-white mb-3">{brief.raw_input}</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
              {brief.content_type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
              {brief.aspect_ratio}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
              {brief.platform}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-xs text-purple-300">
              {brief.style}
            </span>
          </div>
        </div>

        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {matches.length} Matches Found
            </h1>
            <p className="text-gray-500 text-sm">
              Ranked by 7-dimension hybrid scoring
            </p>
          </div>
        </div>

        {/* Matches list */}
        <div className="space-y-4">
          {matches.map((match, i) => {
            const profile = match.creator;
            if (!profile) return null;
            const score = Math.round(match.scores.total_score * 100);

            return (
              <Link
                key={match.creator_id}
                href={`/creator/${match.creator_id}`}
                className="glass rounded-2xl p-5 glass-hover block"
              >
                <div className="flex items-start gap-5">
                  {/* Rank + Avatar */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl font-bold gradient-text">
                      #{i + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {profile.creator.display_name.charAt(0)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {profile.creator.display_name}
                          </h3>
                          {profile.verified_badge && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-xs text-green-400 border border-green-500/30">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {profile.creator.location} ·{" "}
                          {profile.creator.years_experience}y experience · $
                          {profile.creator.hourly_rate}/hr
                        </p>
                      </div>

                      {/* Match Score */}
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold gradient-text">
                          {score}%
                        </div>
                        <div className="text-xs text-gray-500">match</div>
                      </div>
                    </div>

                    {/* Explanation bullets */}
                    <div className="space-y-1.5 mb-4">
                      {match.explanation.bullets.slice(0, 3).map((bullet, j) => (
                        <div
                          key={j}
                          className="flex gap-2 text-sm text-gray-300"
                        >
                          <span className="text-green-400 shrink-0">✓</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Score breakdown bars */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5">
                      {[
                        { label: "Skills", value: match.scores.skill_score },
                        { label: "Tools", value: match.scores.tool_score },
                        { label: "Spec", value: match.scores.specialization_score },
                        { label: "Style", value: match.scores.style_score },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="text-xs text-gray-500 mb-1">
                            {item.label}
                          </div>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{
                                width: `${Math.round(item.value * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}