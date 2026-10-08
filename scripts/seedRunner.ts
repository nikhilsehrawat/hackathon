/**
 * scripts/seedRunner.ts — Idempotent seeding logic shared by the CLI
 * (scripts/seed.ts) and POST /api/seed. Inserts 15 creators + 5 briefs with
 * skills, tools, specializations, portfolios (+ embeddings) and verification
 * signals via the Supabase service-role client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText, styleEmbeddingText } from "../lib/ai/embeddings";
import { TABLES } from "../lib/db/schema";
import { SEED_BRIEFS, SEED_CREATORS, deterministicId } from "./seedData";

interface SeedResult {
  inserted: number;
  creators: number;
  briefs: number;
}

async function exists(supabase: SupabaseClient, table: string, id: string): Promise<boolean> {
  const res = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  return res.data !== null;
}

export async function runSeed(supabase: SupabaseClient): Promise<SeedResult> {
  let inserted = 0;

  /* ---------- Creators ---------- */
  for (let i = 0; i < SEED_CREATORS.length; i++) {
    const c = SEED_CREATORS[i];
    const userId = deterministicId("user-creator", i);
    if (await exists(supabase, TABLES.users, userId)) continue;

    // Upsert user
    const userRes = await supabase.from(TABLES.users).upsert(
      {
        id: userId,
        email: c.email,
        role: "creator",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (userRes.error) throw userRes.error;
    inserted++;

    // Upsert creator
    const creatorRes = await supabase.from(TABLES.creators).upsert(
      {
        id: userId,
        display_name: c.display_name,
        bio: c.bio,
        location: c.location,
        years_experience: c.years_experience,
        hourly_rate: c.hourly_rate,
        availability: c.availability,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (creatorRes.error) throw creatorRes.error;
    inserted++;

    const skillRows = c.skills.map(([skill, proficiency], k) => ({
      id: deterministicId(`skill-${i}`, k),
      creator_id: userId,
      skill,
      proficiency,
    }));
    const toolRows = c.tools.map(([tool, proficiency, verified], k) => ({
      id: deterministicId(`tool-${i}`, k),
      creator_id: userId,
      tool,
      proficiency,
      verified,
    }));
    const specRows = c.specializations.map((specialization, k) => ({
      id: deterministicId(`spec-${i}`, k),
      creator_id: userId,
      specialization,
    }));
    const signalRows = c.signals.map((signal_type, k) => ({
      id: deterministicId(`sig-${i}`, k),
      creator_id: userId,
      signal_type,
      evidence_url: `https://verify.promptfolio.demo/${c.email.split("@")[0]}/${signal_type}`,
      verified: true,
    }));

    for (const [table, rows] of [
      [TABLES.creatorSkills, skillRows],
      [TABLES.creatorTools, toolRows],
      [TABLES.creatorSpecializations, specRows],
      [TABLES.verificationSignals, signalRows],
    ] as const) {
      const res = await supabase
        .from(table)
        .upsert(rows as Record<string, unknown>[], { onConflict: "id", ignoreDuplicates: true });
      if (res.error) throw res.error;
      inserted += rows.length;
    }

    /* Portfolios + metadata with embeddings */
    for (let p = 0; p < c.portfolios.length; p++) {
      const pf = c.portfolios[p];
      const portfolioId = deterministicId(`portfolio-${i}`, p);
      const pfRes = await supabase.from(TABLES.creatorPortfolios).upsert(
        {
          id: portfolioId,
          creator_id: userId,
          title: pf.title,
          media_url: "#demo",
          media_type: pf.media_type,
          thumbnail_url: `https://picsum.photos/seed/${encodeURIComponent(pf.title)}/640/360`,
          description: pf.description,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (pfRes.error) throw pfRes.error;
      inserted++;

      const embedding = await embedText(
        styleEmbeddingText(pf.style, `${pf.content_type} ${pf.workflow_notes}`),
      );
      const metaRes = await supabase.from(TABLES.portfolioMetadata).upsert(
        {
          id: deterministicId(`pmeta-${i}`, p),
          portfolio_id: portfolioId,
          content_type: pf.content_type,
          style: pf.style,
          tools: pf.tools,
          industry: pf.industry,
          aspect_ratio: pf.aspect_ratio,
          duration_seconds: pf.duration_seconds,
          commercial_use: pf.commercial_use,
          workflow_notes: pf.workflow_notes,
          embedding,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (metaRes.error) throw metaRes.error;
      inserted++;
    }
  }

  /* ---------- Brands + briefs ---------- */
  for (let b = 0; b < SEED_BRIEFS.length; b++) {
    const bf = SEED_BRIEFS[b];
    const brandUserId = deterministicId("user-brand", b);
    if (await exists(supabase, TABLES.briefs, deterministicId("brief", b))) continue;

    const userRes = await supabase.from(TABLES.users).upsert(
      {
        id: brandUserId,
        email: `brand${b}@promptfolio.demo`,
        role: "brand",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (userRes.error) throw userRes.error;
    inserted++;

    const brandRes = await supabase.from(TABLES.brands).upsert(
      {
        id: brandUserId,
        company_name: bf.company,
        industry: "Consumer",
        website: `https://${bf.company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`,
      },
      { onConflict: "id", },
    );
    if (brandRes.error) throw brandRes.error;
    inserted++;

    const { company: _company, ...briefFields } = bf;
    const briefRes = await supabase.from(TABLES.briefs).upsert(
      {
        id: deterministicId("brief", b),
        brand_id: brandUserId,
        status: "ready",
        ...briefFields,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (briefRes.error) throw briefRes.error;
    inserted++;
  }

  return { inserted, creators: SEED_CREATORS.length, briefs: SEED_BRIEFS.length };
}