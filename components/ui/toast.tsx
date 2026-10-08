"use client";

import { useEffect } from "react";

/**
 * Accessible transient feedback for profile and account actions.
 */
export default function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div role={type === "error" ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl ${type === "error" ? "border-red-400/20 bg-red-950/90 text-red-200" : "border-green-400/20 bg-green-950/90 text-green-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <span>{message}</span>
        <button type="button" onClick={onClose} aria-label="Dismiss notification" className="text-current/70 hover:text-current">×</button>
      </div>
    </div>
  );
}
