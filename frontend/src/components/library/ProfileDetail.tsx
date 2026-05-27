import { useEffect, useState } from "react";
import {
  Calendar,
  Database,
  Hammer,
  Hash,
  HardDrive,
  Blocks,
  Boxes,
  Loader2,
  MessagesSquare,
  Monitor,
  Network,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { DesktopInstall, ProfileStats } from "@/types";

interface ProfileDetailProps {
  install: DesktopInstall;
  onClose: () => void;
  onLaunch: (install: DesktopInstall) => void;
  /** ID lookup so we can show "shared with: work" instead of a UUID. */
  resolveName: (installId: string) => string | undefined;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatRelativeTime(ms: number | null | undefined): string {
  if (!ms) return "—";
  const delta = Math.max(0, Date.now() - ms);
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 30))}mo ago`;
}

function formatDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function tildify(p: string): string {
  // Strip the user's home prefix to ~ for compactness — best-effort.
  return p.replace(/^\/Users\/[^/]+/, "~");
}

interface StatRowProps {
  icon: typeof Database;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  dim?: boolean;
}

function StatRow({ icon: Icon, label, value, mono, dim }: StatRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span
        className={`text-right text-xs ${mono ? "font-mono" : "font-sans"} ${
          dim ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h3 className="mb-1 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
        {title}
      </h3>
      <div className="rounded-md bg-muted/30 px-3 py-1">{children}</div>
    </section>
  );
}

export function ProfileDetail({
  install,
  onClose,
  onLaunch,
  resolveName,
}: ProfileDetailProps) {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setStats(null);
    api
      .getProfileStats(install.id)
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {
        if (alive) setStats(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [install.id]);

  return (
    <div className="sheet-slide flex h-full flex-col">
      {/* Hero header — name in Fraunces, account ID in mono, launch button. */}
      <header className="border-b px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Monitor className="h-3 w-3" />
              {install.kind === "default" ? "Default Desktop" : "Profile"}
            </div>
            <h2 className="mt-0.5 font-display text-2xl leading-tight tracking-tight">
              {install.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close details"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          size="sm"
          onClick={() => onLaunch(install)}
          className="mt-3 h-8 w-full gap-1.5 rounded-md font-sans text-xs"
        >
          <Play className="h-3 w-3" />
          Launch this profile
        </Button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {loading && !stats ? (
          <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-sans text-xs">Reading profile state…</span>
          </div>
        ) : !stats ? (
          <p className="font-sans text-xs text-muted-foreground">
            Could not read this profile's stats.
          </p>
        ) : (
          <>
            <Section title="Identity">
              <StatRow
                icon={Hash}
                label="Account"
                value={stats.account_id?.slice(0, 8) ?? "—"}
                mono
                dim={!stats.account_id}
              />
              <StatRow
                icon={Network}
                label="Org"
                value={stats.org_id?.slice(0, 8) ?? "—"}
                mono
                dim={!stats.org_id}
              />
              <StatRow
                icon={HardDrive}
                label="Disk"
                value={formatBytes(stats.disk_bytes)}
                mono
              />
              <StatRow
                icon={Calendar}
                label="Created"
                value={formatDate(stats.created_at_ms)}
              />
            </Section>

            <Section title="Code activity">
              <StatRow
                icon={MessagesSquare}
                label="Sessions"
                value={stats.code_session_count.toLocaleString()}
                mono
              />
              <StatRow
                icon={Database}
                label="Code disk"
                value={formatBytes(stats.code_total_bytes)}
                mono
              />
              <StatRow
                icon={Calendar}
                label="Last activity"
                value={formatRelativeTime(stats.last_activity_ms)}
              />
              {stats.code_recent_cwds.length > 0 ? (
                <div className="border-b border-border/40 py-2 last:border-b-0">
                  <div className="mb-1 flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <Database className="h-3 w-3" />
                    Recent projects
                  </div>
                  <ul className="space-y-0.5 pl-4 font-mono text-[11px]">
                    {stats.code_recent_cwds.slice(0, 5).map((cwd) => (
                      <li
                        key={cwd}
                        className="truncate text-foreground/80"
                        title={cwd}
                      >
                        {tildify(cwd)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Section>

            <Section title="Content">
              <StatRow
                icon={Blocks}
                label="Extensions"
                value={stats.extension_count}
                mono
              />
              <StatRow
                icon={Boxes}
                label="MCP servers"
                value={stats.mcp_server_count}
                mono
              />
              <StatRow
                icon={Hammer}
                label="Cowork skills"
                value={stats.cowork_skill_count}
                mono
              />
            </Section>

            <Section title="Sharing">
              <StatRow
                icon={Hash}
                label="Workspace link"
                value={stats.link_group ?? "independent"}
                mono
                dim={!stats.link_group}
              />
              {stats.shared_with.length > 0 ? (
                <div className="py-2">
                  <div className="mb-1 font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Shared with
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.shared_with.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary"
                      >
                        {resolveName(id) ?? id.slice(0, 6)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Section>

            <div className="break-all border-t pt-3 font-mono text-[10px] text-muted-foreground/70">
              {tildify(stats.data_dir)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
