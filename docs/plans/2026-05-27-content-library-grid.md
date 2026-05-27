# Content Library "The Grid" — interaction redesign

**Date**: 2026-05-27
**Status**: In progress
**Owner**: democra-ai/claude-multiprofile
**Skill used**: frontend-design

## Problem with pair-wise UX

The previous UI is a binary comparator: pick A and B, see what each has, tick to
sync. When the user has 4+ profiles, normalizing a single MCP server across all
of them requires walking 4-choose-2 = 6 pairs. The user can never see the global
state. This rewrite replaces the comparator with a **matrix view across all
profiles at once**.

## Aesthetic commitment

**"The Grid"** — a trading-floor / Bloomberg-terminal × IDE-settings density
hybrid. Bold mono typography, single accent color, glyph-encoded state. No
marketing-card patterns; every pixel earns its place.

- **Display & structural type**: JetBrains Mono Variable
- **Prose type**: Geist Sans (only for skill descriptions, errors, tooltips)
- **Accent**: `#a3e635` (lime) dark, `#65a30d` light. Single accent, no
  rainbows.
- **Rounding**: 4px on outer containers, sharp internal grid lines
- **No**: gradients, glassmorphism, drop shadows (only focus rings), rounded
  buttons

## Cell language (state machine)

Every matrix cell is one (profile, content-item) intersection. State is
encoded with both **glyph** and **color** so power users can scan at distance
and colorblind users still see the difference.

| Glyph | Color   | State        | Meaning |
|-------|---------|--------------|---------|
| `■`   | lime    | shared       | Live symlink between ≥2 profiles. Edits propagate. (Extensions, Cowork Skills) |
| `●`   | text    | copied       | One-shot copy, values currently equal (MCP, Prefs) |
| `◐`   | amber   | diverged     | Both profiles have it, values differ |
| `○`   | dim     | independent  | Only this profile has it; not shared anywhere |
| `·`   | mute    | absent       | This profile does not have this item |

Hover on a cell reveals an inline tooltip with the actual state words and a
short why-this-glyph explanation.

## Layout (three-pane)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Toolbar — search · refresh · pending count · theme toggle              │
├──────────┬────────────────────────────────────────────┬────────────────┤
│ Left rail│ The Grid                                   │ Detail (slide) │
│   200px  │                                            │   320px        │
│          │   ▶ sticky col header: profile chips       │                │
│  Kind    │   ▼ sticky row header: content names       │ Selected row   │
│   ext    │                                            │ — full payload │
│   mcp    │   matrix cells (glyphs)                    │ — per-profile  │
│   skills │                                            │   value diff   │
│   prefs  │                                            │ — actions      │
│   code-h │                                            │                │
│          │                                            │                │
│  Profile │                                            │                │
│   ▣ def  │                                            │                │
│   ▣ work │                                            │                │
│   ▣ pers │                                            │                │
│   ☐ judy │                                            │                │
│          │                                            │                │
│  ----    │                                            │                │
│   + new  │                                            │                │
│   ↻ ref  │                                            │                │
└──────────┴────────────────────────────────────────────┴────────────────┘
                                  ⌃
        ┌───────────────────────────────────────┐
        │  5 pending changes · Apply · Cancel   │  ← floats up when pending > 0
        └───────────────────────────────────────┘
