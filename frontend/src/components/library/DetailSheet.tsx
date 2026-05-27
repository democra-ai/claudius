import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryRow } from "@/types";
import { Glyph, STATE_LABEL } from "./Glyph";

interface DetailSheetProps {
  row: LibraryRow | null;
  onClose: () => void;
}

/**
 * Right-rail detail panel. Slides in (CSS-driven) when a row is selected.
 * Shows per-profile state, detail value, and digest excerpt so power users
 * can see at a glance why a row is "diverged".
 */
export function DetailSheet({ row, onClose }: DetailSheetProps) {
  return (
    <aside
      className={cn(
        "border-l bg-card transition-[width,opacity] duration-200 ease-out",
        row ? "w-80 opacity-100" : "pointer-events-none w-0 opacity-0",
      )}
    >
      {row ? (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-2 border-b px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate font-mono text-sm">{row.label}</div>
              {row.label !== row.id ? (
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {row.id}
                </div>
              ) : null}
              {row.description ? (
                <p className="mt-1 font-sans text-xs text-muted-foreground/90">
                  {row.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3 font-mono text-xs">
            <ul className="space-y-2">
              {row.cells.map((cell) => (
                <li
                  key={cell.install_id}
                  className="rounded border bg-muted/20 p-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate uppercase tracking-wider text-foreground/80">
                      {cell.kind === "default" ? "default" : cell.install_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Glyph state={cell.state} size="sm" />
                      <span className="text-[10px] text-muted-foreground">
                        {STATE_LABEL[cell.state].toLowerCase()}
                      </span>
                    </span>
                  </div>
                  {cell.detail ? (
                    <div className="break-all text-[11px] text-foreground/80">
                      {cell.detail}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60">—</div>
                  )}
                  {cell.digest ? (
                    <div className="mt-1 text-[9px] text-muted-foreground/60">
                      digest:{cell.digest.slice(0, 8)}
                    </div>
                  ) : null}
                  {cell.link_target_digest ? (
                    <div className="text-[9px] text-muted-foreground/60">
                      link-group:{cell.link_target_digest.slice(0, 8)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
