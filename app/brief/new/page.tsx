"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import Nav from "@/components/layout/Nav";
import { isMissingAuthSession } from "@/lib/supabase/auth-errors";

interface Brief {
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

/**
 * Renders the authenticated AI brief builder.
 */
export default function NewBriefPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [input, setInput] = useState(
    "I need a cinematic 30-second Instagram ad for a premium sneaker brand"
  );
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);

  useEffect(() => {
    let active = true;

    createBrowserClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error && !isMissingAuthSession(error)) {
          console.error("[brief/new] Unable to verify current user:", error.message);
          setAuthError("We couldn’t verify your session. Please reload and try again.");
          setAuthChecked(true);
          return;
        }
        if (!data.user) {
          router.replace("/login");
          return;
        }
        setAuthChecked(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("[brief/new] Auth check failed:", error);
        setAuthError("We couldn’t verify your session. Please reload and try again.");
        setAuthChecked(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/brief/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: input }),
      });
      const data = await res.json();
      setBrief(data.brief);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Checking your session...
      </main>
    );
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p role="alert" className="glass rounded-xl p-5 text-sm text-red-300">
          {authError}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <Nav />

      <section className="relative z-10 max-w-3xl mx-auto px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            AI Brief Builder
          </h1>
          <p className="text-gray-400">
            Describe your campaign — AI builds the structured brief
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <label className="text-sm text-gray-400 mb-3 block">
            Your rough idea
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition resize-none"
            placeholder="e.g. Cinematic 30s Instagram ad for premium sneakers..."
          />
          <button
            onClick={handleGenerate}
            disabled={loading || input.length < 10}
            className="mt-4 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "✨ AI is building your brief..." : "✨ Generate Brief"}
          </button>
        </div>

        {brief && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">✅</span>
              <h2 className="text-lg font-semibold text-white">
                Structured Brief
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Objective", value: brief.campaign_objective },
                { label: "Content Type", value: brief.content_type },
                { label: "Style", value: brief.style },
                { label: "Duration", value: brief.duration },
                { label: "Platform", value: brief.platform },
                { label: "Aspect Ratio", value: brief.aspect_ratio },
                { label: "Target Audience", value: brief.target_audience },
                { label: "Visual Direction", value: brief.visual_direction },
                { label: "Commercial Usage", value: brief.commercial_usage },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-start gap-4 py-2 border-b border-white/5"
                >
                  <span className="text-sm text-gray-500 shrink-0">
                    {item.label}
                  </span>
                  <span className="text-sm text-white text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2">Required Tools</div>
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

            <Link
              href="/creators"
              className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition"
            >
              Find Matching Creators →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}