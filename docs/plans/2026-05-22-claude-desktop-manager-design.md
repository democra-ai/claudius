# Claude Desktop Manager Design

## Goal

Build a macOS app for `claude-multiprofile` that manages Claude Desktop profiles from a GUI. The first version focuses only on Claude Desktop. Each profile keeps its own login, chat history, projects, and app data. Extensions can be selected and copied from one install/profile into another profile so the user can decide which pieces are shared and which remain independent.

## Scope

- Show the default Claude Desktop install when detected.
- Show Desktop profiles already registered by `claude-multiprofile`.
- Create new Desktop-only profiles with the same isolation model as the existing CLI.
- Launch the default install or a selected profile.
- Pick a source install/profile, pick a target profile, then check which extensions should be copied into the target.
- Leave unchecked extensions untouched in the target, preserving independent state.

## Architecture

The app uses Tauri v2 so the UI feels like a native macOS app while Rust handles file-system and macOS launcher operations. The React frontend calls Tauri commands via `@tauri-apps/api/core`. The Rust backend mirrors the Desktop-specific behavior from the existing Node CLI: registry reading/writing, default install detection, `.app` launcher generation with `osacompile`, launching via `open`, and extension folder/settings copying.

## Data Flow

The backend reads the existing registry from `~/.config/claude-multiprofile/profiles.json`. Profiles created by the GUI are written in the same shape the CLI already uses, so the CLI and GUI remain compatible. Extension sharing is applied as an explicit copy operation: selected extension folders and matching settings JSON files are copied from the chosen source to the target profile.

## Error Handling

Tauri commands return `Result<T, String>` so errors surface in the UI as actionable messages. Missing Claude Desktop, missing source extension folders, and invalid profile names are handled before destructive work starts.

## Testing

Core backend behavior is covered with Rust unit tests for profile name sanitization, registry round-tripping, extension inventory, and extension copying. Existing Node tests remain in place for the CLI. Verification includes `npm test`, `cargo test`, frontend build, and Tauri build.
