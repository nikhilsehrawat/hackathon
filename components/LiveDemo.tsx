"use client";

import { useState } from "react";

interface BriefData {
  campaign_objective: string;
  content_type: string;
  style: string;
  duration: string;
  platform: string;
  aspect_ratio: string;
  required_tools: string[];
  commercial_usage: string;
}

export default function LiveDemo() {
  const [input, setInput] = useState(
    "Cinematic 30-second Instagram ad for a premium sneaker brand"
  );
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [topMatch, setTopMatch] = useState<{ name: string; score: number } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setBrief(null);
    setMatchCount(null);
    setTopMatch(null);

    try {
      // Step 1: Generate brief
      const briefRes = await fetch("/api/brief/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: input }),
      });
      const briefData = await briefRes.json();
      setBrief(briefData.brief);

      // Fake delay for effect
      await new Promise((r) => setTimeout(r, 400));

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-300 font-medium">
            Live Demo — Try it now
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
            placeholder="Describe your campaign idea..."
          />
          <button
            onClick={handleGenerate}
            disabled={loading || input.length < 10}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Generating..." : "✨ Generate Brief"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm text-purple-300">
              AI is analyzing your brief...
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
          </div>
        </div>
      )}

      {brief && !loading && (
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">✅</span>
            <span className="text-lg font-semibold text-white">
              Structured Brief Generated
            </span>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              0.8s
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Type", value: brief.content_type },
              { label: "Duration", value: brief.duration },
              { label: "Platform", value: brief.platform },
              { label: "Aspect", value: brief.aspect_ratio },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-black/30 rounded-lg p-3 border border-white/5"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {item.label}
                </div>
                <div className="text-sm text-white font-medium truncate">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Style</div>
            <div className="text-sm text-white">{brief.style}</div>
          </div>

          <div className="mb-5">
            <div className="text-xs text-gray-500 mb-2">
              Required Tools
            </div>
            <div className="flex flex-wrap gap-2">
              {brief.required_tools.map((tool) => (
                <span
                  key={tool}
                  className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <a
            href="/brief/new"
            className="block w-full text-center px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition text-white font-medium"
          >
            Find matching creators →
          </a>
        </div>
      )}
    </div>
  );
}