"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/toast";

/**
 * Uploads and previews an account avatar or company logo.
 */
export default function AvatarUpload({
  currentUrl,
  label = "Upload image",
  fallback = "C",
  onUploaded,
}: {
  currentUrl: string | null;
  label?: string;
  fallback?: string;
  onUploaded?: (url: string) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ message: "Choose a JPG, PNG, or WebP image.", type: "error" });
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "Image must be 5MB or smaller.", type: "error" });
      event.target.value = "";
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed.");
      setPreview(result.url);
      onUploaded?.(result.url);
      window.dispatchEvent(new Event("creatoriq:profile-updated"));
      router.refresh();
      setToast({ message: "Profile image updated.", type: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Upload failed.", type: "error" });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold text-white">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile image preview" className="h-full w-full object-cover" />
        ) : fallback}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 disabled:opacity-60"
      >
        {loading ? "Uploading..." : label}
      </button>
      <p className="text-xs text-gray-500">JPG, PNG or WebP · Up to 5MB</p>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
