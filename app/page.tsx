import Link from "next/link";
import LiveDemo from "@/components/LiveDemo";
import Nav from "@/components/layout/Nav";

/**
 * Renders the public PromptFolio landing page.
 */
export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" />

      <Nav />

      {/* Hero + Live Demo */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-12 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">
              Try it live — no signup required
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Type your brief.
            <br />
            <span className="gradient-text">Meet your creator.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The AI-native marketplace that turns a rough idea into a
            structured brief, then matches it against{" "}
            <span className="text-white font-medium">
              15 verified AI creators
            </span>{" "}
            — with explainable scores.
          </p>
        </div>

        {/* LIVE DEMO */}
        <LiveDemo />
      </section>

      {/* Comparison — Old Way vs PromptFolio */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Why not just use <span className="text-gray-500">Fiverr</span>?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* OLD WAY */}
          <div className="glass rounded-2xl p-6 border border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">❌</span>
              <h3 className="text-lg font-semibold text-gray-400">
                Traditional Marketplaces
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-red-400">✗</span>
                Search by vague keywords, get 1000s of results
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">✗</span>
                No idea what tools/models creator uses
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">✗</span>
                Commercial rights buried in contracts
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">✗</span>
                Black-box "match scores" — no explanation
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">✗</span>
                You write the brief yourself (badly)
              </li>
            </ul>
          </div>

          {/* NEW WAY */}
          <div className="glass rounded-2xl p-6 border border-purple-500/40 glow">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h3 className="text-lg font-semibold text-white">
                PromptFolio
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-white">
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Describe in plain language — AI builds the brief
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Every profile shows tools, models, workflow
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Rights-native: commercial use is a filter
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Explainable matches — "94% because..."
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Verification signals you can trust
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "15", label: "Verified Creators", sub: "AI-native" },
            { value: "7", label: "Match Dimensions", sub: "Explainable" },
            { value: "8", label: "AI Tools", sub: "Runway, MJ, Sora" },
            { value: "60s", label: "Brief-to-Match", sub: "Live demo" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 text-center glass-hover"
            >
              <div className="text-3xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white font-medium mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-20 text-center">
        <div className="glass rounded-3xl p-10 glow">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to brief your next campaign?
          </h2>
          <p className="text-gray-400 mb-8">
            Full brief builder + creator matching in one flow.
          </p>
          <Link
            href="/brief/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 glow-hover"
          >
            Open Full Brief Builder →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-gray-500 text-sm">
          Built for the AI Creator Economy · PromptFolio © 2026
        </p>
      </footer>
    </main>
  );
}