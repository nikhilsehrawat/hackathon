/**
 * lib/db/schema.ts — Drizzle-compatible table definitions (as plain metadata)
 * plus the canonical SQL DDL used by scripts/migrate.ts.
 *
 * We keep Drizzle out of the runtime bundle for the MVP (Supabase JS client is
 * the runtime data layer), but this file documents every table/column so the
 * types in lib/types.ts stay in sync with Postgres.
 */

export const SQL_DDL = `
-- PromptFolio schema (run via scripts/migrate.ts or paste into Supabase SQL editor)

create extension if not exists vector;
create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('brand','creator');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('brand','creator')),
  created_at timestamptz not null default now()
);

create table if not exists creators (
  id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  tagline text not null default '',
  bio text not null default '',
  location text not null default '',
  years_experience int not null default 0,
  hourly_rate numeric not null default 0,
  availability text not null default 'Unknown',
  created_at timestamptz not null default now(),
  avatar_url text,
  website text not null default '',
  twitter text not null default '',
  linkedin text not null default '',
  portfolio_link text not null default ''
);

create table if not exists brands (
  id uuid primary key references users(id) on delete cascade,
  company_name text not null,
  tagline text not null default '',
  description text not null default '',
  industry text not null default '',
  website text not null default '',
  logo_url text,
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  verified boolean not null default false,
  linkedin text not null default '',
  twitter text not null default '',
  website_verified boolean not null default false
);

alter table creators add column if not exists tagline text not null default '';
alter table creators add column if not exists avatar_url text;
alter table creators add column if not exists website text not null default '';
alter table creators add column if not exists twitter text not null default '';
alter table creators add column if not exists linkedin text not null default '';
alter table creators add column if not exists portfolio_link text not null default '';
alter table brands add column if not exists tagline text not null default '';
alter table brands add column if not exists description text not null default '';
alter table brands add column if not exists logo_url text;
alter table brands add column if not exists contact_name text not null default '';
alter table brands add column if not exists contact_email text not null default '';
alter table brands add column if not exists contact_phone text not null default '';
alter table brands add column if not exists verified boolean not null default false;
alter table brands add column if not exists linkedin text not null default '';
alter table brands add column if not exists twitter text not null default '';
alter table brands add column if not exists website_verified boolean not null default false;

create table if not exists creator_skills (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  skill text not null,
  proficiency int not null check (proficiency between 1 and 5)
);

create table if not exists creator_tools (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  tool text not null,
  proficiency int not null check (proficiency between 1 and 5),
  verified boolean not null default false
);

create table if not exists creator_specializations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  specialization text not null
);

create table if not exists creator_portfolios (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  title text not null,
  media_url text not null default '',
  media_type text not null check (media_type in ('image','video')),
  thumbnail_url text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists portfolio_metadata (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references creator_portfolios(id) on delete cascade,
  content_type text not null default '',
  style text not null default '',
  tools text[] not null default '{}',
  industry text not null default '',
  aspect_ratio text not null default '',
  duration_seconds int,
  commercial_use text not null default '',
  workflow_notes text not null default '',
  embedding vector(1536)
);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  raw_input text not null default '',
  campaign_objective text not null default '',
  content_type text not null default '',
  style text not null default '',
  duration text not null default '',
  platform text not null default '',
  aspect_ratio text not null default '',
  target_audience text not null default '',
  visual_direction text not null default '',
  required_tools text[] not null default '{}',
  commercial_usage text not null default '',
  deliverables text[] not null default '{}',
  constraints text[] not null default '{}',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists creator_matches (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  creator_id uuid not null references creators(id) on delete cascade,
  total_score numeric not null default 0,
  skill_score numeric not null default 0,
  tool_score numeric not null default 0,
  specialization_score numeric not null default 0,
  content_type_score numeric not null default 0,
  style_score numeric not null default 0,
  rights_score numeric not null default 0,
  portfolio_score numeric not null default 0,
  explanation jsonb,
  created_at timestamptz not null default now()
);

create table if not exists verification_signals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  signal_type text not null check (signal_type in ('tool','workflow','portfolio','rights')),
  evidence_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  creator_id uuid not null references creators(id) on delete cascade,
  status text not null check (status in ('shortlisted','engaged')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_creator_skills_skill on creator_skills(skill);
create index if not exists idx_creator_tools_tool on creator_tools(tool);
create index if not exists idx_creator_specializations_spec on creator_specializations(specialization);
create index if not exists idx_portfolio_metadata_embedding on portfolio_metadata using ivfflat (embedding vector_cosine_ops);
create index if not exists idx_creator_matches_brief on creator_matches(brief_id);
`;

/** Table names exported for typed helpers in lib/db/client.ts */
export const TABLES = {
  users: "users",
  creators: "creators",
  brands: "brands",
  creatorSkills: "creator_skills",
  creatorTools: "creator_tools",
  creatorSpecializations: "creator_specializations",
  creatorPortfolios: "creator_portfolios",
  portfolioMetadata: "portfolio_metadata",
  briefs: "briefs",
  creatorMatches: "creator_matches",
  verificationSignals: "verification_signals",
  projects: "projects",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
