/**
 * lib/ai/embeddings.ts — OpenAI text-embedding-3-small helpers.
 * Every call is wrapped with try/catch and a deterministic fallback so the
 * demo never hard-fails when the network or keys are unavailable.
 */
import OpenAI from "openai";

export const EMBEDDING_DIM = 1536;

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

/** Deterministic pseudo-embedding for offline/fallback mode (hash-based). */
export function fallbackEmbedding(text: string, dim = EMBEDDING_DIM): number[] {
  const vec = new Array<number>(dim).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // Each token lights up a few dimensions; shared tokens => shared dims => similarity.
    for (let k = 0; k < 4; k++) {
      h = Math.imul(h ^ (h >>> 15), 2246822519);
      vec[Math.abs(h + k * 7919) % dim] += 1;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<number[]> {
  const openai = getClient();
  if (!openai) return fallbackEmbedding(text);
  try {
    const res = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    const vec = res.data[0]?.embedding;
    if (!vec || vec.length !== EMBEDDING_DIM) throw new Error("Bad embedding shape");
    return vec;
  } catch (err) {
    console.warn("[embeddings] OpenAI failed, using fallback:", String(err));
    return fallbackEmbedding(text);
  }
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(embedText));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Compact text used to embed brief styles / portfolio styles. */
export function styleEmbeddingText(style: string, extra = ""): string {
  return `${style.toLowerCase().trim()} ${extra.toLowerCase().trim()}`.trim();
}
