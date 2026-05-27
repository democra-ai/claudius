import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CellState, LibraryCell } from "@/types";
import { Glyph, STATE_LABEL } from "./Glyph";

interface MatrixCellProps {
  cell: LibraryCell;
  rowId: string;
  /** Map of `${rowId}:${install_id}` → desired-present (only when toggled). */
  pending: Map<string, boolean>;
  onToggle: (rowId: string, installId: string, nextPresent: boolean) => void;
}

/** Predicted post-toggle state of the cell. Used to render the pending glyph
 *  optimistically while keeping the original state in `cell.state`. */
function predictedState(
  cell: LibraryCell,
  nextPresent: boolean | undefined,
): CellState {
  if (nextPresent === undefined) return cell.state;
  if (nextPresent === cell.present) return cell.state;
  // Toggling: present→absent or absent→independent. Real state is recomputed
  // on next refresh — this is just a hint for the user mid-edit.
  return nextPresent ? "independent" : "absent";
}

export function MatrixCell({ cell, rowId, pending, onToggle }: MatrixCellProps) {
  const pendingKey = `${rowId}:${cell.install_id}`;
  const desired = pending.get(pendingKey);
  const isPending = desired !== undefined;
  const effectiveState = predictedState(cell, desired);

  const tooltip = useMemo(() => {
    const lines = [
      `${cell.install_name}`,
      STATE_LABEL[effectiveState] + (isPending ? " · pending" : ""),
    ];
    if (cell.detail) lines.push(cell.detail);
    return lines.join(" — ");
  }, [cell, effectiveState, isPending]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() =>
            onToggle(rowId, cell.install_id, !cell.present /* desired */)
          }
          className={cn(
            "flex h-9 w-full items-center justify-center transition-colors",
            "hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPending && "bg-amber-500/8 ring-1 ring-inset ring-amber-500/30",
            cell.kind === "default" && "bg-muted/30",
          )}
          aria-label={tooltip}
          type="button"
        >
          <Glyph state={effectiveState} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-[11px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
