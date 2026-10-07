/**
 * app/(creator)/dashboard/page.tsx — Creator home: profile completeness,
 * verification status and a showcase of creators + demo profiles.
 */
import Link from "next/link";
import { Sparkles, ShieldCheck, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEED_CREATORS } from "@/scripts/seedData";

export const dynamic = "force-dynamic";

const CHECKLIST = [
  { label: "Bio & location", done: true },
  { label: "5+ skills with proficiency", done: true },
  { label: "AI tool stack declared", done: true },
  { label: "2+ portfolio pieces with metadata", done: true },
  { label: "Commercial rights track record", done: true },
  { label: "Verification signals (3+)", done: true },
];

export default function CreatorDashboardPage() {
  const complete = Math.round((CHECKLIST.filter((c) => c.done).length / CHECKLIST.length) * 100);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            PromptFolio <span className="text-sm font-normal text-muted-foreground">· Creator</span>
          </Link>
          <Link href="/creator/profile/setup">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Set up my profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-3">
        {/* Completeness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile completeness</CardTitle>
            <CardDescription>{complete}% — top 10% of creator profiles get matched first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHECKLIST.map((item) => (
              <label key={item.label} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={item.done} readOnly className="h-4 w-4 accent-emerald-600" />
                {item.label}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Verification status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> Verification status
            </CardTitle>
            <CardDescription>Self-declared + evidence-backed. Not legal or identity verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(["tool", "workflow", "portfolio", "rights"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between rounded-lg border p-3 capitalize">
                {s} signal
                <Badge variant="success">Declared + evidence</Badge>
              </div>
            ))}
            <Badge variant="verified" className="mt-2 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified AI Creator (4/4 signals)
            </Badge>
          </CardContent>
        </Card>

        {/* Matched briefs teaser */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Briefs matching your profile</CardTitle>
            <CardDescription>Live campaigns ranked against your skills, tools and portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { company: "Volt Sneakers", blurb: "Cinematic 30s Instagram ad · 9:16", href: "/brief/demo/matches" },
              { company: "GlowLab Skincare", blurb: "UGC TikTok serum launch · voiceovers", href: "/brief/demo-ugc/matches" },
              { company: "Aurora Motors", blurb: "60s EV hero film · YouTube 16:9", href: "/brief/demo-ev/matches" },
            ].map((b) => (
              <Link
                key={b.company}
                href={b.href}
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <span>
                  <span className="font-medium">{b.company}</span>
                  <span className="block text-xs text-muted-foreground">{b.blurb}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Creator directory (demo profiles) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Creator directory</CardTitle>
            <CardDescription>Browse seeded creator profiles (demo data mirrors the Supabase seed).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SEED_CREATORS.map((c, i) => (
              <Link
                key={c.email}
                href={`/creator/${i}`}
                className="rounded-lg border p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.display_name}</span>
                  {c.signals.length >= 3 && (
                    <Badge variant="verified" className="gap-1 text-[10px]">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.bio}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.location} · ${c.hourly_rate}/hr · {c.availability}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
