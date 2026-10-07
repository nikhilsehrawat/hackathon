/**
 * app/(brand)/dashboard/page.tsx — Brand dashboard: list of briefs with
 * quick actions. Loads from Supabase when configured; otherwise falls back
 * to the 5 seeded demo briefs so the demo flow always works.
 */
import Link from "next/link";
import { Sparkles, FileText, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TABLES } from "@/lib/db/schema";
import type { Brief } from "@/lib/types";
import { getAllDemoBriefs } from "@/app/demoBrief";

export const dynamic = "force-dynamic";

async function loadBriefs(): Promise<Array<Brief & { company?: string }>> {
  try {
    const { getSupabaseAdmin } = await import("@/lib/db/client");
    const supabase = getSupabaseAdmin();
    const res = await supabase
      .from(TABLES.briefs)
      .select("*, brands(company_name)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (res.error) throw res.error;
    const rows = (res.data ?? []) as Array<Brief & { brands?: { company_name?: string } }>;
    if (rows.length === 0) return getAllDemoBriefs();
    return rows.map((r) => {
      const { brands: _b, ...rest } = r;
      return { ...rest, company: r.brands?.company_name };
    });
  } catch (err) {
    console.warn("[dashboard] Supabase unavailable, using demo briefs:", String(err));
    return getAllDemoBriefs();
  }
}

export default async function BrandDashboardPage() {
  const briefs = await loadBriefs();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            PromptFolio <span className="text-sm font-normal text-muted-foreground">· Brand</span>
          </Link>
          <Link href="/brief/new">
            <Button size="sm" className="gap-2">
              <Wand2 className="h-4 w-4" /> New AI brief
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Your campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe an idea once — PromptFolio structures the brief and ranks verified creators for it.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {briefs.map((b) => (
            <Card key={b.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      {b.company ? `${b.company} — ` : ""}
                      {b.campaign_objective || "Untitled brief"}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{b.raw_input}</CardDescription>
                  </div>
                  <Badge variant={b.status === "matched" ? "success" : "secondary"}>{b.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="outline">{b.content_type}</Badge>
                  <Badge variant="outline">{b.platform}</Badge>
                  <Badge variant="outline">{b.aspect_ratio}</Badge>
                  <Badge variant="outline">{b.duration}</Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/brief/${b.id}`}>
                    <Button variant="outline" size="sm">
                      View brief
                    </Button>
                  </Link>
                  <Link href={`/brief/${b.id}/matches`}>
                    <Button size="sm" className="gap-1.5">
                      Matches <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
