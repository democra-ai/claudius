import { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DesktopInstall, LibraryRow } from "@/types";
import { MatrixCell } from "./MatrixCell";
import { Glyph, STATE_GLYPH } from "./Glyph";

interface MatrixProps {
  rows: LibraryRow[];
  /** Profiles to render as columns, ordered. */
  profiles: DesktopInstall[];
  pending: Map<string, boolean>;
  onCellToggle: (rowId: string, installId: string, nextPresent: boolean) => void;
  onRowSelect: (rowId: string | null) => void;
  selectedRowId: string | null;
  loading: boolean;
  /** Optional empty-state message specific to the kind. */
  emptyHint?: string;
}

/**
 * The Grid — high-density matrix of (item × profile) cells.
 *
 * Layout:
 *   row 1: column headers (profile chips). Sticky top.
 *   row 2…N: content rows. Sticky left column = content label.
 *
 * Density rules:
 *   - Profile chips: uppercase JBM, no padding wider than the glyph beneath.
 *   - Row labels: lowercase mono, dim until row hover.
 *   - Cells: 36px tall, glyph centered, no border between cells horizontally
 *     (the row separator alone carries the grid feel).
 */
export function Matrix({
  rows,
  profiles,
  pending,
  onCellToggle,
  onRowSelect,
  selectedRowId,
  loading,
  emptyHint,
}: MatrixProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.id.toLowerCase().includes(needle) ||
        row.label.toLowerCase().includes(needle) ||
        (row.description?.toLowerCase().includes(needle) ?? false),
    );
  }, [rows, search]);

  // Per-profile alignment summary shown in column header.
  const columnSummary = useMemo(() => {
    return profiles.map((p) => {
      let present = 0;
      let shared = 0;
      let copied = 0;
      for (const row of rows) {
        const cell = row.cells.find((c) => c.install_id === p.id);
        if (!cell) continue;
        if (cell.present) present++;
        if (cell.state === "shared") shared++;
        if (cell.state === "copied") copied++;
      }
      return { installId: p.id, present, shared, copied };
    });
  }, [profiles, rows]);

  // Grid template: 280px for the label column, then equal-width for each profile.
  const gridTemplate = `280px repeat(${profiles.length}, minmax(72px, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border bg-card">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-4 py-2.5">
        <div className="font-sans text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums">{filtered.length}</span>
          <span className="opacity-50"> of </span>
          <span className="font-mono tabular-nums">{rows.length}</span>
          <span className="mx-2 opacity-30">·</span>
          <span className="font-mono tabular-nums">{profiles.length}</span> profile
          {profiles.length === 1 ? "" : "s"}
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter items"
            className="h-7 pl-8 font-sans text-xs"
          />
        </div>
      </div>

      {/* Sticky column header */}
      <div
        className="grid border-b bg-muted/30"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="border-r px-4 py-2 font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Item
        </div>
        {profiles.map((p, i) => {
          const summary = columnSummary[i];
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 leading-none",
                p.kind === "default" && "bg-muted/40",
              )}
              title={`${p.name}\n${summary.present} present · ${summary.shared} shared · ${summary.copied} copied`}
            >
              <span className="truncate font-sans text-[12px] font-medium text-foreground/90">
                {p.kind === "default" ? "Default" : p.name}
              </span>
              <span className="mt-0.5 font-mono text-[9px] tabular-nums text-muted-foreground/70">
                {summary.shared > 0 ? (
                  <span className="text-state-shared">
                    {STATE_GLYPH.shared} {summary.shared}
                  </span>
                ) : null}
                {summary.copied > 0 ? (
                  <span className="ml-1 text-state-copied">
                    {STATE_GLYPH.copied} {summary.copied}
                  </span>
                ) : null}
                {summary.shared === 0 && summary.copied === 0 ? (
                  <span>
                    {summary.present}/{rows.length}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3 text-muted-foreground">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <p className="font-sans text-sm">{emptyHint ?? "Nothing here yet."}</p>
          </div>
        ) : (
          <div className="stagger-children">
            {filtered.map((row, rowIdx) => {
              const isSelected = selectedRowId === row.id;
              return (
                <div
                  key={row.id}
                  className={cn(
                    "grid items-stretch grid-divider transition-colors",
                    isSelected
                      ? "bg-accent/15"
                      : "hover:bg-accent/8",
                  )}
                  style={{
                    gridTemplateColumns: gridTemplate,
                    animationDelay: `${Math.min(rowIdx * 12, 240)}ms`,
                  }}
                >
                  {/* Row label */}
                  <button
                    type="button"
                    onClick={() => onRowSelect(isSelected ? null : row.id)}
                    className={cn(
                      "flex flex-col items-start justify-center gap-0.5 border-r px-4 py-2 text-left transition-colors",
                      "hover:bg-muted/40",
                      isSelected && "border-l-2 border-l-primary",
                    )}
                    title={row.id}
                  >
                    <span
                      className={cn(
                        "truncate font-sans text-[13px]",
                        isSelected
                          ? "font-medium text-foreground"
                          : "text-foreground/85",
                      )}
                    >
                      {row.label}
                    </span>
                    {row.description ? (
                      <span className="line-clamp-1 font-sans text-[10px] text-muted-foreground/80">
                        {row.description}
                      </span>
                    ) : row.label !== row.id ? (
                      <span className="truncate font-mono text-[10px] text-muted-foreground/70">
                        {row.id}
                      </span>
                    ) : null}
                  </button>
                  {/* Cells */}
                  {profiles.map((p) => {
                    const cell = row.cells.find((c) => c.install_id === p.id);
                    if (!cell) {
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-center"
                        >
                          <Glyph state="absent" />
                        </div>
                      );
                    }
                    return (
                      <MatrixCell
                        key={p.id}
                        cell={cell}
                        rowId={row.id}
                        pending={pending}
                        onToggle={onCellToggle}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
