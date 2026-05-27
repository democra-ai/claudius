# Claude Desktop Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tauri macOS app that manages Claude Desktop profiles and lets users choose which Desktop extensions to copy into each profile.

**Architecture:** Add a Tauri v2 shell with a React frontend and a Rust backend. The backend owns macOS and filesystem operations, while the frontend provides profile creation, launch, and extension selection workflows. The existing Node CLI remains compatible because both surfaces share the same registry format.

**Tech Stack:** Tauri v2, Rust, React, Vite, JavaScript, existing Node CLI tests.

---

### Task 1: Backend Core Tests

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/lib.rs`

**Step 1:** Write failing Rust tests for name sanitization, registry save/load, extension inventory, and extension copying.

**Step 2:** Run `cargo test --manifest-path src-tauri/Cargo.toml`.

**Expected:** Tests fail because the backend functions are not implemented yet.

### Task 2: Backend Implementation

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`

**Step 1:** Implement path helpers, registry compatibility, default Claude Desktop detection, profile creation, launching, extension inventory, and extension copy commands.

**Step 2:** Register all commands in `tauri::generate_handler!`.

**Step 3:** Run `cargo test --manifest-path src-tauri/Cargo.toml`.

**Expected:** Rust tests pass.

### Task 3: Frontend Shell

**Files:**
- Modify: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `desktop/src/main.jsx`
- Create: `desktop/src/App.jsx`
- Create: `desktop/src/styles.css`

**Step 1:** Add Vite, React, Tauri API, and Tauri CLI scripts.

**Step 2:** Build a dense utility-style interface with profile list, create-profile form, launch buttons, source/target selectors, and extension checkboxes.

**Step 3:** Run `npm run desktop:build`.

**Expected:** Frontend builds into `dist/`.

### Task 4: End-to-End Verification

**Files:**
- Modify as needed based on verification failures.

**Step 1:** Run `npm test`.

**Step 2:** Run `cargo test --manifest-path src-tauri/Cargo.toml`.

**Step 3:** Run `npm run desktop:build`.

**Step 4:** Run `npm run tauri:build`.

**Expected:** All commands exit successfully and a macOS `.app` bundle is produced under `src-tauri/target/release/bundle/macos/`.
