/**
 * lib/db/client.ts — Supabase client factory + typed data helpers.
 *
 * Runtime data access uses the Supabase JS client (service-role on the server).
 * All helpers are idempotent-safe and return typed domain objects from lib/types.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Brief,
  CreatorProfile,
  CreatorMatch,
  PortfolioMetadata,
} from "../types";
import { TABLES } from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let cached: SupabaseClient | null = null;

/** Server-side Supabase client using the service role key. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Browser-capable anon client (magic-link auth). */
export function getSupabaseAnon(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key);
}

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

async function rows<T>(promise: { data: T[] | null; error: unknown }): Promise<T[]> {
  const res = await promise;
  if (res.error) throw res.error;
  return res.data ?? [];
}

/** Load a full creator profile (skills/tools/specs/portfolio+meta/signals). */
export async function getCreatorProfile(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<CreatorProfile> {
  const [creatorRows, skillRows, toolRows, specRows, portfolioRows, signalRows] =
    await Promise.all([
      rows(supabase.from(TABLES.creators).select("*").eq("id", creatorId)),
      rows(supabase.from(TABLES.creatorSkills).select("*").eq("creator_id", creatorId)),
      rows(supabase.from(TABLES.creatorTools).select("*").eq("creator_id", creatorId)),
      rows(
        supabase.from(TABLES.creatorSpecializations).select("*").eq("creator_id", creatorId),
      ),
      rows(
        supabase
          .from(TABLES.creatorPortfolios)
          .select("*, portfolio_metadata(*)")
          .eq("creator_id", creatorId),
      ),
      rows(
        supabase.from(TABLES.verificationSignals).select("*").eq("creator_id", creatorId),
      ),
    ]);

  const creator = (creatorRows as Array<Record<string, unknown>>)[0];
  if (!creator) throw new Error(`Creator not found: ${creatorId}`);

  const portfolios = (portfolioRows as Array<Record<string, unknown>>).map((p) => {
    const meta = (p.portfolio_metadata as PortfolioMetadata[] | null) ?? null;
    const { portfolio_metadata: _drop, ...rest } = p;
    return { ...rest, metadata: meta?.[0] ?? null } as CreatorProfile["portfolios"][number];
  });

  const signals = signalRows as CreatorProfile["signals"];
  return {
    creator: creator as unknown as CreatorProfile["creator"],
    skills: skillRows as CreatorProfile["skills"],
    tools: toolRows as CreatorProfile["tools"],
    specializations: specRows as CreatorProfile["specializations"],
    portfolios,
    signals,
    verified_badge: signals.filter((s) => s.signal_type).length >= 3,
  };
}

/** Load all creator profiles for the matching engine. */
export async function getAllCreatorProfiles(
  supabase: SupabaseClient,
): Promise<CreatorProfile[]> {
  const creators = await rows<{ id: string }>(
    supabase.from(TABLES.creators).select("id"),
  );
  return Promise.all(creators.map((c) => getCreatorProfile(supabase, c.id)));
}

export async function getBriefById(
  supabase: SupabaseClient,
  briefId: string,
): Promise<Brief> {
  const res = await supabase.from(TABLES.briefs).select("*").eq("id", briefId).single();
  if (res.error) throw res.error;
  return res.data as unknown as Brief;
}

export async function insertMatches(
  supabase: SupabaseClient,
  briefId: string,
  matches: Array<Omit<CreatorMatch, "id" | "created_at" | "brief_id">>,
): Promise<CreatorMatch[]> {
  // Replace previous matches for this brief (re-run safe).
  await supabase.from(TABLES.creatorMatches).delete().eq("brief_id", briefId);

  const payload = matches.map((m) => ({ ...m, brief_id: briefId }));
  const inserted = await rows<CreatorMatch>(
    supabase.from(TABLES.creatorMatches).insert(payload).select("*"),
  );
  return inserted.sort((a, b) => Number(b.total_score) - Number(a.total_score));
}

export async function getMatchesForBrief(
  supabase: SupabaseClient,
  briefId: string,
): Promise<CreatorMatch[]> {
  const res = await supabase
    .from(TABLES.creatorMatches)
    .select("*")
    .eq("brief_id", briefId)
    .order("total_score", { ascending: false });
  if (res.error) throw res.error;
  return (res.data ?? []) as unknown as CreatorMatch[];
}

export async function upsertBrief(
  supabase: SupabaseClient,
  brief: Partial<Brief> & { brand_id: string; raw_input: string },
): Promise<Brief> {
  const res = await supabase
    .from(TABLES.briefs)
    .insert({ status: "ready", ...brief })
    .select("*")
    .single();
  if (res.error) throw res.error;
  return res.data as unknown as Brief;
}

export async function setBriefStatus(
  supabase: SupabaseClient,
  briefId: string,
  status: Brief["status"],
): Promise<void> {
  const res = await supabase.from(TABLES.briefs).update({ status }).eq("id", briefId);
  if (res.error) throw res.error;
}
