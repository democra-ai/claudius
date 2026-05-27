import { useMemo } from "react";
import { Search, Inbox, Quote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PairCodeProjectShare } from "@/types";

interface HistoryTableProps {
  rows: PairCodeProjectShare[];
  pending: Map<string, boolean>;
  search: string;
  setSearch: (next: string) => void;
  onToggle: (row: PairCodeProjectShare, nextChecked: boolean) => void;
  /** First-message previews keyed by project id. May be empty during load. */
  previews: Map<string, string | null>;
  columnA: string;
  columnB: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatRelative(ms: number): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}

function effectiveShared(
  row: PairCodeProjectShare,
  pending: Map<string, boolean>,
): boolean {
  return pending.has(row.id) ? Boolean(pending.get(row.id)) : row.shared;
}

function statusBadge(
  row: PairCodeProjectShare,
  pending: Map<string, boolean>,
) {
  if (pending.has(row.id)) return <Badge variant="warning">Pending</Badge>;
  if (row.shared) return <Badge variant="success">Linked</Badge>;
  if (row.source_present && row.target_present)
    return <Badge variant="muted">Independent</Badge>;
  if (row.source_present) return <Badge variant="outline">Only A</Badge>;
  if (row.target_present) return <Badge variant="outline">Only B</Badge>;
  return <Badge variant="outline">Missing</Badge>;
}

function presence(
  present: boolean,
  count: number,
  bytes: number,
  ts: number,
) {
  if (!present) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="leading-tight">
      <div className="text-foreground">
        {count} session{count === 1 ? "" : "s"} · {formatBytes(bytes)}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {formatRelative(ts)}
      </div>
    </div>
  );
}

export function HistoryTable({
  rows,
  pending,
  search,
  setSearch,
  onToggle,
  previews,
  columnA,
  columnB,
}: HistoryTableProps) {
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      if (row.id.toLowerCase().includes(needle)) return true;
      if (row.display_path.toLowerCase().includes(needle)) return true;
      const preview = previews.get(row.id);
      return preview ? preview.toLowerCase().includes(needle) : false;
    });
  }, [rows, search, previews]);

  const totalShared = useMemo(
    () => rows.filter((row) => effectiveShared(row, pending)).length,
    [rows, pending],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Projects</h3>
          <p className="text-xs text-muted-foreground">
            {rows.length} total · {totalShared} shared
            {pending.size ? ` · ${pending.size} pending` : ""} · live symlink
          </p>
        </div>
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by path or preview"
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-[44px_minmax(0,1fr)_180px_180px_120px] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Share</span>
        <span>Project</span>
        <span className="truncate">{columnA}</span>
        <span className="truncate">{columnB}</span>
        <span>Status</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <p className="text-sm">No projects match this filter.</p>
          </div>
        ) : (
          filtered.map((row) => {
            const checked = effectiveShared(row, pending);
            const isPending = pending.has(row.id);
            const preview = previews.get(row.id);
            return (
              <label
                key={row.id}
                className={cn(
                  "grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_180px_180px_120px] items-start gap-3 border-b px-4 py-2.5 text-sm transition-colors hover:bg-accent/40",
                  checked && "bg-primary/5",
                  isPending && "bg-amber-500/5",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => onToggle(row, value === true)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div
                    className="truncate font-medium"
                    title={row.display_path}
                  >
                    {row.display_path || row.id}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {row.id}
                  </div>
                  {preview ? (
                    <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                      <Quote className="mt-0.5 h-3 w-3 shrink-0 opacity-60" />
                      <span className="line-clamp-2 italic">{preview}</span>
                    </div>
                  ) : null}
                </div>
                <span className="text-xs">
                  {presence(
                    row.source_present,
                    row.source_session_count,
                    row.source_bytes,
                    row.source_last_modified_ms,
                  )}
                </span>
                <span className="text-xs">
                  {presence(
                    row.target_present,
                    row.target_session_count,
                    row.target_bytes,
                    row.target_last_modified_ms,
                  )}
                </span>
                <span className="pt-0.5">{statusBadge(row, pending)}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
