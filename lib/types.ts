/**
 * PromptFolio — core domain types (strict mode).
 */

export type UserRole = "brand" | "creator";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Creator {
  id: string;
  display_name: string;
  tagline?: string;
  bio: string;
  location: string;
  years_experience: number;
  hourly_rate: number;
  availability: string;
  created_at?: string;
  avatar_url?: string | null;
  website?: string;
  twitter?: string;
  linkedin?: string;
  portfolio_link?: string;
}

export interface Brand {
  id: string;
  company_name: string;
  industry: string;
  website: string;
  logo_url?: string | null;
  tagline?: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  verified?: boolean;
  linkedin?: string;
  twitter?: string;
  website_verified?: boolean;
}

export interface CreatorSkill {
  id: string;
  creator_id: string;
  skill: string;
  proficiency: number; // 1-5
}

export interface CreatorTool {
  id: string;
  creator_id: string;
  tool: string;
  proficiency: number; // 1-5
  verified: boolean;
}

export interface CreatorSpecialization {
  id: string;
  creator_id: string;
  specialization: string;
}

export type MediaType = "image" | "video";

export interface CreatorPortfolio {
  id: string;
  creator_id: string;
  title: string;
  media_url: string;
  media_type: MediaType;
  thumbnail_url: string;
  description: string;
  created_at?: string;
}

export interface PortfolioMetadata {
  id: string;
  portfolio_id: string;
  content_type: string;
  style: string;
  tools: string[];
  industry: string;
  aspect_ratio: string;
  duration_seconds: number | null;
  commercial_use: string;
  workflow_notes: string;
  embedding?: number[] | null;
}

export type BriefStatus = "draft" | "ready" | "matched";

export interface Brief {
  id: string;
  brand_id: string;
  raw_input: string;
  campaign_objective: string;
  content_type: string;
  style: string;
  duration: string;
  platform: string;
  aspect_ratio: string;
  target_audience: string;
  visual_direction: string;
  required_tools: string[];
  commercial_usage: string;
  deliverables: string[];
  constraints: string[];
  status: BriefStatus;
  created_at?: string;
}

/** The structured output produced by the AI brief builder (no DB fields). */
export interface StructuredBrief {
  campaign_objective: string;
  content_type: string;
  style: string;
  duration: string;
  platform: string;
  aspect_ratio: string;
  target_audience: string;
  visual_direction: string;
  required_tools: string[];
  commercial_usage: string;
  deliverables: string[];
  constraints: string[];
}

export interface MatchScoreBreakdown {
  total_score: number;
  skill_score: number;
  tool_score: number;
  specialization_score: number;
  content_type_score: number;
  style_score: number;
  rights_score: number;
  portfolio_score: number;
}

export interface ExplanationPayload {
  bullets: string[];
  matched_skills: string[];
  matched_tools: string[];
  matched_specializations: string[];
  top_portfolio_title: string | null;
  similarity_pct: number;
}

export interface CreatorMatch extends MatchScoreBreakdown {
  id: string;
  brief_id: string;
  creator_id: string;
  explanation: ExplanationPayload | null;
  created_at?: string;
}

export type VerificationSignalType = "tool" | "workflow" | "portfolio" | "rights";

export interface VerificationSignal {
  id: string;
  creator_id: string;
  signal_type: VerificationSignalType;
  evidence_url: string | null;
  verified: boolean;
  created_at?: string;
}

export type ProjectStatus = "shortlisted" | "engaged";

export interface Project {
  id: string;
  brief_id: string;
  creator_id: string;
  status: ProjectStatus;
  created_at?: string;
}

/** Aggregated view used by UI + matching engine. */
export interface CreatorProfile {
  creator: Creator;
  skills: CreatorSkill[];
  tools: CreatorTool[];
  specializations: CreatorSpecialization[];
  portfolios: Array<CreatorPortfolio & { metadata: PortfolioMetadata | null }>;
  signals: VerificationSignal[];
  verified_badge: boolean;
}

export interface RankedMatch {
  creator_id: string;
  scores: MatchScoreBreakdown;
  explanation: ExplanationPayload;
}
