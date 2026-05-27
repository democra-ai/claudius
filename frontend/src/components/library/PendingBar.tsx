import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingBarProps {
  count: number;
  applying: boolean;
  onApply: () => void;
  onCancel: () => void;
}

/**
 * Floating action bar that slides up from bottom-center when pending > 0.
 * Two actions: Apply (primary) and Cancel (subtle). Disabled during apply.
 */
export function PendingBar({ count, applying, onApply, onCancel }: PendingBarProps) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        "pending-slide fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded border bg-popover/95 p-1 backdrop-blur",
        "shadow-[0_0_0_1px_hsl(var(--border)),0_8px_24px_-12px_rgba(0,0,0,0.4)]",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs">
        <span className="tabular-nums text-foreground">{count}</span>
        <span className="text-muted-foreground">pending</span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={applying}
        className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
      >
        <X className="h-3 w-3" />
        cancel
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
      >
        {applying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        apply
      </button>
    </div>
  );
}
