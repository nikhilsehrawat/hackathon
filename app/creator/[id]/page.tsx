import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin, getCreatorProfile } from "@/lib/db/client";
import Nav from "@/components/layout/Nav";

export const instant = false;

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let profile;
  try {
    profile = await getCreatorProfile(supabase, id);
  } catch {
    notFound();
  }

  const c = profile.creator;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

      <Nav><Link href="/creators" className="hidden text-sm text-gray-300 hover:text-white sm:block">← All Creators</Link></Nav>

      <section className="relative z-10 max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="glass rounded-3xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shrink-0">
              {c.display_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {c.display_name}
                </h1>
                {profile.verified_badge && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-sm text-green-400 border border-green-500/30">
                    ✓ Verified AI Creator
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-4">{c.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>📍 {c.location}</span>
                <span>💼 {c.years_experience}y experience</span>
                <span>💰 ${c.hourly_rate}/hr</span>
                <span>🟢 {c.availability}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Skills */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Skills
            </h2>
            <div className="space-y-2">
              {profile.skills.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-sm text-white">{s.skill}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < s.proficiency
                            ? "bg-purple-400"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Tools & Models
            </h2>
            <div className="space-y-2">
              {profile.tools.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-sm text-white flex items-center gap-2">
                    {t.verified && <span className="text-green-400">✓</span>}
                    {t.tool}
                  </span>
                  <span className="text-xs text-gray-500">{t.proficiency}/5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Verification
            </h2>
            <div className="space-y-2">
              {profile.signals.length === 0 && (
                <p className="text-sm text-gray-500">No signals yet</p>
              )}
              {profile.signals.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center gap-2 text-sm text-white"
                >
                  <span className="text-green-400">✓</span>
                  <span className="capitalize">{sig.signal_type}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Specializations
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((spec) => (
              <span
                key={spec.id}
                className="px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 text-sm border border-purple-500/20"
              >
                {spec.specialization}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Portfolio ({profile.portfolios.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {profile.portfolios.map((p) => (
              <div
                key={p.id}
                className="rounded-xl overflow-hidden bg-black/40 border border-white/5"
              >
                <div
                  className="h-40 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${p.thumbnail_url})`,
                  }}
                />
                <div className="p-4">
                  <h3 className="text-white font-medium mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {p.description}
                  </p>
                  {p.metadata && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
                        {p.metadata.content_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
                        {p.metadata.aspect_ratio}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-xs text-purple-300">
                        {p.metadata.style}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-3">
            Ready to work with {c.display_name.split(" ")[0]}?
          </h2>
          <Link
            href="/brief/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition glow-hover"
          >
            Create a Brief →
          </Link>
        </div>
      </section>
    </main>
  );
}