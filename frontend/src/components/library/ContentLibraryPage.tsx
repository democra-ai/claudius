import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api, isTauri } from "@/lib/api";
import { useToasts } from "@/hooks/useToast";
import type {
  DesktopInstall,
  LibraryCellChange,
  LibraryKind,
  LibraryRow,
} from "@/types";
import { KindNav, computeKindCount } from "./KindNav";
import { Matrix } from "./Matrix";
import { DetailSheet } from "./DetailSheet";
import { PendingBar } from "./PendingBar";

const EMPTY_HINTS: Record<LibraryKind, string> = {
  extensions: "// no extensions installed in any profile",
  mcp_servers: "// no mcpServers in any claude_desktop_config.json",
  cowork_skills: "// no Cowork skills — open Cowork in any profile once",
  preferences: "// allowlisted preferences not set in any profile",
};

interface SidebarProfileRowProps {
  profile: DesktopInstall;
  visible: boolean;
  onToggleVisible: () => void;
  onLaunch: () => void;
  busy: boolean;
}

function SidebarProfileRow({
  profile,
  visible,
  onToggleVisible,
  onLaunch,
  busy,
}: SidebarProfileRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-sm px-2 py-1 transition-colors",
        visible ? "" : "opacity-50",
      )}
    >
      <Checkbox
        checked={visible}
        onCheckedChange={onToggleVisible}
        aria-label={`Show ${profile.name} column`}
      />
      <button
        type="button"
        onClick={onLaunch}
        disabled={busy}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left font-mono text-xs"
        title={`Launch ${profile.name}`}
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            profile.kind === "default" ? "bg-primary" : "bg-muted-foreground/60",
          )}
        />
        <span className="truncate">
          {profile.kind === "default" ? "default" : profile.name}
        </span>
        <Play className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}

