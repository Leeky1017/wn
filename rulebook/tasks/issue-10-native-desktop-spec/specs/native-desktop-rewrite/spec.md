# Native Desktop Rewrite (Windows + macOS)

## Purpose
Define an enforceable target for rewriting WriteNow Desktop from Electron to a native cross-platform desktop stack, prioritizing HiDPI/Retina clarity and runtime performance while preserving WriteNow’s non-negotiable local-first and auditable guarantees.

## Requirements

### Requirement: Target platforms MUST be Windows and macOS only
The native desktop rewrite MUST target Windows and macOS as first-class platforms.
Linux support is explicitly out of scope for the rewrite plan defined here.

#### Scenario: Desktop roadmap scope is reviewed
- **GIVEN** Issue #10 defines a native desktop rewrite scope
- **WHEN** reviewing the native desktop rewrite roadmap
- **THEN** Windows and macOS are the only required desktop targets
- **THEN** Linux is not listed as a required target

### Requirement: Desktop shell MUST be Tauri with system WebView
WriteNow native desktop MUST use Tauri (Rust) as the application shell and rely on the system WebView (WebView2 on Windows, WKWebView on macOS) to reduce runtime overhead compared to Electron while keeping the existing web-based renderer feasible.

#### Scenario: Framework decision is recorded with evidence
- **GIVEN** the project is committing to a specific cross-platform native shell framework
- **WHEN** reviewing the framework choice for the native rewrite
- **THEN** the decision and rationale are recorded in `rulebook/tasks/issue-10-native-desktop-spec/evidence/notes.md`

### Requirement: Renderer MUST reuse the existing React UI for the first migration milestone
To minimize UI regressions and preserve design parity, the first shipped native milestone MUST load the existing `frontend/` renderer build output inside the native shell.

#### Scenario: Migration starts with UI parity
- **GIVEN** the project is delivering the first native migration milestone
- **WHEN** the first native milestone is delivered
- **THEN** the desktop renderer is the existing React UI (built from `frontend/`)
- **THEN** renderer-to-shell integrations are exposed via a stable `window.writenow` bridge (not Electron-only APIs)

### Requirement: Native shell MUST manage Python backend lifecycle reliably
The native shell MUST start and supervise the existing Python backend (FastAPI) as a local process and MUST gate the UI on backend readiness.

Implementation expectations:
- dev mode: run via `python -m uvicorn app.main:app`
- packaged mode: ship the backend as a bundled sidecar executable and spawn it from the native shell

#### Scenario: App starts backend and waits for readiness
- **GIVEN** the desktop app uses the Python backend for local-first operations
- **WHEN** the desktop app is launched
- **THEN** the shell starts the backend process with a deterministic local data directory
- **THEN** the shell polls `/api/health` until it reports `{ "ok": true }` before enabling editor actions
- **THEN** if the backend fails to start, the app shows a user-visible error and does not silently continue

### Requirement: Local-first storage layout MUST remain stable under app user data
The native shell MUST preserve the constitution’s stable storage layout by configuring the backend to use an app user data directory as its `WN_DATA_DIR` root:

- `<userData>/data/workspace/` for Markdown files
- `<userData>/data/snapshots/` for snapshot contents
- `<userData>/data/writenow.sqlite3` for snapshot metadata

#### Scenario: Backend is configured for local-first storage
- **GIVEN** the backend uses `WN_DATA_DIR` to locate local storage
- **WHEN** the desktop shell launches the backend
- **THEN** it sets `WN_DATA_DIR` to the app user data directory’s `data/` subfolder
- **THEN** the backend creates `workspace/` and `snapshots/` on first run if missing

### Requirement: HiDPI/Retina rendering MUST be crisp without bitmap scaling
The native desktop rewrite MUST provide crisp UI rendering on:
- macOS Retina displays
- Windows DPI scaling ranges commonly used by writers (125%–200%)

To avoid blur, the renderer MUST:
- use vector assets (SVG) for icons where possible
- avoid UI-wide bitmap scaling tricks (e.g. forced CSS zoom, bitmap upscaling)

#### Scenario: Writer sees crisp text and icons on HiDPI
- **GIVEN** the app is running on a HiDPI/Retina display with OS-level scaling enabled
- **WHEN** the user runs the app on a HiDPI/Retina display
- **THEN** text rendering appears sharp (no systematic blur from scaling)
- **THEN** icons remain crisp at typical DPI scales (125%–200% on Windows)

### Requirement: Performance budgets MUST be explicit and measured per milestone
The rewrite MUST define explicit performance budgets and collect evidence on both platforms for each migration milestone.

Minimum budgets to track:
- cold start: launch → UI ready (backend health OK + editor interactive)
- steady-state: idle CPU and memory after 60s
- interaction: typing latency and scroll smoothness in a large draft

#### Scenario: Performance evidence is written to run logs
- **GIVEN** each migration milestone is delivered as an Issue-gated PR
- **WHEN** a migration milestone PR is delivered
- **THEN** its Issue run log `openspec/_ops/task_runs/ISSUE-N.md` contains the measurement method and the collected numbers

### Requirement: Desktop bridge API MUST remain stable across shells (Electron → native)
To enable a non-disruptive migration, the renderer-facing desktop bridge MUST keep a stable surface area across Electron and the native shell.

Minimum required shape:
- `window.writenow.apiBase` and `window.writenow.wsBase`
- `window.writenow.platform`
- `window.writenow.skills.read()` / `window.writenow.skills.write(skills)`
- `window.writenow.files.saveText(payload)` / `window.writenow.files.saveBinary(payload)`
- `window.writenow.onAction(handler)` for menu shortcut actions (Cmd/Ctrl+S, Cmd/Ctrl+K)

#### Scenario: Renderer integration does not depend on Electron
- **GIVEN** the renderer needs desktop integrations but should not couple to a specific shell implementation
- **WHEN** switching the desktop shell from Electron to the native implementation
- **THEN** the renderer keeps using `window.writenow` without Electron-specific imports
- **THEN** required desktop integrations continue to work (menus, dialogs, skills persistence, API base injection)

### Requirement: Migration MUST be milestone-driven and delivery-gated
The rewrite MUST be executed via milestones with explicit acceptance gates so delivery is not interrupted.

#### Scenario: Roadmap milestones are defined and verifiable
- **GIVEN** the rewrite is executed incrementally with acceptance gates
- **WHEN** reading the rewrite plan
- **THEN** milestones and acceptance gates are listed in `rulebook/tasks/issue-10-native-desktop-spec/tasks.md`
- **THEN** each milestone is delivered via Issue → PR → Checks → Auto-merge with its own run log evidence
