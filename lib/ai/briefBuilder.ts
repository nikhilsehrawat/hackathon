/**
 * lib/ai/briefBuilder.ts — Rough idea -> structured creative brief.
 *
 * Pipeline: GPT-4o (JSON mode) -> Zod validation -> enrichment mapping
 *           (platform -> aspect ratios, content_type -> deliverables).
 * Fallback: rule-based keyword extraction if the API fails or is unconfigured.
 */
import OpenAI from "openai";
import type { StructuredBrief } from "../types";
import { structuredBriefSchema } from "../validation/schemas";

const SYSTEM_PROMPT = `You are a senior creative strategist converting a brand's rough idea into a structured video-content brief for an AI creator marketplace.
Respond ONLY with a JSON object with exactly these keys:
campaign_objective (string), content_type (string, e.g. "Video ad", "UGC-style video", "Image set"), style (string, comma-separated adjectives like "Cinematic, premium, moody"), duration (string, e.g. "30 seconds"), platform (string, e.g. Instagram, TikTok, YouTube), aspect_ratio (string, one of 9:16, 1:1, 16:9, 4:5), target_audience (string), visual_direction (string), required_tools (array of AI/creative tool names, e.g. Runway, Midjourney, After Effects), commercial_usage (string, e.g. "Full commercial rights, paid media"), deliverables (array of strings), constraints (array of strings).`;

/* ---------------- Enrichment maps ---------------- */

const PLATFORM_ASPECT: Record<string, string> = {
  instagram: "9:16",
  reels: "9:16",
  tiktok: "9:16",
  shorts: "9:16",
  youtube: "16:9",
  linkedin: "1:1",
  facebook: "1:1",
  pinterest: "4:5",
};

const CONTENT_DELIVERABLES: Record<string, string[]> = {
  "video ad": ["Master cut", "15s cutdown", "9:16 + 1:1 + 16:9 crops", "Thumbnail frame"],
  "ugc-style video": ["2x 20-30s UGC clips", "Hook variations (3)", "Vertical 9:16 master"],
  "image set": ["6-10 hero images", "Web + social crops", "Layered source files"],
  "product photography": ["8-12 product shots", "White-background packshots", "Lifestyle variants"],
  banner: ["3 size variants", "Static + animated version"],
};

function normalizePlatform(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, ratio] of Object.entries(PLATFORM_ASPECT)) {
    if (lower.includes(key)) return key.charAt(0).toUpperCase() + key.slice(1);
  }
  return raw || "Instagram";
}

function enrich(brief: StructuredBrief): StructuredBrief {
  const platformKey = brief.platform.toLowerCase();
  const aspect =
    PLATFORM_ASPECT[platformKey] ??
    (["9:16", "1:1", "16:9", "4:5"].includes(brief.aspect_ratio)
      ? brief.aspect_ratio
      : "9:16");

  const ctKey = Object.keys(CONTENT_DELIVERABLES).find((k) =>
    brief.content_type.toLowerCase().includes(k),
  );
  const baseDeliverables = ctKey ? CONTENT_DELIVERABLES[ctKey] : brief.deliverables;

  return {
    ...brief,
    platform: normalizePlatform(brief.platform),
    aspect_ratio: aspect,
    deliverables: Array.from(new Set([...baseDeliverables, ...brief.deliverables])),
    constraints: brief.constraints.length > 0 ? brief.constraints : ["Brand-safe content"],
  };
}

/* ---------------- LLM path ---------------- */

async function generateWithLLM(rawInput: string): Promise<StructuredBrief> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  const openai = new OpenAI({ apiKey: key });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Rough idea:\n${rawInput}` },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  const parsed = structuredBriefSchema.parse(JSON.parse(text));
  return parsed satisfies StructuredBrief;
}

/* ---------------- Rule-based fallback ---------------- */

const TOOL_KEYWORDS: Array<[RegExp, string]> = [
  [/runway/i, "Runway"],
  [/sora/i, "Sora"],
  [/midjourney|mj\b/i, "Midjourney"],
  [/dalle|dall/i, "DALL-E"],
  [/after effects|\bae\b/i, "After Effects"],
  [/premiere/i, "Premiere Pro"],
  [/topaz/i, "Topaz Video AI"],
  [/elevenlabs|voiceover|voice over/i, "ElevenLabs"],
  [/photoshop/i, "Photoshop"],
  [/flux\b/i, "Flux"],
  [/comfyui|comfy ui/i, "ComfyUI"],
];

export function ruleBasedBrief(rawInput: string): StructuredBrief {
  const text = rawInput.toLowerCase();

  const contentType = /photo|image|still/.test(text)
    ? "Image set"
    : /ugc|creator|authentic/.test(text)
      ? "UGC-style video"
      : "Video ad";

  const platformMatch = Object.keys(PLATFORM_ASPECT).find((p) => text.includes(p));
  const platform = platformMatch
    ? platformMatch.charAt(0).toUpperCase() + platformMatch.slice(1)
    : "Instagram";

  const durationMatch = text.match(/(\d+)\s*(?:sec|second|s\b)/);
  const duration = durationMatch ? `${durationMatch[1]} seconds` : "30 seconds";

  const style = /cinematic|film|moody|premium|luxur/.test(text)
    ? "Cinematic, premium, moody"
    : /bright|fun|playful|colorful/.test(text)
      ? "Bright, playful, high-energy"
      : /minimal|clean/.test(text)
        ? "Minimal, clean, modern"
        : "Modern, polished";

  const requiredTools = TOOL_KEYWORDS.filter(([re]) => re.test(text)).map(([, t]) => t);
  if (requiredTools.length === 0 && contentType !== "Image set") {
    requiredTools.push("Runway", "Midjourney");
  }

  const seconds = parseInt(duration, 10) || 30;
  return {
    campaign_objective: /launch|new product/.test(text)
      ? "Product launch awareness"
      : /sale|promo|discount/.test(text)
        ? "Promotional conversion"
        : "Brand awareness",
    content_type: contentType,
    style,
    duration,
    platform,
    aspect_ratio: PLATFORM_ASPECT[platform.toLowerCase()] ?? "9:16",
    target_audience: /gen ?z|young|18|25/.test(text)
      ? "18-34 urban, fashion-forward"
      : "General consumer audience",
    visual_direction:
      /night|dark|moody/.test(text)
        ? "Dramatic lighting, urban night palette"
        : "Clean composition with strong product focus",
    required_tools: requiredTools,
    commercial_usage: "Full commercial rights, paid media",
    deliverables: [
      `${seconds}s master`,
      "15s cutdown",
      "9:16 + 1:1 + 16:9 crops",
    ],
    constraints: ["Brand-safe", "No celebrity likeness"],
  };
}

/* ---------------- Public API ---------------- */

export interface BriefBuildResult {
  brief: StructuredBrief;
  source: "llm" | "fallback";
}

export async function buildBrief(rawInput: string): Promise<BriefBuildResult> {
  try {
    const llmBrief = await generateWithLLM(rawInput);
    return { brief: enrich(llmBrief), source: "llm" };
  } catch (err) {
    console.warn("[briefBuilder] LLM unavailable, using rule-based fallback:", String(err));
    return { brief: enrich(ruleBasedBrief(rawInput)), source: "fallback" };
  }
}
