import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Nav from "@/components/layout/Nav";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AvatarUpload from "@/components/profile/AvatarUpload";
import BrandProfileEditor from "@/components/profile/BrandProfileEditor";
import { getSupabaseAdmin } from "@/lib/db/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toHttpUrl } from "@/lib/profile/urls";


function companyDomain(website: string | null) {
  if (!website) return null;
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Renders an editable owner view or a public brand profile.
 */
export default async function BrandProfilePage({
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
    .from("users").select("role, email").eq("id", id).maybeSingle();
  if (accountError) throw accountError;
  if (account?.role !== "brand") notFound();
  const own = user?.id === id;
  const { data: brand, error: brandError } = await admin.from("brands").select("*").eq("id", id).single();
  if (brandError?.code === "PGRST116") notFound();
  if (brandError) throw brandError;
  const { data: briefs, error: briefsError } = await admin.from("briefs").select("id, raw_input, content_type, platform, created_at").eq("brand_id", id).order("created_at", { ascending: false }).limit(6);
  if (briefsError) throw briefsError;

  const websiteUrl = toHttpUrl(brand.website);
  const websiteDomain = websiteUrl ? companyDomain(websiteUrl) : null;
  const emailDomain = account.email?.split("@")[1]?.toLowerCase();
  const domainsMatch = Boolean(
    websiteDomain &&
    emailDomain &&
    (websiteDomain === emailDomain ||
      websiteDomain.endsWith(`.${emailDomain}`) ||
      emailDomain.endsWith(`.${websiteDomain}`)),
  );
  const verified = Boolean(brand.website_verified || domainsMatch);

  return (
    <main className="min-h-screen">
      <Nav><Link href="/creators" className="hidden text-sm text-gray-300 hover:text-white sm:block">Discover creators</Link></Nav>
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-8">
        <ProfileHeader avatar_url={brand.logo_url ?? null} name={brand.company_name} tagline={brand.tagline ?? null} role="brand" verified={verified} editable={own} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {own && (
              <>
                <div className="glass flex flex-col items-center gap-4 rounded-2xl p-5 sm:flex-row">
                  <AvatarUpload currentUrl={brand.logo_url ?? null} fallback={brand.company_name.charAt(0).toUpperCase()} label="Upload company logo" />
                  <p className="text-sm text-gray-400">Upload a clear logo to help creators recognize your company.</p>
                </div>
                <BrandProfileEditor profile={{
                  company_name: brand.company_name ?? "",
                  tagline: brand.tagline ?? "",
                  description: brand.description ?? "",
                  industry: brand.industry ?? "",
                  website: brand.website ?? "",
                  contact_name: brand.contact_name ?? "",
                  contact_email: brand.contact_email ?? "",
                  contact_phone: brand.contact_phone ?? "",
                  linkedin: brand.linkedin ?? "",
                  twitter: brand.twitter ?? "",
                }} />
              </>
            )}
            <section className="glass rounded-2xl p-6">
              <h2 className="mb-3 text-lg font-semibold text-white">About {brand.company_name}</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">{brand.description || "This company hasn’t added a description yet."}</p>
              {brand.industry && <p className="mt-4 text-sm text-gray-400">Industry · {brand.industry}</p>}
              {websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200">Company website {verified && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">✓ Verified</span>}</a>}
            </section>
            <section className="glass rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Recent briefs</h2>
              {briefs.length ? <div className="space-y-3">{briefs.map((brief) => <Link key={brief.id} href={`/brief/${brief.id}/matches`} className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-purple-400/30"><p className="line-clamp-2 text-sm text-white">{brief.raw_input || "Campaign brief"}</p><p className="mt-2 text-xs text-gray-500">{brief.content_type} · {brief.platform}</p></Link>)}</div> : <p className="text-sm text-gray-500">No briefs posted yet.</p>}
            </section>
          </div>
          <aside className="space-y-6">
            <section className="glass rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Contact</h2>
              <div className="space-y-2 text-sm text-gray-300">
                {brand.contact_name && <p>{brand.contact_name}</p>}
                {brand.contact_email && <a className="block text-purple-300" href={`mailto:${brand.contact_email}`}>{brand.contact_email}</a>}
                {brand.contact_phone && <p>{brand.contact_phone}</p>}
                {!brand.contact_name && !brand.contact_email && !brand.contact_phone && <p className="text-gray-500">Contact details not shared.</p>}
              </div>
            </section>
            <section className="glass rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Social</h2>
              <div className="space-y-2 text-sm">
                {toHttpUrl(brand.linkedin) && <a className="block text-purple-300" href={toHttpUrl(brand.linkedin)!} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                {brand.twitter && <a className="block text-purple-300" href={`https://x.com/${encodeURIComponent(brand.twitter.replace(/^@/, ""))}`} target="_blank" rel="noreferrer">Twitter / X ↗</a>}
                {!brand.linkedin && !brand.twitter && <p className="text-gray-500">No social links added.</p>}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
