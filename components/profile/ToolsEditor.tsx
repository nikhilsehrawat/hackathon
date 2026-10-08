"use client";

import { useState, type FormEvent } from "react";
import Toast from "@/components/ui/toast";

interface CreatorTool {
  id: string;
  tool: string;
  proficiency: number;
  verified: boolean;
}

/**
 * Adds/removes tools and ratings; verification is controlled by the platform.
 */
export default function ToolsEditor({ initialTools }: { initialTools: CreatorTool[] }) {
  const [tools, setTools] = useState(initialTools);
  const [tool, setTool] = useState("");
  const [proficiency, setProficiency] = useState(3);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  async function addTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tool.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/creator/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, proficiency }),
      });
      const result = (await response.json()) as { tool?: CreatorTool; error?: string };
      if (!response.ok || !result.tool) throw new Error(result.error || "Unable to add tool.");
      setTools((current) => [...current, result.tool!]);
      setTool("");
      setToast({ message: "Tool added.", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add tool.");
      setToast({ message: cause instanceof Error ? cause.message : "Unable to add tool.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function removeTool(id: string) {
    setError("");
    try {
      const response = await fetch("/api/profile/creator/tools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to remove tool.");
      setTools((current) => current.filter((item) => item.id !== id));
      setToast({ message: "Tool removed.", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove tool.");
      setToast({ message: cause instanceof Error ? cause.message : "Unable to remove tool.", type: "error" });
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Tools & models</h2>
      {tools.length ? (
        <div className="mb-4 space-y-2">
          {tools.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-white">{item.verified && <span className="mr-1 text-green-400">✓</span>}{item.tool}</span>
              <span className="text-xs text-purple-300">{item.proficiency}/5</span>
              <button type="button" onClick={() => void removeTool(item.id)} aria-label={`Remove ${item.tool}`} className="text-gray-500 hover:text-red-300">×</button>
            </div>
          ))}
        </div>
      ) : <p className="mb-4 text-sm text-gray-500">No tools yet. Add your first →</p>}
      <form onSubmit={addTool} className="space-y-3 border-t border-white/10 pt-4">
        <input value={tool} onChange={(event) => setTool(event.target.value)} maxLength={80} placeholder="Add a tool or model" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
        <label className="flex items-center gap-3 text-xs text-gray-400">
          Proficiency {proficiency}/5
          <input type="range" min={1} max={5} value={proficiency} onChange={(event) => setProficiency(Number(event.target.value))} className="flex-1 accent-purple-500" />
        </label>
        <p className="text-xs text-gray-500">Verification badges are added by CreatorIQ.</p>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        <button disabled={loading || !tool.trim()} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-purple-200 disabled:opacity-50">{loading ? "Adding..." : "Add tool"}</button>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  );
}
