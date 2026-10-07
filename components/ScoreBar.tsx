import { cn } from "@/lib/utils/cn";
import { pct } from "@/lib/utils/cn";

interface Props {
  label: string;
  value: number; // 0..1
  weight?: number; // 0..1, shown as "×20%" hint
  className?: string;
}

export function ScoreBar({ label, value, weight, className }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label}
          {weight !== undefined ? ` · ×${Math.round(weight * 100)}%` : ""}
        </span>
        <span className="font-semibold tabular-nums">{pct(clamped)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            clamped >= 0.75 ? "bg-emerald-500" : clamped >= 0.45 ? "bg-amber-500" : "bg-rose-500",
          )}
          style={{ width: `${clamped * 100}%` }}
        />
      </div>
    </div>
  );
}
