"use client";

import { useState, type FormEvent } from "react";
import { toHttpUrl } from "@/lib/profile/urls";

interface PortfolioItem {
  id: string;
  title: string;
  media_url: string;
  media_type: "image" | "video";
  description: string;
}

/**
 * Lets a creator add and remove public portfolio links.
 */
export default function PortfolioEditor({ initialItems }: { initialItems: PortfolioItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/profile/creator/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, media_url: mediaUrl, media_type: mediaType, description }),
      });
      const result = (await response.json()) as { item?: PortfolioItem; error?: string };
      if (!response.ok || !result.item) throw new Error(result.error || "Unable to add portfolio item.");
      setItems((current) => [result.item!, ...current]);
      setTitle("");
      setMediaUrl("");
      setDescription("");
      setSuccess("Portfolio item added.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add portfolio item.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/profile/creator/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to remove portfolio item.");
      setItems((current) => current.filter((item) => item.id !== id));
      setSuccess("Portfolio item removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove portfolio item.");
    }
  }

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Portfolio</h2>
      {items.length ? <div className="mb-5 grid gap-3 sm:grid-cols-2">{items.map((item) => (
        <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            {toHttpUrl(item.media_url) ? (
              <a href={toHttpUrl(item.media_url)!} target="_blank" rel="noreferrer" className="min-w-0 text-sm font-medium text-purple-200 hover:text-purple-100">{item.title} ↗</a>
            ) : <span className="min-w-0 text-sm font-medium text-gray-300">{item.title}</span>}
            <button type="button" onClick={() => void removeItem(item.id)} aria-label={`Remove ${item.title}`} className="text-gray-500 hover:text-red-300">×</button>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400">{item.description || item.media_type}</p>
        </div>
      ))}</div> : <p className="mb-5 text-sm text-gray-500">Your portfolio is ready for its first project.</p>}
      <form onSubmit={addItem} className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
        <input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project title" className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
        <input required type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://..." className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
        <select value={mediaType} onChange={(event) => setMediaType(event.target.value as "image" | "video")} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
          <option value="image">Image</option><option value="video">Video</option>
        </select>
        <input maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
        {error && <p role="alert" className="text-xs text-red-300 sm:col-span-2">{error}</p>}
        {success && <p role="status" className="text-xs text-green-300 sm:col-span-2">{success}</p>}
        <button disabled={loading} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{loading ? "Adding..." : "Add portfolio item"}</button>
      </form>
    </section>
  );
}
