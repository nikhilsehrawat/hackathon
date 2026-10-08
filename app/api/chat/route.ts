import OpenAI from "openai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the PromptFolio assistant — a helpful, concise AI that helps brands find AI creators and understand the PromptFolio marketplace.

PromptFolio is an AI-native marketplace that:
- Converts rough brand ideas into structured creative briefs using AI
- Matches briefs against 15 verified AI creators using a 7-dimension hybrid scoring engine (skills 20%, tools 20%, specialization 15%, content type 15%, style 10%, rights 10%, portfolio 10%)
- Shows explainable match scores ("94% because...")
- Surfaces verification signals: tool, workflow, portfolio, rights

Available creators include: Aria Chen (cinematic AI filmmaker), Omar Haddad (food & beverage motion), Grace Liu (music videos), Ethan Brooks (paid social), Priya Sharma (luxury), Noah Fischer (automotive), Mia Johansson (product), Kai Tanaka (gaming), Zara Ahmed (wellness), Felix Moreau (fashion), Ivy Zhang (real estate).

Tools creators use: Runway Gen-3, Midjourney v6, Sora, Kling, Flux, ComfyUI, After Effects, Topia Video AI, ElevenLabs, CapCut.

Keep responses SHORT (2-4 sentences max). Be conversational. If asked about a specific creator, mention their top skills and tools. If asked how to start, guide them to click 'Start Creating Brief'. Never make up creators or features. If unsure, say so.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0 &&
    candidate.content.length <= 2000
  );
}

/**
 * Generates a concise marketplace assistant response using the configured Groq-compatible API.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 30 ||
    !body.messages.every(isChatMessage) ||
    body.messages.at(-1)?.role !== "user"
  ) {
    return NextResponse.json({ error: "Provide between 1 and 30 valid chat messages, ending with a user message." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[api/chat] OPENAI_API_KEY is not configured.");
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 503 });
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 350,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...body.messages.map((message) => ({
          role: message.role,
          content: message.content.trim(),
        })),
      ],
    });
    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) {
      console.error("[api/chat] Model returned an empty response.");
      return NextResponse.json({ error: "The assistant returned an empty response." }, { status: 502 });
    }
    return NextResponse.json({ message });
  } catch (cause) {
    console.error("[api/chat] Chat completion failed:", cause);
    return NextResponse.json({ error: "Unable to get a response right now." }, { status: 502 });
  }
}
