# Share redesign: MCP servers, Cowork Skills, Preferences

**Date**: 2026-05-27
**Status**: In progress
**Owner**: democra-ai/claude-multiprofile

## Problem

Three Claude Desktop content kinds are still `ComingSoonPane` placeholders in the
GUI: **MCP servers**, **Cowork Skills**, and **Preferences**. The CLI also has no
command for any of them. Each lives in a different on-disk shape, so the existing
"share-via-symlink" model used for Extensions doesn't apply uniformly.

Goal: ship working share/unshare flows for all three, with semantics each kind's
on-disk format actually supports.

## On-disk layout (per Desktop data dir)

```
<dataDir>/                                                  e.g. ~/Library/Application Support/Claude-WORK/
├── claude_desktop_config.json                              top-level: { mcpServers: {...}, preferences: {...} }
├── config.json                                             UI-only prefs (darkMode, scale, windowPosition)
├── Claude Extensions/<id>/                                 ✓ already shared
├── Claude Extensions Settings/<id>.json                    ✓ already shared (paired)
├── claude-code-sessions/<accountId>/<orgId>/local_*.json   ✓ already shared (per-workspace symlink)
└── local-agent-mode-sessions/skills-plugin/
    └── <deviceId>/<accountId>/
        ├── manifest.json                                   skills array: [{ skillId, name, description, enabled, ... }]
        └── skills/<skill-name>/                            actual skill bundles
```

**Account/device IDs** are stable per profile, read from `cowork-enabled-cli-ops.json`
and `extensions-blocklist.json` the same way `pair_desktop_code_history` already
does. Reuse that helper.

## Two sharing models

The existing code commits to **one** model — symlink swap — which gives "live
sharing" semantics (edit on either side, both see it). That model only works
when the unit of sharing is its own filesystem entry (file or directory). For
JSON keys nested inside a single config file (MCP servers, preferences), you
can't symlink a key. So we add a second model.

### Model A — Symlink swap (live share)

Unit: a file or directory.
Toggle ON: `target_path` becomes `symlink(source_path)`. Any read by Claude on
either side sees the same bytes. Edits propagate.
Toggle OFF: target's symlink is broken, and a deep-copy of source's current
content is dropped at `target_path`. Both sides now diverge independently.
Used for: Extensions (today), **Cowork Skills**.

### Model B — Copy on apply (one-shot)

Unit: a JSON key inside a config file.
Toggle ON: when the user clicks **Apply**, the entry under `source[key]` is
copied to `target[key]` (overwriting). No live link — future edits don't
propagate.
Toggle OFF: when the user clicks **Apply**, `target[key]` is removed.
Used for: **MCP servers**, **Preferences**.

The UI distinguishes the two with the description text on each row, and by the
status badge: Model A shows `Shared / Independent`, Model B shows
`Copied / Not copied` (Model B has no "live" state to detect).

## Per-kind specifications

### MCP servers (Model B)

**Source key**: `claude_desktop_config.json` → `mcpServers` (object, server-name
keyed). Each value is `{ command, args, env, ... }`. Anthropic's docs and the
in-tree extensions are the authoritative shape; we treat it as opaque JSON.