export default function ContentLibraryPage() {
  const [installs, setInstalls] = useState<DesktopInstall[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [activeKind, setActiveKind] = useState<LibraryKind>("extensions");
  const [rowsByKind, setRowsByKind] = useState<
    Partial<Record<LibraryKind, LibraryRow[]>>
  >({});
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loadingKind, setLoadingKind] = useState<LibraryKind | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const { toasts, push, dismiss } = useToasts();

  const visibleProfiles = useMemo(
    () => installs.filter((i) => visibleIds.has(i.id)),
    [installs, visibleIds],
  );

  const counts = useMemo(() => {
    const out: Partial<
      Record<LibraryKind, { synced: number; total: number } | null>
    > = {};
    for (const kind of [
      "extensions",
      "mcp_servers",
      "cowork_skills",
      "preferences",
    ] as LibraryKind[]) {
      const rows = rowsByKind[kind];
      out[kind] = rows ? computeKindCount(rows) : null;
    }
    return out;
  }, [rowsByKind]);

  const loadInstalls = useCallback(async () => {
    if (!isTauri()) {
      push("Open via the Tauri shell to manage real profiles.", "info");
      return;
    }
    setBusy(true);
    try {
      const list = await api.listDesktopInstalls();
      setInstalls(list);
      setVisibleIds((current) => {
        if (current.size === 0) return new Set(list.map((p) => p.id));
        const valid = new Set<string>();
        for (const p of list) if (current.has(p.id)) valid.add(p.id);
        // If filter dropped to zero (e.g., all profiles removed), show everything.
        return valid.size === 0 ? new Set(list.map((p) => p.id)) : valid;
      });
    } catch (e) {
      push(String(e), "error");
    } finally {
      setBusy(false);
    }
  }, [push]);

  const loadKind = useCallback(
    async (kind: LibraryKind) => {
      if (!isTauri()) return;
      setLoadingKind(kind);
      try {
        const rows = await api.listLibrary(kind);
        setRowsByKind((current) => ({ ...current, [kind]: rows }));
      } catch (e) {
        push(String(e), "error");
      } finally {
        setLoadingKind(null);
      }
    },
    [push],
  );

  useEffect(() => {
    loadInstalls();
  }, [loadInstalls]);

  useEffect(() => {
    loadKind(activeKind);
  }, [activeKind, loadKind, installs.length]);

  // Refresh visible-kind data when the active set of profiles changes.
  // (Adding a profile means a new column.)
  useEffect(() => {
    if (installs.length === 0) return;
    loadKind(activeKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installs.length]);

  const handleCellToggle = useCallback(
    (rowId: string, installId: string, nextPresent: boolean) => {
      const rows = rowsByKind[activeKind];
      const row = rows?.find((r) => r.id === rowId);
      const cell = row?.cells.find((c) => c.install_id === installId);
      if (!cell) return;
      const key = `${rowId}:${installId}`;
      setPending((current) => {
        const next = new Map(current);
        // If the toggle returns to the original state, drop the pending entry.
        if (nextPresent === cell.present) {
          next.delete(key);
        } else {
          next.set(key, nextPresent);
        }
        return next;
      });
    },
    [rowsByKind, activeKind],
  );

  const handleApply = useCallback(async () => {
    if (pending.size === 0) return;
    const changes: LibraryCellChange[] = [];
    for (const [key, wants] of pending.entries()) {
      const sep = key.lastIndexOf(":");
      const rowId = key.slice(0, sep);
      const installId = key.slice(sep + 1);
      changes.push({ row_id: rowId, target_install_id: installId, wants });
    }
    setApplying(true);
    try {
      const summary = await api.applyLibraryChanges(activeKind, changes);
      push(
        `applied: ${summary.copied}, skipped: ${summary.skipped}`,
        "success",
      );
      setPending(new Map());
      await loadKind(activeKind);
    } catch (e) {
      push(String(e), "error");
    } finally {
      setApplying(false);
    }
  }, [pending, activeKind, loadKind, push]);

  const handleCancel = useCallback(() => setPending(new Map()), []);

  const handleToggleVisible = useCallback((installId: string) => {
    setVisibleIds((current) => {
      const next = new Set(current);
      if (next.has(installId)) next.delete(installId);
      else next.add(installId);
      return next;
    });
  }, []);

  const handleLaunch = useCallback(
    async (install: DesktopInstall) => {
      setBusy(true);
      try {
        await api.launchDesktopInstall(install.id);
        push(`launching ${install.name}…`, "info");
      } catch (e) {
        push(String(e), "error");
      } finally {
        setBusy(false);
      }
    },
    [push],
  );

  const handleCreate = useCallback(async () => {
    const name = newProfileName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await api.createDesktopProfile(name);
      push(`created profile "${created.name}"`, "success");
      setNewProfileName("");
      await loadInstalls();
    } catch (e) {
      push(String(e), "error");
    } finally {
      setBusy(false);
    }
  }, [newProfileName, loadInstalls, push]);

  // Filter rows to the visible-profile subset by zeroing absent cells
  // we don't render. Matrix.tsx itself doesn't need filtering — it iterates
  // over the profiles list — so we can pass full rows + filtered profiles.
  const activeRows = rowsByKind[activeKind] ?? [];
  const selectedRow = selectedRowId
    ? activeRows.find((r) => r.id === selectedRowId) ?? null
    : null;

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left rail */}
      <aside className="flex w-56 flex-col gap-3 border-r bg-card/40 py-3">
        <KindNav
          value={activeKind}
          onChange={(k) => {
            setActiveKind(k);
            setPending(new Map());
            setSelectedRowId(null);
          }}
          counts={counts}
        />

        <div className="border-t pt-3">
          <div className="mb-1 flex items-center justify-between px-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <span>profiles</span>
            <span className="tabular-nums">
              {visibleIds.size}/{installs.length}
            </span>
          </div>
          <div className="px-1">
            {installs.map((p) => (
              <SidebarProfileRow
                key={p.id}
                profile={p}
                visible={visibleIds.has(p.id)}
                onToggleVisible={() => handleToggleVisible(p.id)}
                onLaunch={() => handleLaunch(p)}
                busy={busy}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t px-2 pt-3">
          <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            new desktop profile
          </div>
          <div className="flex gap-1">
            <Input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              placeholder="name"
              className="h-7 font-mono text-xs"
              disabled={busy}
            />
            <Button
              type="button"
              size="icon"
              onClick={handleCreate}
              disabled={busy || !newProfileName.trim()}
              className="h-7 w-7"
              aria-label="Create profile"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Center: matrix */}
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        {toasts.length > 0 ? (
          <div className="space-y-1">
            {toasts.map((toast) => (
              <button
                key={toast.id}
                onClick={() => dismiss(toast.id)}
                className={cn(
                  "block w-full rounded-sm border px-3 py-1.5 text-left font-mono text-[11px] transition-colors",
                  toast.kind === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : toast.kind === "success"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-foreground",
                )}
              >
                {toast.message}
              </button>
            ))}
          </div>
        ) : null}

        {visibleProfiles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p className="font-mono text-xs">
              // no profiles visible — toggle one on the left
            </p>
          </div>
        ) : (
          <Matrix
            rows={activeRows}
            profiles={visibleProfiles}
            pending={pending}
            onCellToggle={handleCellToggle}
            onRowSelect={setSelectedRowId}
            selectedRowId={selectedRowId}
            loading={loadingKind === activeKind}
            emptyHint={EMPTY_HINTS[activeKind]}
          />
        )}
      </main>

      {/* Right rail: detail */}
      <DetailSheet row={selectedRow} onClose={() => setSelectedRowId(null)} />

      {/* Floating pending bar */}
      <PendingBar
        count={pending.size}
        applying={applying}
        onApply={handleApply}
        onCancel={handleCancel}
      />
    </div>
  );
}
