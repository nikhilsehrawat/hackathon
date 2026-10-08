"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Check } from "lucide-react";

interface Props {
  matchId: string;
  creatorId: string;
  briefId: string;
}

/** Shortlist a matched creator for the current brief (persisted via /api/projects). */
export function ShortlistButton({ matchId, creatorId, briefId }: Props) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function onClick(): Promise<void> {
    if (state !== "idle") return;
    setState("saving");
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief_id: briefId, creator_id: creatorId, status: "shortlisted" }),
      });
      setState("saved");
    } catch {
      setState("idle");
    }
    void matchId;
  }

  return (
    <Button
      size="sm"
      variant={state === "saved" ? "secondary" : "default"}
      onClick={onClick}
      disabled={state === "saving"}
    >
      {state === "saved" ? (
        <>
          <Check className="h-4 w-4" /> Shortlisted
        </>
      ) : (
        <>
          <Star className="h-4 w-4" /> {state === "saving" ? "Saving…" : "Shortlist"}
        </>
      )}
    </Button>
  );
}
