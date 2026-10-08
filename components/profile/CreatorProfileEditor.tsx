"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/toast";

export interface CreatorProfileValues {
  display_name: string;
  tagline: string;
  bio: string;
  location: string;
  years_experience: number;
  hourly_rate: number;
  availability: string;
  website: string;
  twitter: string;
  linkedin: string;
  portfolio_link: string;
}

/**
 * Edits public creator details through the authenticated profile API.
 */
export default function CreatorProfileEditor({ profile }: { profile: CreatorProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function update<K extends keyof CreatorProfileValues>(key: K, value: CreatorProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.display_name.trim()) {
      setToast({ message: "Display name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/profile/creator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          years_experience: Number(values.years_experience),
          hourly_rate: Number(values.hourly_rate),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save profile.");
      window.dispatchEvent(new Event("creatoriq:profile-updated"));
      router.refresh();
      setToast({ message: "Creator profile saved.", type: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to save profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50";
  const fields: Array<{ key: keyof CreatorProfileValues; label: string; type?: string }> = [
    { key: "display_name", label: "Display name" },
    { key: "tagline", label: "Tagline" },
    { key: "location", label: "Location" },
    { key: "years_experience", label: "Years of experience", type: "number" },
    { key: "hourly_rate", label: "Hourly rate (USD)", type: "number" },
    { key: "availability", label: "Availability" },
    { key: "website", label: "Website", type: "url" },
    { key: "twitter", label: "Twitter / X" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "portfolio_link", label: "Portfolio link", type: "url" },
  ];

  return (
    <form id="edit-profile" onSubmit={handleSubmit} className="glass rounded-2xl p-6">
      <h2 className="mb-5 text-xl font-semibold text-white">Edit creator profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type }) => (
          <label key={key} className="space-y-2 text-sm text-gray-300">
            {label}
            <input className={inputClass} type={type ?? "text"} min={type === "number" ? 0 : undefined} value={values[key]} onChange={(event) => update(key, (type === "number" ? Number(event.target.value) : event.target.value) as CreatorProfileValues[typeof key])} />
          </label>
        ))}
        <label className="space-y-2 text-sm text-gray-300 sm:col-span-2">
          Bio
          <textarea className={`${inputClass} resize-y`} rows={5} value={values.bio} onChange={(event) => update("bio", event.target.value)} maxLength={5000} />
        </label>
      </div>
      <button disabled={saving} className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Saving..." : "Save profile"}
      </button>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </form>
  );
}
