/**
 * scripts/migrate.ts — CLI entry: `npm run migrate`
 *
 * Strategy for the 24-hour MVP: Supabase's JS client cannot execute raw DDL,
 * so this script prints the canonical schema (single source of truth lives in
 * lib/db/schema.ts) ready to paste into Supabase → SQL Editor. It also runs a
 * lightweight connectivity check when credentials are present.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SQL_DDL } from "../lib/db/schema";

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

async function checkConnection(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping connectivity check.)");
    return;
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const res = await supabase.from("users").select("id").limit(1);
    if (res.error && /relation .* does not exist|Could not find the table/i.test(res.error.message)) {
      console.log("⚠️  Schema not applied yet. Run the SQL below in Supabase → SQL Editor, then `npm run seed`.");
    } else if (res.error) {
      console.log("⚠️  Connected, but query returned an error:", res.error.message);
    } else {
      console.log("✅ Connected to Supabase and the schema is already in place.");
    }
  } catch (err) {
    console.log("⚠️  Could not reach Supabase:", String(err));
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  await checkConnection();
  console.log("\n----- SCHEMA SQL (copy into Supabase → SQL Editor) -----\n");
  console.log(SQL_DDL);
  console.log("----------------------------------------------------------\n");
  console.log("Next steps: 1) apply SQL above  2) npm run seed  3) npm run dev");
}

main().catch((err) => {
  console.error("❌ Migration helper failed:", err);
  process.exit(1);
});
