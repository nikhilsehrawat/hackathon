/**
 * lib/validation/schemas.ts — Zod schemas for every API boundary.
 */
import { z } from "zod";

/* ---------------- Brief builder ---------------- */

export const briefGenerateRequestSchema = z.object({
  raw_input: z.string().min(10, "Describe your idea in at least a few words"),
  brand_id: z.string().uuid().optional(),
});
export type BriefGenerateRequest = z.infer<typeof briefGenerateRequestSchema>;

export const structuredBriefSchema = z.object({
  campaign_objective: z.string(),
  content_type: z.string(),
  style: z.string(),
  duration: z.string(),
  platform: z.string(),
  aspect_ratio: z.string(),
  target_audience: z.string(),
  visual_direction: z.string(),
  required_tools: z.array(z.string()),
  commercial_usage: z.string(),
  deliverables: z.array(z.string()),
  constraints: z.array(z.string()),
});
export type StructuredBriefZod = z.infer<typeof structuredBriefSchema>;

export const briefSaveSchema = structuredBriefSchema.extend({
  raw_input: z.string(),
  brand_id: z.string().uuid(),
});
export type BriefSave = z.infer<typeof briefSaveSchema>;

/* ---------------- Matching ---------------- */

export const matchRequestSchema = z.object({
  brief_id: z.string().uuid(),
});
export type MatchRequest = z.infer<typeof matchRequestSchema>;

/* ---------------- Explanation ---------------- */

export const explainRequestSchema = z.object({
  match_id: z.string().uuid(),
});
export type ExplainRequest = z.infer<typeof explainRequestSchema>;

/* ---------------- Creators query ---------------- */

export const creatorsQuerySchema = z.object({
  skills: z.string().optional(),
  tools: z.string().optional(),
  specialization: z.string().optional(),
  content_type: z.string().optional(),
});
export type CreatorsQuery = z.infer<typeof creatorsQuerySchema>;

/* ---------------- Creator profile setup ---------------- */

export const creatorProfileSetupSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(2),
  bio: z.string().default(""),
  location: z.string().default(""),
  years_experience: z.number().int().min(0).max(60).default(0),
  hourly_rate: z.number().min(0).default(0),
  availability: z.enum(["Available", "Booked", "Limited"]).default("Available"),
  skills: z.array(z.object({ skill: z.string(), proficiency: z.number().int().min(1).max(5) })),
  tools: z.array(
    z.object({
      tool: z.string(),
      proficiency: z.number().int().min(1).max(5),
      verified: z.boolean().default(false),
    }),
  ),
  specializations: z.array(z.string()),
  signals: z.array(z.enum(["tool", "workflow", "portfolio", "rights"])).default([]),
});
export type CreatorProfileSetup = z.infer<typeof creatorProfileSetupSchema>;

/* ---------------- Shortlist ---------------- */

export const shortlistSchema = z.object({
  brief_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  status: z.enum(["shortlisted", "engaged"]).default("shortlisted"),
});
export type ShortlistRequest = z.infer<typeof shortlistSchema>;

/** Utility: parse with readable errors. */
export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Validation failed — ${message}`);
  }
  return result.data;
}
