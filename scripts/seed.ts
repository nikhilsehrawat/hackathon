/**
 * scripts/seed.ts — CLI entry: `npm run seed`
 * Loads .env.local manually (Next only auto-loads for the framework), then runs
 * the shared idempotent seed runner against Supabase.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runSeed } from "./seedRunner";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getScriptClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("🌱 Seeding CreatorIQ demo data (15 creators, 5 briefs)…");
  const supabase = getScriptClient();
  const result = await runSeed(supabase);
  console.log(
    `✅ Seed complete: ${result.inserted} rows inserted (${result.creators} creators, ${result.briefs} briefs).`,
  );
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
