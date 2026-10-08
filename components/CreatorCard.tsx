import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBar } from "@/components/ScoreBar";
import { ShortlistButton } from "@/components/ShortlistButton";
import { MATCH_WEIGHTS } from "@/lib/matching/weights";
import type { CreatorMatch, ExplanationPayload } from "@/lib/types";
import { initials, pct } from "@/lib/utils/cn";
import { ShieldCheck, MapPin } from "lucide-react";

interface Props {
  match: Pick<
    CreatorMatch,
    | "id"
    | "creator_id"
    | "total_score"
    | "skill_score"
    | "tool_score"
    | "specialization_score"
    | "content_type_score"
    | "style_score"
    | "rights_score"
    | "portfolio_score"
    | "explanation"
  >;
  briefId: string;
  name: string;
  bio: string;
  location: string;
  hourlyRate: number;
  availability: string;
  verifiedBadge: boolean;
  tools: string[];
  profileHref: string;
}

export function CreatorCard(props: Props) {
  const explanation = props.match.explanation as ExplanationPayload | null;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {initials(props.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{props.name}</h3>
                {props.verifiedBadge && (
                  <Badge variant="verified" className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified AI Creator
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{props.bio}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {props.location} · ${props.hourlyRate}/hr ·{" "}
                {props.availability}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums text-emerald-600">
              {pct(Number(props.match.total_score))}
            </div>
            <div className="text-xs text-muted-foreground">match</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <ScoreBar label="Skills" value={Number(props.match.skill_score)} weight={MATCH_WEIGHTS.skill} />
          <ScoreBar label="Tools" value={Number(props.match.tool_score)} weight={MATCH_WEIGHTS.tool} />
          <ScoreBar label="Specialization" value={Number(props.match.specialization_score)} weight={MATCH_WEIGHTS.specialization} />
          <ScoreBar label="Content type" value={Number(props.match.content_type_score)} weight={MATCH_WEIGHTS.content_type} />
          <ScoreBar label="Style similarity" value={Number(props.match.style_score)} weight={MATCH_WEIGHTS.style} />
          <ScoreBar label="Commercial rights" value={Number(props.match.rights_score)} weight={MATCH_WEIGHTS.rights} />
          <ScoreBar label="Portfolio fit" value={Number(props.match.portfolio_score)} weight={MATCH_WEIGHTS.portfolio} />
        </div>

        {explanation && explanation.bullets.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why this match
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {explanation.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {props.tools.slice(0, 6).map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <a
            href={props.profileHref}
            className="inline-flex h-9 items-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent"
          >
            View portfolio
          </a>
          <ShortlistButton
            matchId={props.match.id}
            creatorId={props.match.creator_id}
            briefId={props.briefId}
          />
        </div>
      </CardContent>
    </Card>
  );
}
