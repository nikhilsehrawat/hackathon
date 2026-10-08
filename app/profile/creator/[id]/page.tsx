import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Nav from "@/components/layout/Nav";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AvatarUpload from "@/components/profile/AvatarUpload";
import CreatorProfileEditor from "@/components/profile/CreatorProfileEditor";
import SkillsEditor from "@/components/profile/SkillsEditor";
import ToolsEditor from "@/components/profile/ToolsEditor";
import PortfolioEditor from "@/components/profile/PortfolioEditor";
import { toHttpUrl } from "@/lib/profile/urls";
import { getSupabaseAdmin, getCreatorProfile } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const instant = false;

/**
 * Renders an editable owner view or a public creator profile.
 */
export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  const admin = getSupabaseAdmin();
  const { data: account, error: accountError } = await admin
    .from("users").select("role").eq("id", id).maybeSingle();
  if (accountError) throw accountError;
  if (account?.role !== "creator") notFound();

  const own = user?.id === id;
  let data: Awaited<ReturnType<typeof getCreatorProfile>>;
  try {
    data = await getCreatorProfile(admin, id);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Creator not found:")) notFound();
    throw error;
  }

  const { data: creator, error: creatorError } = await admin
    .from("creators").select("*").eq("id", id).single();
  if (creatorError) throw creatorError;
  const { data: specializations, error: specializationError } = await admin
    .from("creator_specializations").select("*").eq("creator_id", id);
  if (specializationError) throw specializationError;
  const { data: portfolios, error: portfolioError } = await admin
    .from("creator_portfolios").select("*").eq("creator_id", id).order("created_at", { ascending: false });
  if (portfolioError) throw portfolioError;

  return (
    <main className="min-h-screen">
      <Nav>
        <Link href="/creators" className="hidden text-sm text-gray-300 hover:text-white sm:block">All creators</Link>
      </Nav>
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-8">
        <ProfileHeader
          avatar_url={creator.avatar_url ?? null}
          name={creator.display_name}
          tagline={creator.tagline ?? null}
          role="creator"
          verified={data.verified_badge}
          editable={own}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {own && (
              <>
                <div className="glass flex flex-col items-center gap-4 rounded-2xl p-5 sm:flex-row">
                  <AvatarUpload currentUrl={creator.avatar_url ?? null} fallback={creator.display_name.charAt(0).toUpperCase()} label="Upload avatar" />
                  <p className="text-sm text-gray-400">A clear profile image helps brands put a face to your work.</p>
                </div>
                <CreatorProfileEditor profile={{
                  display_name: creator.display_name ?? "",
                  tagline: creator.tagline ?? "",
                  bio: creator.bio ?? "",
                  location: creator.location ?? "",
                  years_experience: creator.years_experience ?? 0,
                  hourly_rate: Number(creator.hourly_rate ?? 0),
                  availability: creator.availability ?? "",
                  website: creator.website ?? "",
                  twitter: creator.twitter ?? "",
                  linkedin: creator.linkedin ?? "",
                  portfolio_link: creator.portfolio_link ?? "",
                }} />
              </>
            )}
            <section className="glass rounded-2xl p-6">
              <h2 className="mb-3 text-lg font-semibold text-white">About</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">{creator.bio || "This creator hasn’t added a bio yet."}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-400">
                {creator.location && <span>{creator.location}</span>}
                <span>{creator.years_experience ?? 0} years experience</span>
                <span>${Number(creator.hourly_rate ?? 0)}/hr</span>
                <span>{creator.availability ?? "Availability not set"}</span>
              </div>
            </section>
            {own ? (
              <PortfolioEditor initialItems={portfolios.map((item) => ({
                id: item.id,
                title: item.title,
                media_url: item.media_url,
                media_type: item.media_type,
                description: item.description,
              }))} />
            ) : (
              <section className="glass rounded-2xl p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Portfolio</h2>
                {portfolios.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolios.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-purple-400/30">
                      {toHttpUrl(item.media_url) ? (
                        <a href={toHttpUrl(item.media_url)!} target="_blank" rel="noreferrer" className="font-medium text-white">{item.title}</a>
                      ) : <h3 className="font-medium text-white">{item.title}</h3>}
                      <p className="mt-1 line-clamp-2 text-sm text-gray-400">{item.description || item.media_type}</p>
                    </div>
                  ))}
                </div>
                ) : <p className="text-sm text-gray-500">No portfolio pieces have been shared yet.</p>}
              </section>
            )}
            <section className="glass rounded-2xl p-6">
              <h2 className="mb-3 text-lg font-semibold text-white">Links</h2>
              <div className="flex flex-wrap gap-4 text-sm text-purple-300">
                {[
                  ["Website", creator.website],
                  ["Twitter", creator.twitter],
                  ["LinkedIn", creator.linkedin],
                  ["Portfolio", creator.portfolio_link],
                ].filter(([, url]) => toHttpUrl(url)).map(([label, url]) => (
                  <a key={label as string} href={toHttpUrl(url)!} target="_blank" rel="noreferrer" className="hover:text-purple-200">{label}</a>
                ))}
                {![creator.website, creator.twitter, creator.linkedin, creator.portfolio_link].some(Boolean) && <span className="text-gray-500">No links added.</span>}
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            {own ? (
              <>
                <SkillsEditor initialSkills={data.skills.map(({ id: skillId, skill, proficiency }) => ({ id: skillId, skill, proficiency }))} />
                <ToolsEditor initialTools={data.tools.map(({ id: toolId, tool, proficiency, verified }) => ({ id: toolId, tool, proficiency, verified }))} />
              </>
            ) : (
              <>
                <section className="glass rounded-2xl p-5">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Skills</h2>
                  {data.skills.length ? data.skills.map((item) => <div key={item.id} className="mb-2 flex justify-between text-sm"><span className="text-white">{item.skill}</span><span className="text-purple-300">{item.proficiency}/5</span></div>) : <p className="text-sm text-gray-500">No skills listed.</p>}
                </section>
                <section className="glass rounded-2xl p-5">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Tools & models</h2>
                  {data.tools.length ? data.tools.map((item) => <div key={item.id} className="mb-2 flex justify-between text-sm"><span className="text-white">{item.verified && "✓ "}{item.tool}</span><span className="text-gray-400">{item.proficiency}/5</span></div>) : <p className="text-sm text-gray-500">No tools listed.</p>}
                </section>
              </>
            )}
            <section className="glass rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {specializations.length ? specializations.map((item) => <span key={item.id} className="rounded-full bg-purple-500/15 px-3 py-1 text-xs text-purple-300">{item.specialization}</span>) : <p className="text-sm text-gray-500">No specializations listed.</p>}
              </div>
            </section>
            <section className="glass rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Verification</h2>
              {data.signals.length ? data.signals.map((signal) => <div key={signal.id} className="mb-2 text-sm text-gray-300"><span className="mr-2 text-green-400">{signal.verified ? "✓" : "•"}</span><span className="capitalize">{signal.signal_type}</span></div>) : <p className="text-sm text-gray-500">No verification signals yet.</p>}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
