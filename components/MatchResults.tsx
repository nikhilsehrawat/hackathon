"use client";

/**
 * components/MatchResults.tsx — Client island for the matches page.
 * Filter bar (verified-only / min score), ranked CreatorCards, and an
 * "Explain with AI" action that re-polishes bullets via POST /api/explain.
 */
import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Brief, CreatorMatch, CreatorProfile } from "@/lib/types";

interface Props {
  brief: Brief;
  matches: CreatorMatch[];
  profilesById: Record<string, CreatorProfile>;
}

export function MatchResults({ brief, matches, profilesById }: Props) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [bullets, setBullets] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      matches.filter((m) => {
        if (Number(m.total_score) < minScore) return false;
        if (verifiedOnly && !profilesById[m.creator_id]?.verified_badge) return false;
        return true;
      }),
    [matches, minScore, verifiedOnly, profilesById],
  );

  async function explain(match: CreatorMatch): Promise<void> {
    setRefreshingId(match.id);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match.id }),
      });
      if (!res.ok) throw new Error("Explanation service unavailable");
      const data = (await res.json()) as { bullets: string[] };
      setBullets((prev) => ({ ...prev, [match.id]: data.bullets }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to explain match.");
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Verified AI Creators only
          </label>
          <label className="flex items-center gap-3">
            Min match score
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={Math.round(minScore * 100)}
              onChange={(e) => setMinScore(Number(e.target.value) / 100)}
              className="w-40 accent-emerald-600"
            />
            <Badge variant="secondary">{Math.round(minScore * 100)}%+</Badge>
          </label>
          <span className="ml-auto text-xs text-muted-foreground">
            {visible.length} of {matches.length} creators · weights: skills ×20 · tools ×20 · spec
            ×15 · content ×15 · style ×10 · rights ×10 · portfolio ×10
          </span>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {visible.map((m, rank) => {
        const profile = profilesById[m.creator_id];
        if (!profile) return null;
        const override = bullets[m.id];
        const shown: CreatorMatch = override
          ? { ...m, explanation: { ...(m.explanation ?? ({} as never)), bullets: override } as never }
          : m;
        return (
          <div key={m.id} className="relative">
            <div className="absolute -left-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
              {rank + 1}
            </div>
            <CreatorCard
              match={{ ...shown, id: m.id }}
              name={profile.creator.display_name}
              bio={profile.creator.bio}
              location={profile.creator.location}
              hourlyRate={Number(profile.creator.hourly_rate)}
              availability={profile.creator.availability}
              verifiedBadge={profile.verified_badge}
              tools={profile.tools.map((t) => t.tool)}
              briefId={brief.id}
              profileHref={`/creator/${profile.creator.id}`}
            />
            <button
              onClick={() => explain(m)}
              disabled={refreshingId === m.id}
              className="mt-2 ml-1 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
            >
              {refreshingId === m.id ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> GPT-4o is rewriting the
                  explanation…
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" /> {override ? "Re-explain with AI" : "Explain this match with AI"}
                </>
              )}
            </button>
          </div>
        );
      })}

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No creators pass the current filters — lower the minimum score.
        </p>
      )}
    </div>
  );
}
