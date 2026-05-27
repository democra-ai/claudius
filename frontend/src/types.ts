// Mirrors the Serialize types in src-tauri/src/lib.rs.
// Field names use snake_case to match Rust's default Serde output.

// -----------------------------
// Desktop side (Claude.app)
// -----------------------------

export type DesktopInstall = {
  id: string;
  name: string;
  /** "default" for the original Claude install, "profile" for managed ones. */
  kind: "default" | "profile";
  data_dir: string;
  app_path: string | null;
  launcher_path: string | null;
  managed: boolean;
};

export type PairExtensionShare = {
  id: string;
  source_has_extension: boolean;
  target_has_extension: boolean;
  source_has_settings: boolean;
  target_has_settings: boolean;
  /** True iff the *folder + settings* are both linked between profiles. */
  shared: boolean;
  /** Folder linked but settings out of sync (or vice versa). */
  partial: boolean;
  direction: "source-to-target" | "target-to-source" | "independent";
};

export type PairShareChange = {
  extension_id: string;
  shared: boolean;
};

// -----------------------------
// Code side (Claude Code CLI)
// -----------------------------

export type CodeInstall = {
  id: string;
  name: string;
  /** "default" for the implicit ~/.claude install, "profile" for managed ones. */
  kind: "default" | "profile";
  config_dir: string;
  alias_name: string | null;
  managed: boolean;
};

export type CodeProject = {
  id: string;
  display_path: string;
  session_count: number;
  total_bytes: number;
  last_modified_ms: number;
  first_message_preview: string | null;
};

export type PairCodeProjectShare = {
  id: string;
  display_path: string;
  source_present: boolean;
  target_present: boolean;
  source_session_count: number;
  target_session_count: number;
  source_bytes: number;
  target_bytes: number;
  source_last_modified_ms: number;
  target_last_modified_ms: number;
  shared: boolean;
  direction: "source-to-target" | "target-to-source" | "independent";
};

export type PairCodeShareChange = {
  project_id: string;
  shared: boolean;
};

// -----------------------------
// Desktop-embedded Claude Code history (claude-code-sessions/)
// -----------------------------

export type DesktopCodeWorkspaceRef = {
  device_id: string;
  workspace_id: string;
};

export type DesktopCodeHistoryStat = {
  present: boolean;
  session_count: number;
  total_bytes: number;
  last_activity_ms: number;
  /** Up to 5 cwds, ordered by most-recent activity. */
  recent_cwds: string[];
  /**
   * The most-recently-active <deviceId>/<workspaceId>/ tuple, if any.
   * If null, the profile has no Code workspace yet — Desktop must launch
   * the Code panel once for it to be created.
   */
  primary_workspace: DesktopCodeWorkspaceRef | null;
};

export type PairDesktopCodeHistory = {
  source: DesktopCodeHistoryStat;
  target: DesktopCodeHistoryStat;
  /** True iff target's primary workspace is a live symlink at source's. */
  shared: boolean;
  direction: "source-to-target" | "target-to-source" | "independent";
  /** True iff target has no <dev>/<ws>/ workspace yet. */
  target_needs_bootstrap: boolean;
  /** Same for source. */
  source_needs_bootstrap: boolean;
  /**
   * True iff a previous version of the app left a whole-`claude-code-sessions/`
   * symlink in place. Toggling will clean it up first.
   */
  legacy_whole_dir_link: boolean;
};

export type PairDesktopCodeHistoryChange = {
  shared: boolean;
};

// -----------------------------
// Shared
// -----------------------------

export type CopySummary = {
  copied: number;
  skipped: number;
};

/** UI-only: which kind of content tab the user is on. */
export type ContentKind =
  // Desktop tabs
  | "extensions"
  | "mcp_servers"
  | "cowork_skills"
  | "preferences"
  | "code_history"
  // Code-CLI tabs
  | "history";

/**
 * Discriminated union the UI uses to treat desktop + code installs uniformly.
 * `category` is the toggle the rest of the app routes on.
 */
export type Profile =
  | ({ category: "desktop" } & DesktopInstall)
  | ({ category: "code" } & CodeInstall);

/**
 * Globally-unique key across categories. We prepend the category because
 * "default" exists in both desktop and code worlds.
 */
export function profileKey(profile: Profile): string {
  return `${profile.category}:${profile.id}`;
}

/** Path the backend uses for content listing — different field per category. */
export function profileRootPath(profile: Profile): string {
  return profile.category === "desktop" ? profile.data_dir : profile.config_dir;
}

/** Display label, accounting for the "default" alias on each side. */
export function profileLabel(profile: Profile): string {
  if (profile.kind === "default") {
    return profile.category === "desktop" ? "Default Desktop" : "Default ~/.claude";
  }
  return profile.name;
}

/** A row in the multi-select share table. Generic enough for any content kind. */
export type ShareRow = {
  id: string;
  /** Human-readable label; defaults to id. */
  label?: string;
  source_present: boolean;
  target_present: boolean;
  shared: boolean;
  partial: boolean;
  /** Optional secondary line (e.g. "Files + Settings"). */
  source_detail?: string;
  target_detail?: string;
};