```

The right rail is collapsed by default. Clicking a row label or selecting a row
slides it in (Sheet from shadcn/ui).

## Interactions

| Gesture | Effect |
|---------|--------|
| Click cell | Toggle target state into pending. Glyph flips with 120ms ease-out cross-fade. |
| Click column header | Open menu: "Match all rows to this profile", "Remove all from this profile" |
| Click row label | Open menu: "Install to all profiles", "Remove from all", "Open in Finder" (where applicable) |
| Shift+click cell | Range-select cells between last click and this click (one row at a time) |
| Right-click cell | Inline menu: "Sync from <neighbor>", "Make independent", "Show JSON" |
| Hover cell | Tooltip with state name + ms-delay reveal |
| `Cmd+K` | Open command palette to jump to a content item by name |
| `Cmd+A` on matrix | Select all cells in current row |

All toggles stage to a **pending map** keyed `${kind}:${itemId}:${profileId}`.
Apply flushes pending in one trip per `(kind, source, targets)` call to the
backend.

## Per-kind specifics

| Kind          | Symlink possible? | Library API       | Cell glyphs in play |
|---------------|-------------------|-------------------|---------------------|
| Extensions    | Yes               | `list_extension_library` ✓ | `■ ○ ·` |
| Cowork Skills | Yes               | `list_cowork_skills_library` (new) | `■ ○ ·` |
| MCP Servers   | No (JSON key)     | `list_mcp_servers_library` (new) | `● ◐ ○ ·` |
| Preferences   | No (JSON key)     | `list_preference_library` (new) | `● ◐ ○ ·` |
| Code History  | Yes (one toggle)  | `list_code_history_library` (new) | Special: link-group view, not matrix |

The first four use the same `<Matrix />` shell. Code History gets a custom
"link group" widget because it's one toggle per profile pair, not many items.

## Components

```
ContentLibraryPage
├── Toolbar (search, refresh, pending count, theme toggle)
├── LeftRail
│   ├── KindNav        ── vertical, with "synced/total" counts per kind
│   ├── ProfileFilter  ── checkbox list (which columns to show)
│   └── RailActions    ── new profile, refresh, theme toggle
├── Matrix
│   ├── MatrixHeader   ── sticky, profile chips, per-col menu
│   ├── MatrixRow      ── sticky row label, dynamic cells
│   └── MatrixCell     ── the glyph state machine
├── DetailSheet        ── slide-in right rail (shadcn Sheet)
└── PendingBar         ── floating bottom-center bar with Apply / Cancel
```

shadcn primitives used: Tooltip, DropdownMenu, Sheet, Toast, Checkbox, Input,
Tabs (for inside DetailSheet), Command (for ⌘K palette).

New atomic primitives we introduce:
- `<Glyph kind={state} />` — the 5 state symbols, font-aware
- `<ProfileChip profile={p} active={...} />` — used in MatrixHeader + sidebar
- `<KindCount synced={n} total={m} />` — small inline counter

## Visual hierarchy

1. **Glyphs** are the loudest element — bold, large for their size, accent-colored when shared
2. **Profile names** are the second loudest — uppercase, JetBrains Mono, color when active
3. **Content names** are tertiary — lowercase, mono, dim until hover
4. Everything else (search inputs, menus, tooltips) recedes to grey

## Motion

Sparingly. The skill warned against scattered micro-interactions; only specific moments earn animation:

- **Page load**: top toolbar → kind nav → matrix rows staggered 60ms each
- **Cell toggle**: 120ms ease-out cross-fade between glyphs + 1px accent edge flash on the cell
- **Pending bar**: 200ms ease-out spring up from bottom
- **DetailSheet open**: 240ms ease-in-out slide from right
- **Row hover**: instant (0ms) 1px accent inset on left edge — Linear style

No bouncing, no parallax, no scroll-tied animations.

## Empty / loading / error

- **Empty kind**: a mono blockquote in dim text: `// no <kind> in any profile` plus a CTA appropriate to the kind ("Install one via Claude Desktop, then Refresh")
- **Loading**: row-by-row skeleton shimmer in mono blocks (`░░░░░░`)
- **Error**: dim red row banner above matrix, dismissable, with the verbatim backend error in mono
- **Many profiles (≥7)**: horizontal scroll on the matrix only (sticky first column + sticky `Σ` summary column showing `N/M` profiles holding the item)

## Light / dark

Both must look good. CSS variables drive the palette; same accent, inverted neutrals. Default to dark on first launch (utility-tool convention), respect macOS appearance after.

## Out of scope (v1)

- Drag-to-paint rows of cells (spreadsheet style multi-select with drag)
- Inline JSON editor in DetailSheet (read-only for now; edit goes via Claude Desktop itself)
- Animations on grid scroll
- Workspace cluster visualization for Code History (just a small list for now)

## Risk

- **Density on small windows**: Tauri windows can be narrow; minimum viable is 4-profile-column with horizontal scroll. Validated by spec.
- **JetBrains Mono Variable adds ~80KB**: still fine for a desktop bundle, plus we host locally (no CDN cold-start).
- **Glyph rendering**: ■ ● ◐ ○ · are all standard Unicode and render reliably in JetBrains Mono. Verified by inclusion in JBM glyph set.
