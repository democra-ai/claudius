import { useMemo } from "react";
import { Search, Settings2, Sparkles, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PairPreferenceShare, PreferenceScope } from "@/types";

interface PreferencesTableProps {
  rows: PairPreferenceShare[];
  /** Map keyed by `${scope}:${key}`. */
  pending: Map<string, boolean>;
  search: string;
  setSearch: (next: string) => void;
  onToggle: (row: PairPreferenceShare, nextChecked: boolean) => void;
  columnA: string;
  columnB: string;
}

export function rowKey(row: PairPreferenceShare): string {
  return `${row.scope}:${row.key}`;
}

function effectiveCopied(
  row: PairPreferenceShare,
  pending: Map<string, boolean>,
): boolean {
  const k = rowKey(row);
  return pending.has(k) ? Boolean(pending.get(k)) : row.copied;
}

function scopeLabel(scope: PreferenceScope): string {
  return scope === "ui" ? "UI settings" : "Cowork preferences";
}

function scopeIcon(scope: PreferenceScope) {
  return scope === "ui" ? Sparkles : Settings2;
}

/** Render any JSON value as a compact one-line string, with type-aware sugar. */
function previewValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" || typeof value === "string")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function statusBadge(row: PairPreferenceShare, pending: Map<string, boolean>) {
  if (pending.has(rowKey(row))) return <Badge variant="warning">Pending</Badge>;
  if (row.copied) return <Badge variant="success">Copied</Badge>;
  if (row.source_present && row.target_present)
    return <Badge variant="muted">Diverged</Badge>;
  if (row.source_present) return <Badge variant="outline">Only A</Badge>;
  if (row.target_present) return <Badge variant="outline">Only B</Badge>;
  return <Badge variant="outline">Unset</Badge>;
}

export function PreferencesTable({
  rows,
  pending,
  search,
  setSearch,
  onToggle,
  columnA,
  columnB,
}: PreferencesTableProps) {
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.key.toLowerCase().includes(needle) ||
        row.label.toLowerCase().includes(needle),
    );
  }, [rows, search]);

  // Group by scope so the user sees a clear UI vs Cowork split.
  const grouped = useMemo(() => {
    const byScope = new Map<PreferenceScope, PairPreferenceShare[]>();
    for (const row of filtered) {
      const bucket = byScope.get(row.scope) ?? [];
      bucket.push(row);
      byScope.set(row.scope, bucket);
    }
    return Array.from(byScope.entries());
  }, [filtered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Preferences</h3>
          <p className="text-xs text-muted-foreground">
            Allowlisted keys only — account-bound prefs and Electron state stay
            isolated.{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 align-middle text-muted-foreground/80">
                  <Lock className="h-3 w-3" />
                  why?
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Some keys (auth tokens, account-keyed permission grants) would
                break the second profile if copied. The backend rejects writes
                to anything outside this allowlist.
              </TooltipContent>
            </Tooltip>
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by key"
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-[44px_minmax(0,1fr)_180px_180px_110px] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Copy</span>
        <span>Key</span>
        <span className="truncate">{columnA}</span>
        <span className="truncate">{columnB}</span>
        <span>Status</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-50" />
            <p className="text-sm">No matching preference keys.</p>
          </div>
        ) : (
          grouped.map(([scope, scopeRows]) => {
            const Icon = scopeIcon(scope);
            return (
              <div key={scope}>
                <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {scopeLabel(scope)}
                </div>
                {scopeRows.map((row) => {
                  const checked = effectiveCopied(row, pending);
                  const isPending = pending.has(rowKey(row));
                  return (
                    <label
                      key={rowKey(row)}
                      className={cn(
                        "grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_180px_180px_110px] items-center gap-3 border-b px-4 py-2 text-sm transition-colors hover:bg-accent/40",
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
                        <div className="truncate font-medium" title={row.key}>
                          {row.label}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {row.key}
                        </div>
                      </div>
                      <span
                        className="truncate text-xs text-foreground"
                        title={previewValue(row.source_value)}
                      >
                        {row.source_present
                          ? previewValue(row.source_value)
                          : "—"}
                      </span>
                      <span
                        className="truncate text-xs text-foreground"
                        title={previewValue(row.target_value)}
                      >
                        {row.target_present
                          ? previewValue(row.target_value)
                          : "—"}
                      </span>
                      <span>{statusBadge(row, pending)}</span>
                    </label>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
