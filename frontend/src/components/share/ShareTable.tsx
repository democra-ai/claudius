import { useMemo } from "react";
import { Search, Inbox } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShareRow } from "@/types";

interface ShareTableProps {
  rows: ShareRow[];
  pending: Map<string, boolean>;
  search: string;
  setSearch: (next: string) => void;
  onToggle: (row: ShareRow, nextChecked: boolean) => void;
  /** Names rendered in the column headers. */
  columnA: string;
  columnB: string;
  /** Optional empty-state hint per content kind. */
  emptyHint?: string;
}

function effectiveShared(row: ShareRow, pending: Map<string, boolean>): boolean {
  return pending.has(row.id) ? Boolean(pending.get(row.id)) : row.shared;
}

function statusBadge(row: ShareRow, pending: Map<string, boolean>) {
  if (pending.has(row.id)) return <Badge variant="warning">Pending</Badge>;
  if (row.partial) return <Badge variant="warning">Partial</Badge>;
  if (row.shared) return <Badge variant="success">Shared</Badge>;
  if (row.source_present && row.target_present)
    return <Badge variant="muted">Independent</Badge>;
  if (row.source_present) return <Badge variant="outline">Only A</Badge>;
  if (row.target_present) return <Badge variant="outline">Only B</Badge>;
  return <Badge variant="outline">Missing</Badge>;
}

function presence(present: boolean, detail: string | undefined) {
  if (!present) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-foreground">
      {detail ?? "Present"}
    </span>
  );
}

export function ShareTable({
  rows,
  pending,
  search,
  setSearch,
  onToggle,
  columnA,
  columnB,
  emptyHint,
}: ShareTableProps) {
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.id.toLowerCase().includes(needle) ||
        (row.label?.toLowerCase().includes(needle) ?? false),
    );
  }, [rows, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Items</h3>
          <p className="text-xs text-muted-foreground">
            {rows.length} total ·{" "}
            {rows.filter((row) => effectiveShared(row, pending)).length} shared
            {pending.size ? ` · ${pending.size} pending` : ""}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by id"
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-[44px_minmax(0,1fr)_140px_140px_120px] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Share</span>
        <span>Item</span>
        <span className="truncate">{columnA}</span>
        <span className="truncate">{columnB}</span>
        <span>Status</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <p className="text-sm">
              {emptyHint ?? "Nothing to compare in this category."}
            </p>
          </div>
        ) : (
          filtered.map((row) => {
            const checked = effectiveShared(row, pending);
            const isPending = pending.has(row.id);
            return (
              <label
                key={row.id}
                className={cn(
                  "grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_140px_140px_120px] items-center gap-3 border-b px-4 py-2 text-sm transition-colors hover:bg-accent/40",
                  checked && "bg-primary/5",
                  isPending && "bg-amber-500/5",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    onToggle(row, value === true)
                  }
                />
                <div className="min-w-0">
                  <div className="truncate font-medium" title={row.id}>
                    {row.label ?? row.id}
                  </div>
                  {row.label && row.label !== row.id ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {row.id}
                    </div>
                  ) : null}
                </div>
                <span className="truncate text-xs">
                  {presence(row.source_present, row.source_detail)}
                </span>
                <span className="truncate text-xs">
                  {presence(row.target_present, row.target_detail)}
                </span>
                <span>{statusBadge(row, pending)}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
