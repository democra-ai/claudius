import { useCallback, useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/Toolbar";
import { ProfileSidebar } from "@/components/profiles/ProfileSidebar";
import { PairSelector } from "@/components/share/PairSelector";
import {
  ShareTabs,
  defaultTabFor,
  isTabValidFor,
} from "@/components/share/ShareTabs";
import { ShareTable } from "@/components/share/ShareTable";
import { HistoryTable } from "@/components/share/HistoryTable";
import { CodeHistoryCard } from "@/components/share/CodeHistoryCard";
import { ComingSoonPane } from "@/components/share/ComingSoonPane";
import { Card, CardContent } from "@/components/ui/card";
import { api, isTauri } from "@/lib/api";
import { useToasts } from "@/hooks/useToast";
import {
  type ContentKind,
  type DesktopInstall,
  type CodeInstall,
  type PairCodeProjectShare,
  type PairDesktopCodeHistory,
  type PairExtensionShare,
  type Profile,
  type ShareRow,
  profileKey,
  profileLabel,
  profileRootPath,
} from "@/types";
import { cn } from "@/lib/utils";

function toShareRow(row: PairExtensionShare): ShareRow {
  return {
    id: row.id,
    source_present: row.source_has_extension,
    target_present: row.target_has_extension,
    source_detail: row.source_has_extension
      ? row.source_has_settings
        ? "Files + Settings"
        : "Files only"
      : undefined,
    target_detail: row.target_has_extension
      ? row.target_has_settings
        ? "Files + Settings"
        : "Files only"
      : undefined,
    shared: row.shared,
    partial: row.partial,
  };
}

function toProfileFromDesktop(install: DesktopInstall): Profile {
  return { ...install, category: "desktop" };
}

function toProfileFromCode(install: CodeInstall): Profile {
  return { ...install, category: "code" };
}

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [aKey, setAKey] = useState("");
  const [bKey, setBKey] = useState("");
  const [activeKind, setActiveKind] = useState<ContentKind>("extensions");

  // Per-tab data
  const [extensionRows, setExtensionRows] = useState<PairExtensionShare[]>([]);
  const [historyRows, setHistoryRows] = useState<PairCodeProjectShare[]>([]);
  const [historyPreviews, setHistoryPreviews] = useState<Map<string, string | null>>(
    new Map(),
  );
  const [desktopCodeHistory, setDesktopCodeHistory] =
    useState<PairDesktopCodeHistory | null>(null);
  const [desktopCodeHistoryLoading, setDesktopCodeHistoryLoading] = useState(false);
  const [desktopCodeHistoryApplying, setDesktopCodeHistoryApplying] = useState(false);

  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const a = useMemo(
    () => profiles.find((p) => profileKey(p) === aKey),
    [profiles, aKey],
  );
  const b = useMemo(
    () => profiles.find((p) => profileKey(p) === bKey),
    [profiles, bKey],
  );

  // The pair selector should only show profiles of the same category as A.
  // If A is unset, default to desktop so the dropdown is non-empty when there
  // are any desktop profiles.
  const activeCategory: Profile["category"] | undefined = a?.category ?? b?.category;
  const sameCategoryProfiles = useMemo(
    () =>
      activeCategory
        ? profiles.filter((p) => p.category === activeCategory)
        : profiles,
    [profiles, activeCategory],
  );

  const normalizePair = useCallback(
    (list: Profile[]) => {
      if (list.length === 0) {
        setAKey("");
        setBKey("");
        return;
      }
      setAKey((current) => {
        if (list.some((p) => profileKey(p) === current)) return current;
        // Prefer Desktop default first (matches old UX) when nothing is selected.
        const fallback =
          list.find((p) => p.category === "desktop" && p.kind === "default") ??
          list[0];
        return profileKey(fallback);
      });
      setBKey((current) => {
        if (list.some((p) => profileKey(p) === current)) return current;
        return "";
      });
    },
    [],
  );

  const loadInstalls = useCallback(async () => {
    if (!isTauri()) {
      push(
        "Open from the Tauri shell to manage real Claude profiles.",
        "info",
      );
      return;
    }
    setBusy(true);
    try {
      const [desktops, codes] = await Promise.all([
        api.listDesktopInstalls(),
        api.listCodeInstalls(),
      ]);
      const merged: Profile[] = [
        ...desktops.map(toProfileFromDesktop),
        ...codes.map(toProfileFromCode),
      ];
      setProfiles(merged);
      normalizePair(merged);
    } catch (error) {
      push(String(error), "error");
    } finally {
      setBusy(false);
    }
  }, [normalizePair, push]);

  // When A's category changes, drop B if it doesn't match.
  useEffect(() => {
    if (!a || !b) return;
    if (a.category !== b.category) {
      setBKey("");
      setPending(new Map());
    }
  }, [a, b]);

  // Snap activeKind to a tab valid for the current category.
  useEffect(() => {
    if (!activeCategory) return;
    if (!isTabValidFor(activeCategory, activeKind)) {
      setActiveKind(defaultTabFor(activeCategory));
    }
  }, [activeCategory, activeKind]);

  const loadExtensions = useCallback(async () => {
    if (!a || !b || a.category !== "desktop" || b.category !== "desktop") {
      setExtensionRows([]);
      return;
    }
    setBusy(true);
    try {
      const rows = await api.listPairSharing(a.data_dir, b.data_dir);
      setExtensionRows(rows);
      setPending(new Map());
    } catch (error) {
      push(String(error), "error");
    } finally {
      setBusy(false);
    }
  }, [a, b, push]);

  const loadDesktopCodeHistory = useCallback(async () => {
    if (!a || !b || a.category !== "desktop" || b.category !== "desktop") {
      setDesktopCodeHistory(null);
      return;
    }
    setDesktopCodeHistoryLoading(true);
    try {
      const data = await api.listPairDesktopCodeHistory(a.data_dir, b.data_dir);
      setDesktopCodeHistory(data);
    } catch (error) {
      push(String(error), "error");
      setDesktopCodeHistory(null);
    } finally {
      setDesktopCodeHistoryLoading(false);
    }
  }, [a, b, push]);

  const loadHistory = useCallback(async () => {
    if (!a || !b || a.category !== "code" || b.category !== "code") {
      setHistoryRows([]);
      setHistoryPreviews(new Map());
      return;
    }
    setBusy(true);
    try {
      const rows = await api.listPairCodeHistorySharing(
        a.config_dir,
        b.config_dir,
      );
      setHistoryRows(rows);
      setPending(new Map());
      // Lazy-fetch first-message previews from the source profile so the
      // table can show what each project was about. Keep this best-effort:
      // a failure here shouldn't block the share UI.
      try {
        const sourceProjects = await api.listCodeHistory(a.config_dir);
        const previews = new Map<string, string | null>();
        for (const proj of sourceProjects) {
          previews.set(proj.id, proj.first_message_preview);
        }
        setHistoryPreviews(previews);
      } catch {
        setHistoryPreviews(new Map());
      }
    } catch (error) {
      push(String(error), "error");
    } finally {
      setBusy(false);
    }
  }, [a, b, push]);

  useEffect(() => {
    loadInstalls();
  }, [loadInstalls]);

  // Refresh the active tab's data whenever the pair or tab changes.
  useEffect(() => {
    if (!a || !b || a.category !== b.category) return;
    if (activeKind === "extensions") loadExtensions();
    else if (activeKind === "history") loadHistory();
    else if (activeKind === "code_history") loadDesktopCodeHistory();
  }, [a, b, activeKind, loadExtensions, loadHistory, loadDesktopCodeHistory]);

  const handleToggleDesktopCodeHistory = useCallback(
    async (nextShared: boolean) => {
      if (!a || !b || a.category !== "desktop" || b.category !== "desktop") return;
      setDesktopCodeHistoryApplying(true);
      try {
        const summary = await api.applyPairDesktopCodeHistory(
          a.data_dir,
          b.data_dir,
          { shared: nextShared },
        );
        if (summary.copied > 0) {
          push(
            nextShared
              ? `Linked Code session history (${profileLabel(b)} → ${profileLabel(a)}).`
              : `Unshared Code session history; ${profileLabel(b)} now has its own copy.`,
            "success",
          );
        } else {
          push("No change applied — already in that state.", "info");
        }
        await loadDesktopCodeHistory();
      } catch (error) {
        push(String(error), "error");
      } finally {
        setDesktopCodeHistoryApplying(false);
      }
    },
    [a, b, loadDesktopCodeHistory, push],
  );

  const handleApply = useCallback(async () => {
    if (!a || !b || pending.size === 0) return;
    if (a.category !== b.category) return;

    setBusy(true);
    try {
      if (activeKind === "extensions" && a.category === "desktop") {
        const changes = Array.from(pending.entries()).map(([id, shared]) => ({
          extension_id: id,
          shared,
        }));
        const summary = await api.applyPairSharing(
          a.data_dir,
          (b as Profile & { category: "desktop" }).data_dir,
          changes,
        );
        push(
          `Applied: ${summary.copied} change${summary.copied === 1 ? "" : "s"}, ${summary.skipped} skipped`,
          "success",
        );
        await loadExtensions();
      } else if (activeKind === "history" && a.category === "code") {
        const changes = Array.from(pending.entries()).map(([id, shared]) => ({
          project_id: id,
          shared,
        }));
        const summary = await api.applyPairCodeHistorySharing(
          a.config_dir,
          (b as Profile & { category: "code" }).config_dir,
          changes,
        );
        push(
          `Applied: ${summary.copied} change${summary.copied === 1 ? "" : "s"}, ${summary.skipped} skipped`,
          "success",
        );
        await loadHistory();
      } else {
        push("Sharing for this category is not wired up yet.", "info");
      }
    } catch (error) {
      push(String(error), "error");
    } finally {
      setBusy(false);
    }
  }, [a, b, pending, activeKind, loadExtensions, loadHistory, push]);

  const handleCreate = useCallback(
    async (name: string) => {
      if (!isTauri()) return;
      setBusy(true);
      try {
        const created = await api.createDesktopProfile(name);
        push(`Created Desktop profile "${created.name}"`, "success");
        await loadInstalls();
      } catch (error) {
        push(String(error), "error");
      } finally {
        setBusy(false);
      }
    },
    [loadInstalls, push],
  );

  const handleLaunch = useCallback(
    async (profile: Profile) => {
      if (!isTauri()) return;
      if (profile.category !== "desktop") {
        push("Launching Code profiles from GUI is not supported yet — use your shell alias.", "info");
        return;
      }
      setBusy(true);
      try {
        await api.launchDesktopInstall(profile.id);
        push(`Launching ${profileLabel(profile)}…`, "info");
      } catch (error) {
        push(String(error), "error");
      } finally {
        setBusy(false);
      }
    },
    [push],
  );

  const handleSwap = useCallback(() => {
    setAKey(bKey);
    setBKey(aKey);
    setPending(new Map());
  }, [aKey, bKey]);

  const handleSelectAsA = useCallback(
    (key: string) => {
      if (key === aKey) return;
      const next = profiles.find((p) => profileKey(p) === key);
      if (!next) return;
      setAKey(key);
      // If B is in a different category now, clear it.
      if (key === bKey) {
        setBKey(aKey);
      } else if (b && b.category !== next.category) {
        setBKey("");
      }
      setPending(new Map());
    },
    [aKey, bKey, b, profiles],
  );

  const handleSelectAsB = useCallback(
    (key: string) => {
      if (key === bKey) return;
      const next = profiles.find((p) => profileKey(p) === key);
      if (!next) return;
      // Enforce same-category pairing relative to A. If incompatible, the
      // user is implicitly switching A as well — clear A so they can re-pick.
      if (a && a.category !== next.category) {
        setAKey("");
      }
      if (key === aKey) {
        setAKey(bKey);
      }
      setBKey(key);
      setPending(new Map());
    },
    [aKey, bKey, a, profiles],
  );

  const handleToggle = useCallback(
    (id: string, currentShared: boolean, nextChecked: boolean) => {
      setPending((current) => {
        const next = new Map(current);
        if (nextChecked === currentShared) {
          next.delete(id);
        } else {
          next.set(id, nextChecked);
        }
        return next;
      });
    },
    [],
  );

  const shareRows = useMemo(
    () => extensionRows.map(toShareRow),
    [extensionRows],
  );

  const pairValid = a && b && a.category === b.category && aKey !== bKey;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full flex-col bg-background">
        <Toolbar
          onRefresh={loadInstalls}
          busy={busy}
          pendingCount={pending.size}
          onApply={handleApply}
        />

        {toasts.length > 0 ? (
          <div className="space-y-1 border-b bg-muted/30 px-5 py-2">
            {toasts.map((toast) => (
              <button
                key={toast.id}
                onClick={() => dismiss(toast.id)}
                className={cn(
                  "block w-full rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                  toast.kind === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : toast.kind === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-card text-foreground",
                )}
              >
                {toast.message}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <ProfileSidebar
            profiles={profiles}
            selectedAKey={aKey}
            selectedBKey={bKey}
            busy={busy}
            onSelectAsA={handleSelectAsA}
            onSelectAsB={handleSelectAsB}
            onLaunch={handleLaunch}
            onCreateDesktop={handleCreate}
          />

          <main className="flex min-h-0 flex-1 flex-col gap-4 p-5">
            <PairSelector
              profiles={sameCategoryProfiles}
              aKey={aKey}
              bKey={bKey}
              busy={busy}
              onChangeA={handleSelectAsA}
              onChangeB={handleSelectAsB}
              onSwap={handleSwap}
              emptyHint={
                activeCategory && sameCategoryProfiles.length < 2
                  ? `Need at least two ${activeCategory === "desktop" ? "Desktop" : "Code"} profiles to compare.`
                  : undefined
              }
            />

            {!pairValid ? (
              <Card className="flex flex-1 items-center justify-center">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <p className="text-sm">
                    {a && b && a.category !== b.category
                      ? "Pair must be the same category — Desktop with Desktop, or Code with Code."
                      : "Pick two distinct profiles above to compare their content."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ShareTabs
                category={a.category}
                value={activeKind}
                onChange={setActiveKind}
              >
                {a.category === "desktop" ? (
                  activeKind === "extensions" ? (
                    <ShareTable
                      rows={shareRows}
                      pending={pending}
                      search={search}
                      setSearch={setSearch}
                      onToggle={(row, next) =>
                        handleToggle(row.id, row.shared, next)
                      }
                      columnA={profileLabel(a)}
                      columnB={profileLabel(b)}
                      emptyHint="No extensions installed in either profile."
                    />
                  ) : activeKind === "code_history" ? (
                    <CodeHistoryCard
                      data={desktopCodeHistory}
                      loading={desktopCodeHistoryLoading}
                      applying={desktopCodeHistoryApplying}
                      columnA={profileLabel(a)}
                      columnB={profileLabel(b)}
                      onToggle={handleToggleDesktopCodeHistory}
                    />
                  ) : activeKind === "mcp_servers" ? (
                    <ComingSoonPane
                      title="MCP server sharing"
                      description="List entries from claude_desktop_config.json (mcpServers) and let you tick which servers to share between profiles."
                    />
                  ) : activeKind === "cowork_skills" ? (
                    <ComingSoonPane
                      title="Cowork skills sharing"
                      description="Compare skills under local-agent-mode-sessions/*/skills-plugin/ across profiles."
                    />
                  ) : (
                    <ComingSoonPane
                      title="Preferences sharing"
                      description="Selectively share keys from config.json (theme, scale, window position) without touching account-bound preferences."
                    />
                  )
                ) : (
                  <HistoryTable
                    rows={historyRows}
                    pending={pending}
                    search={search}
                    setSearch={setSearch}
                    onToggle={(row, next) =>
                      handleToggle(row.id, row.shared, next)
                    }
                    previews={historyPreviews}
                    columnA={profileLabel(a)}
                    columnB={profileLabel(b)}
                  />
                )}
              </ShareTabs>
            )}

            {pairValid ? (
              <p className="text-[10px] text-muted-foreground">
                Source: <code>{profileRootPath(a)}</code> · Target:{" "}
                <code>{profileRootPath(b)}</code>
              </p>
            ) : null}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