**Listing**: union of server names from source and target. Each row reports
`source_present`, `target_present`, and whether the two values are
deep-equal (`copied: true` iff target has source's exact value).

**Apply (toggle ON)**: ensure target file exists, parse → set
`mcpServers[name] = source[name]` → write back atomically (write to
`<file>.tmp`, fsync, rename). If the target file is missing or unparseable,
synthesize `{ "mcpServers": { ... } }`.

**Apply (toggle OFF)**: parse target → `delete mcpServers[name]` → write back.
If `mcpServers` is then empty, leave the empty object (don't delete the key).

**Safety**: never touch any key outside `mcpServers`. Always write atomically.

### Cowork Skills (Model A — symlink, with manifest patch)

**Source paths**: each `<dataDir>/local-agent-mode-sessions/skills-plugin/<dev>/<acct>/skills/<skill-name>/` is
a self-contained skill bundle. The matching `manifest.json` (one per `<dev>/<acct>`
combo) lists `{ skillId, name, description, enabled, ... }` and gates whether the
skill is loaded.

**The `<dev>/<acct>/` part complicates things.** The device ID and account ID
are profile-specific — even if we symlink `skills/<name>/` from source's tree
to target's tree, the manifest in the target's tree still needs to list the
skill. So sharing a skill is **two writes**:

1. `ln -s source/<dev_src>/<acct_src>/skills/<name>  target/<dev_tgt>/<acct_tgt>/skills/<name>`
2. Patch `target/<dev_tgt>/<acct_tgt>/manifest.json` so the array contains the
   entry from source's manifest (insert if missing, update if present).

**Listing**: union of skill IDs from source manifest and target manifest. Row
reports `source_present`, `target_present`, `enabled_in_source`,
`enabled_in_target`, and `shared` (true iff target's `skills/<name>/` is a
live symlink pointing at source's, AND target's manifest entry matches source's).

**Apply (toggle ON)**:
1. Resolve source and target's `<dev>/<acct>/` (one each — same algorithm as
   `pair_desktop_code_history`'s workspace probe).
2. If target's combo dir doesn't exist yet, bail with a hint: "Launch the
   Cowork panel in the target profile once so this folder is created."
3. `symlink_path(source_skill_dir, target_skill_dir)` — existing helper handles
   stale symlinks and backups.
4. Read target's `manifest.json`, insert/replace the skill entry from source's
   manifest, write back atomically.

**Apply (toggle OFF)**: break symlink → leave folder empty (or deep-copy
source's current contents — TODO: pick one); remove the entry from target's
manifest.

**Edge case**: skills can be 100s of MB. We never copy the whole `skills/` tree
proactively — only on toggle-OFF if we choose deep-copy semantics.

### Preferences (Model B, with key allowlist)

Two source files contain prefs:

- `config.json` — pure UI (`darkMode`, `scale`, `quickWindowPosition`,
  `multiTitleBar`). Safe to share top-level.
- `claude_desktop_config.json` → `preferences` — mixed: some safe
  (`menuBarEnabled`, `quickEntryShortcut`, `chicagoEnabled`,
  `coworkScheduledTasksEnabled`, `coworkWebSearchEnabled`,
  `sidebarMode`, `remoteToolsDeviceName`, `launchPreviewPersistSession`),
  some **account-bound** (`bypassPermissionsOptInByAccount`,
  `bypassPermissionsGateByAccount`, `epitaxyPrefs.epitaxy-folder-permission-mode.<accountId>`),
  some opaque (`epitaxyPrefs.dframe-local-slice`).

**Allowlist**: hardcode known-safe keys. Anything else is hidden (the GUI
will show a "Show advanced" affordance later if needed; v1 = allowlist only).

**Account-bound keys**: NEVER share blanket; if shared, rewrite the inner
account-ID subkey to target's account ID. v1 just hides these.

**Apply ON/OFF**: same JSON-merge pattern as MCP servers, but the path can
descend two levels (`preferences.menuBarEnabled` etc).

## Backend (Rust)

New types and functions in `src-tauri/src/lib.rs`:

```
// MCP
PairMcpServerShare { name, source_present, target_present, source_command, target_command, copied }
PairMcpServerChange { name, copied }
fn list_pair_mcp_servers(source_dir, target_dir) -> Vec<PairMcpServerShare>
fn apply_pair_mcp_servers(source_dir, target_dir, changes) -> CopySummary

// Cowork Skills
PairCoworkSkillShare { skill_id, name, description, source_present, target_present, source_enabled, target_enabled, shared }
PairCoworkSkillChange { skill_id, shared }
fn list_pair_cowork_skills(source_dir, target_dir) -> PairCoworkSkillsResult
fn apply_pair_cowork_skills(source_dir, target_dir, changes) -> CopySummary

// Preferences
PreferenceField { key, label, scope: "ui" | "desktop_pref", value_kind: "bool" | "string" | "number" | "json" }
PairPreferenceShare { key, label, source_present, target_present, source_value, target_value, copied }
PairPreferenceChange { key, copied }
fn list_pair_preferences(source_dir, target_dir) -> Vec<PairPreferenceShare>
fn apply_pair_preferences(source_dir, target_dir, changes) -> CopySummary
```

All three pair-list commands take `(source_data_dir, target_data_dir)` and
return camelCase-via-serde JSON-friendly structs, matching the existing
extensions/code-history pattern.

JSON read/write uses `serde_json::Value` with atomic temp-file-then-rename to
avoid half-written configs if the app crashes mid-write.

## Frontend (TypeScript)

New types in `frontend/src/types.ts` mirroring the Rust structs. New invokes
in `frontend/src/lib/api.ts`. Three new components under
`frontend/src/components/share/`:

- `McpServerTable.tsx` — table over `PairMcpServerShare[]`
- `CoworkSkillsTable.tsx` — table over `PairCoworkSkillShare[]`, with the
  "target needs bootstrap" empty state from `pair_desktop_code_history`
- `PreferencesTable.tsx` — table over `PairPreferenceShare[]`, grouped by
  scope (UI vs Cowork)

`App.tsx` adds three new state buckets + load/apply callbacks following the
exact same shape as `extensionRows` / `loadExtensions` / the `handleApply`
branch. `ShareTabs.tsx` flips the three tabs' `ready` flags to `true`.

## Out of scope (v1)

- CLI commands for the new sharing kinds (the existing `extensions` CLI
  command precedent suggests we'd want one each — `mcp`, `skills`, `prefs` —
  but the GUI ships first; CLI can follow once the surface is stable).
- Bidirectional / N-way sharing (a single source-target pair is what the rest
  of the UI is wired for).
- Conflict resolution UI for diverged values (v1 always overwrites target on
  toggle-ON; v2 could show a diff and ask).

## Out of scope (forever)

- Sharing anything under `Local Storage/`, `IndexedDB/`, `Cookies*`,
  `Preferences` (Electron's file, not the JSON), `Local State` — these contain
  authentication and would defeat the entire point of isolated profiles.

## Risk register

- **JSON write corruption**: atomic temp+rename mitigates, plus we keep a
  `.bak` of the prior file the first time we write each session.
- **Schema drift**: Claude Desktop may add keys we don't recognize. The
  allowlist approach for Preferences and the opaque-pass-through for MCP/
  Cowork values means we won't accidentally rewrite something we don't
  understand — we only touch keys we explicitly target.
- **Account ID hard-codes**: account/device IDs change across profiles. The
  Cowork Skills sharer must read both sides' IDs at apply time, not cache them.
