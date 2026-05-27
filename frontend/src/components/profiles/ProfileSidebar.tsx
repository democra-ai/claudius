import { useMemo, useState } from "react";
import { Plus, Play, Folder, Monitor, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type Profile,
  profileKey,
  profileLabel,
  profileRootPath,
} from "@/types";

interface ProfileSidebarProps {
  profiles: Profile[];
  selectedAKey: string;
  selectedBKey: string;
  busy: boolean;
  onSelectAsA: (key: string) => void;
  onSelectAsB: (key: string) => void;
  onLaunch: (profile: Profile) => void;
  onCreateDesktop: (name: string) => void | Promise<void>;
}

function profileSubtitle(profile: Profile) {
  if (profile.category === "desktop") {
    return profile.kind === "default"
      ? "Original Claude.app"
      : "Isolated Desktop profile";
  }
  return profile.kind === "default"
    ? "Original ~/.claude"
    : profile.alias_name
    ? `alias: ${profile.alias_name}`
    : "Isolated CLAUDE_CONFIG_DIR";
}

function categoryIcon(category: Profile["category"]) {
  return category === "desktop" ? Monitor : Terminal;
}

function ProfileRow({
  profile,
  selectedAKey,
  selectedBKey,
  busy,
  onSelectAsA,
  onSelectAsB,
  onLaunch,
}: {
  profile: Profile;
  selectedAKey: string;
  selectedBKey: string;
  busy: boolean;
  onSelectAsA: (key: string) => void;
  onSelectAsB: (key: string) => void;
  onLaunch: (profile: Profile) => void;
}) {
  const key = profileKey(profile);
  const isA = key === selectedAKey;
  const isB = key === selectedBKey;
  const role = isA ? "A" : isB ? "B" : "";
  const Icon = categoryIcon(profile.category);
  const launchable = profile.category === "desktop";
  return (
    <div
      className={cn(
        "group mb-1 flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:bg-accent",
        (isA || isB) && "border-primary/40 bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectAsA(key)}
        className="flex flex-1 items-center gap-2 text-left"
        title={profileRootPath(profile)}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
            profile.kind === "default"
              ? "bg-muted text-muted-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {profileLabel(profile)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {profileSubtitle(profile)}
          </span>
        </span>
        {role ? (
          <Badge
            variant={role === "A" ? "default" : "secondary"}
            className="shrink-0 text-[10px]"
          >
            {role}
          </Badge>
        ) : null}
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-60 group-hover:opacity-100"
            onClick={() => onSelectAsB(key)}
            disabled={isA || busy}
          >
            <Folder className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Set as Profile B</TooltipContent>
      </Tooltip>
      {launchable ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-60 group-hover:opacity-100"
              onClick={() => onLaunch(profile)}
              disabled={busy}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Launch</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function ProfileSidebar({
  profiles,
  selectedAKey,
  selectedBKey,
  busy,
  onSelectAsA,
  onSelectAsB,
  onLaunch,
  onCreateDesktop,
}: ProfileSidebarProps) {
  const [newName, setNewName] = useState("");

  const desktops = useMemo(
    () =>
      profiles
        .filter((p): p is Profile & { category: "desktop" } => p.category === "desktop")
        .sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === "default" ? -1 : 1;
        }),
    [profiles],
  );
  const codes = useMemo(
    () =>
      profiles
        .filter((p): p is Profile & { category: "code" } => p.category === "code")
        .sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === "default" ? -1 : 1;
        }),
    [profiles],
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreateDesktop(name);
    setNewName("");
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Profiles</h2>
          <p className="text-xs text-muted-foreground">
            {profiles.length} total · {desktops.length} desktop · {codes.length} code
          </p>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Claude Desktop
        </div>
        {desktops.length === 0 ? (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            No desktop profiles yet.
          </div>
        ) : (
          desktops.map((profile) => (
            <ProfileRow
              key={profileKey(profile)}
              profile={profile}
              selectedAKey={selectedAKey}
              selectedBKey={selectedBKey}
              busy={busy}
              onSelectAsA={onSelectAsA}
              onSelectAsB={onSelectAsB}
              onLaunch={onLaunch}
            />
          ))
        )}

        <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Claude Code
        </div>
        {codes.length === 0 ? (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            No code profiles registered.
          </div>
        ) : (
          codes.map((profile) => (
            <ProfileRow
              key={profileKey(profile)}
              profile={profile}
              selectedAKey={selectedAKey}
              selectedBKey={selectedBKey}
              busy={busy}
              onSelectAsA={onSelectAsA}
              onSelectAsB={onSelectAsB}
              onLaunch={onLaunch}
            />
          ))
        )}
      </div>

      <form
        className="border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <label
          htmlFor="new-profile-name"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          New Desktop profile
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="new-profile-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="client-acme"
            autoComplete="off"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !newName.trim()}>
            <Plus />
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Code profiles still use the CLI: <code>claude-multiprofile add</code>.
        </p>
      </form>
    </aside>
  );
}
