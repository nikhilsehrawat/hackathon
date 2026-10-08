"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/toast";

export interface BrandProfileValues {
  company_name: string;
  tagline: string;
  description: string;
  industry: string;
  website: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  linkedin: string;
  twitter: string;
}

/**
 * Edits company identity and contact information through the brand API.
 */
export default function BrandProfileEditor({ profile }: { profile: BrandProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.company_name.trim()) {
      setToast({ message: "Company name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/profile/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save profile.");
      window.dispatchEvent(new Event("creatoriq:profile-updated"));
      router.refresh();
      setToast({ message: "Brand profile saved.", type: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to save profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50";
  const fields: Array<{ key: keyof BrandProfileValues; label: string; type?: string }> = [
    { key: "company_name", label: "Company name" },
    { key: "tagline", label: "Tagline" },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website", type: "url" },
    { key: "contact_name", label: "Contact name" },
    { key: "contact_email", label: "Contact email", type: "email" },
    { key: "contact_phone", label: "Contact phone", type: "tel" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "twitter", label: "Twitter / X" },
  ];

  return (
    <form id="edit-profile" onSubmit={handleSubmit} className="glass rounded-2xl p-6">
      <h2 className="mb-5 text-xl font-semibold text-white">Edit brand profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type }) => (
          <label key={key} className="space-y-2 text-sm text-gray-300">
            {label}
            <input className={inputClass} type={type ?? "text"} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
          </label>
        ))}
        <label className="space-y-2 text-sm text-gray-300 sm:col-span-2">
          Company description
          <textarea className={`${inputClass} resize-y`} rows={5} maxLength={5000} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
        </label>
      </div>
      <button disabled={saving} className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Saving..." : "Save profile"}
      </button>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </form>
  );
}
