import { Loader2, Folder, Link2, Unlink, MessagesSquare, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DesktopCodeHistoryStat, PairDesktopCodeHistory } from "@/types";

interface CodeHistoryCardProps {
  data: PairDesktopCodeHistory | null;
  loading: boolean;
  applying: boolean;
  /** Profile labels used in the column headers. */
  columnA: string;
  columnB: string;
  /** Called with the desired next "shared" state. */
  onToggle: (nextShared: boolean) => void;
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

function StatBlock({
  title,
  stat,
  needsBootstrap,
}: {
  title: string;
  stat: DesktopCodeHistoryStat;
  needsBootstrap: boolean;
}) {
  if (!stat.present && !needsBootstrap) {
    // Logged in (we have account/org), just hasn't used Code yet.
    // Sharing still works (we pre-create the symlink).
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No history yet — but ready to link.
        </p>
        {stat.primary_workspace ? (
          <div
            className="mt-2 truncate text-[11px] text-muted-foreground"
            title={`account ${stat.primary_workspace.device_id} · org ${stat.primary_workspace.workspace_id}`}
          >
            org <span className="font-mono">{stat.primary_workspace.workspace_id.slice(0, 8)}…</span>
          </div>
        ) : null}
      </div>
    );
  }
  if (!stat.present) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No history yet.</p>
        <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-900 dark:text-amber-200">
          <div className="font-medium">Not signed in.</div>
          <div className="opacity-80">
            Launch Claude Desktop on this profile and complete login, then
            return here.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {stat.session_count}
        </span>
        <span className="text-xs text-muted-foreground">
          session{stat.session_count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {formatBytes(stat.total_bytes)} · {formatRelative(stat.last_activity_ms)}
      </div>
      {needsBootstrap ? (
        <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-900 dark:text-amber-200">
          <div className="font-medium">Not signed in.</div>
          <div className="opacity-80">
            Launch Claude Desktop on this profile and complete login first.
          </div>
        </div>
      ) : stat.primary_workspace ? (
        <div
          className="mt-3 truncate text-[11px] text-muted-foreground"
          title={`account ${stat.primary_workspace.device_id} · org ${stat.primary_workspace.workspace_id}`}
        >
          org <span className="font-mono">{stat.primary_workspace.workspace_id.slice(0, 8)}…</span>
        </div>
      ) : null}
      {stat.recent_cwds.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t pt-2">
          {stat.recent_cwds.map((cwd) => (
            <li
              key={cwd}
              className="flex items-start gap-1.5 text-xs text-muted-foreground"
              title={cwd}
            >
              <Folder className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{cwd}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatusBadge({
  shared,
  applying,
}: {
  shared: boolean;
  applying: boolean;
}) {
  if (applying) return <Badge variant="warning">Applying…</Badge>;
  return shared ? (
    <Badge variant="success">Linked (live)</Badge>
  ) : (
    <Badge variant="muted">Independent</Badge>
  );
}

export function CodeHistoryCard({
  data,
  loading,
  applying,
  columnA,
  columnB,
  onToggle,
}: CodeHistoryCardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-start gap-2">
          <MessagesSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Claude Code Session History</h3>
            <p className="text-xs text-muted-foreground">
              Click Share once. Both Desktop accounts will see the same Code
              chat history immediately on next launch — no extra steps. Login
              state, cookies and account identity stay isolated per profile.
            </p>
          </div>
        </div>
        <div className="pt-0.5">
          {loading ? (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading
            </Badge>
          ) : (
            <StatusBadge shared={Boolean(data?.shared)} applying={applying} />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reading session metadata…
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatBlock
                title={columnA}
                stat={data.source}
                needsBootstrap={data.source_needs_bootstrap}
              />
              <StatBlock
                title={columnB}
                stat={data.target}
                needsBootstrap={data.target_needs_bootstrap}
              />
            </div>

            {data.legacy_whole_dir_link ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
                <div className="text-amber-900 dark:text-amber-200">
                  <div className="font-medium">Legacy share detected.</div>
                  <p className="mt-0.5 text-xs">
                    A previous version of this app linked the whole{" "}
                    <code className="font-mono">claude-code-sessions/</code>{" "}
                    folder, which Claude Desktop doesn't read across accounts
                    (it filters by per-profile <code className="font-mono">deviceId</code>).
                    Toggling this card will replace it with a workspace-level
                    link that actually works.
                  </p>
                </div>
              </div>
            ) : null}

            {data.shared ? (
              <div
                className={cn(
                  "mt-5 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm",
                )}
              >
                <Link2 className="mt-0.5 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <div className="text-emerald-900 dark:text-emerald-200">
                  <div className="font-medium">
                    {data.direction === "source-to-target"
                      ? `${columnB} is linked to ${columnA}'s history.`
                      : `${columnA} is linked to ${columnB}'s history.`}
                  </div>
                  <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    New conversations from either account appear in both
                    profiles instantly. Login state stays separate.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-medium">Histories are independent.</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Click Share to link {columnB}'s Code workspace to{" "}
                    {columnA}'s in one shot. {columnB}'s existing sessions
                    (if any) are auto-backed-up first.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
        {data && (data.shared || data.legacy_whole_dir_link) ? (
          <Button
            variant="outline"
            size="sm"
            disabled={applying}
            onClick={() => onToggle(false)}
          >
            <Unlink className="h-3.5 w-3.5" />
            Unshare (copy {columnB} independent)
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={
              applying ||
              loading ||
              !data ||
              data.source_needs_bootstrap ||
              data.target_needs_bootstrap
            }
            onClick={() => onToggle(true)}
            title={
              data?.target_needs_bootstrap
                ? `${columnB} hasn't completed login yet — launch it once and finish login first.`
                : data?.source_needs_bootstrap
                ? `${columnA} hasn't completed login yet — launch it once and finish login first.`
                : undefined
            }
          >
            <Link2 className="h-3.5 w-3.5" />
            Share {columnA} → {columnB}
          </Button>
        )}
      </div>
    </div>
  );
}
