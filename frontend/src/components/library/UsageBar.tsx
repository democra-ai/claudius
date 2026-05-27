import { cn } from "@/lib/utils";

interface UsageBarProps {
  /** Section title — what the bar represents. */
  title: string;
  /** Optional right-aligned metadata on the title row. */
  meta?: React.ReactNode;
  /** Value in the same unit as `scale`. Drives bar width. */
  value: number;
  /** Upper bound for the bar fill. The bar fills (value/scale) %, capped at 1. */
  scale: number;
  /** Primary label below the bar (e.g. "12 sessions"). */
  label: string;
  /** Right-aligned secondary text below the bar (e.g. "Resets in 4h"). */
  trailing?: React.ReactNode;
  /** Optional tertiary muted line below — used for pace tracking. */
  pace?: React.ReactNode;
  /** Variant tints the fill differently when usage is concerning. */
  tone?: "default" | "warn" | "high";
}

/**
 * Codexbar-style usage bar. Title row, hairline bar, two-line footer.
 * The bar is intentionally thin (3px) — it reads as a typographic
 * underline, not a chunky progress widget.
 */
export function UsageBar({
  title,
  meta,
  value,
  scale,
  label,
  trailing,
  pace,
  tone = "default",
}: UsageBarProps) {
  const pct = scale > 0 ? Math.min(1, value / scale) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-sans text-[12px] font-medium leading-none text-foreground/90">
          {title}
        </h4>
        {meta ? (
          <span className="font-sans text-[10px] text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out",
            tone === "high" && "bg-destructive",
            tone === "warn" && "bg-amber-500",
            tone === "default" && "bg-primary",
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-0.5">
        <span className="font-sans text-[11px] text-foreground/80">
          {label}
        </span>
        {trailing ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {trailing}
          </span>
        ) : null}
      </div>
      {pace ? (
        <div className="font-sans text-[10px] text-muted-foreground/80">
          {pace}
        </div>
      ) : null}
    </div>
  );
}
