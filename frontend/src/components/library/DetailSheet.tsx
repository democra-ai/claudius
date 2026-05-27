import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesktopInstall, LibraryRow } from "@/types";
import { Glyph, STATE_LABEL } from "./Glyph";
import { ProfileDetail } from "./ProfileDetail";

export type Selection =
  | { type: "row"; row: LibraryRow }
  | { type: "profile"; install: DesktopInstall }
  | null;

interface DetailSheetProps {
  selection: Selection;
  onClose: () => void;
  onLaunch: (install: DesktopInstall) => void;
  resolveInstallName: (installId: string) => string | undefined;
}

/**
 * Right-rail detail panel. Dispatches between a row-level summary (matrix
 * content item) and a profile-level summary (codexbar-style stats).
 * Slides in from the right when something is selected.
 */
export function DetailSheet({
  selection,
  onClose,
  onLaunch,
  resolveInstallName,
}: DetailSheetProps) {
  const visible = selection !== null;
  return (
    <aside
      className={cn(
        "border-l bg-card transition-[width,opacity] duration-220 ease-out",
        visible ? "w-80 opacity-100" : "pointer-events-none w-0 opacity-0",
      )}
    >
      {selection?.type === "profile" ? (
        <ProfileDetail
          install={selection.install}
          onClose={onClose}
          onLaunch={onLaunch}
          resolveName={resolveInstallName}
        />
      ) : selection?.type === "row" ? (
        <RowDetail
          row={selection.row}
          onClose={onClose}
          resolveInstallName={resolveInstallName}
        />
      ) : null}
    </aside>
  );
}

function RowDetail({
  row,
  onClose,
  resolveInstallName,
}: {
  row: LibraryRow;
  onClose: () => void;
  resolveInstallName: (installId: string) => string | undefined;
}) {
  return (
    <div className="sheet-slide flex h-full flex-col">
      <header className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Item
          </div>
          <div className="mt-0.5 truncate font-display text-lg leading-tight">
            {row.label}
          </div>
          {row.label !== row.id ? (
            <div className="truncate font-mono text-[10px] text-muted-foreground/80">
              {row.id}
            </div>
          ) : null}
          {row.description ? (
            <p className="mt-1.5 font-sans text-xs text-muted-foreground/90">
              {row.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close details"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3">
        <ul className="space-y-1.5">
          {row.cells.map((cell) => (
            <li
              key={cell.install_id}
              className="rounded-md bg-muted/30 px-3 py-2"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-sans text-xs text-foreground/85">
                  {resolveInstallName(cell.install_id) ?? cell.install_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Glyph state={cell.state} size="sm" />
                  <span className="font-sans text-[10px] text-muted-foreground">
                    {STATE_LABEL[cell.state].toLowerCase()}
                  </span>
                </span>
              </div>
              {cell.detail ? (
                <div className="break-words font-mono text-[11px] text-foreground/80">
                  {cell.detail}
                </div>
              ) : (
                <div className="font-mono text-[11px] text-muted-foreground/60">
                  —
                </div>
              )}
              {cell.digest || cell.link_target_digest ? (
                <div className="mt-1 flex gap-2 font-mono text-[9px] text-muted-foreground/60">
                  {cell.digest ? <span>val:{cell.digest.slice(0, 8)}</span> : null}
                  {cell.link_target_digest ? (
                    <span>link:{cell.link_target_digest.slice(0, 8)}</span>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
