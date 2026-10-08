"use client";

import { useState, type FormEvent } from "react";
import Toast from "@/components/ui/toast";

interface Skill {
  id: string;
  skill: string;
  proficiency: number;
}

/**
 * Adds/removes skills and proficiency ratings for the creator's own profile.
 */
export default function SkillsEditor({ initialSkills }: { initialSkills: Skill[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [skill, setSkill] = useState("");
  const [proficiency, setProficiency] = useState(3);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  async function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!skill.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/creator/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, proficiency }),
      });
      const result = (await response.json()) as { skill?: Skill; error?: string };
      if (!response.ok || !result.skill) throw new Error(result.error || "Unable to add skill.");
      setSkills((current) => [...current, result.skill!]);
      setSkill("");
      setToast({ message: "Skill added.", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add skill.");
      setToast({ message: cause instanceof Error ? cause.message : "Unable to add skill.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function removeSkill(id: string) {
    setError("");
    try {
      const response = await fetch("/api/profile/creator/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to remove skill.");
      setSkills((current) => current.filter((item) => item.id !== id));
      setToast({ message: "Skill removed.", type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove skill.");
      setToast({ message: cause instanceof Error ? cause.message : "Unable to remove skill.", type: "error" });
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Skills</h2>
      {skills.length ? (
        <div className="mb-4 space-y-2">
          {skills.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-white">{item.skill}</span>
              <span className="text-xs text-purple-300">{item.proficiency}/5</span>
              <button type="button" onClick={() => void removeSkill(item.id)} aria-label={`Remove ${item.skill}`} className="text-gray-500 hover:text-red-300">×</button>
            </div>
          ))}
        </div>
      ) : <p className="mb-4 text-sm text-gray-500">No skills yet. Add your first →</p>}
      <form onSubmit={addSkill} className="space-y-3 border-t border-white/10 pt-4">
        <input value={skill} onChange={(event) => setSkill(event.target.value)} maxLength={80} placeholder="Add a skill" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
        <label className="flex items-center gap-3 text-xs text-gray-400">
          Proficiency {proficiency}/5
          <input type="range" min={1} max={5} value={proficiency} onChange={(event) => setProficiency(Number(event.target.value))} className="flex-1 accent-purple-500" />
        </label>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        <button disabled={loading || !skill.trim()} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-purple-200 disabled:opacity-50">{loading ? "Adding..." : "Add skill"}</button>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  );
}
