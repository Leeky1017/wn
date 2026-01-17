# issue-10-native-desktop-spec — Tasks

## 0. Deliverables (this PR)
- [x] 0.1 Fill `proposal.md` (motivation / scope / non-goals)
- [x] 0.2 Add OpenSpec deltas under `specs/**/spec.md` (framework / architecture / performance / migration)
- [x] 0.3 Add decision evidence under `evidence/notes.md` (alternatives + rationale)
- [x] 0.4 Add run log `openspec/_ops/task_runs/ISSUE-10.md` with key commands + outputs
- [x] 0.5 Validate: `openspec validate --specs --strict --no-interactive`
- [x] 0.6 Validate: `rulebook task validate issue-10-native-desktop-spec`

## 1. Migration Roadmap (post-Issue milestones)

### M1 — Native shell bootstrap (Tauri)
- [ ] 1.1 Create a Tauri desktop app shell (Rust) for Windows + macOS
- [ ] 1.2 Load the existing `frontend/` renderer build output in the system WebView
- [ ] 1.3 Provide a stable `window.writenow` bridge for desktop integrations (API base, WS base, platform, menu actions, file dialogs, skills persistence)
- [ ] 1.4 Manage backend lifecycle (dev: `python -m uvicorn`; prod: bundled sidecar) and gate UI on `/api/health`
- [ ] 1.5 Manual smoke: open app → list files → open/edit → save (snapshot) → export → agent WS run

### M2 — Packaging + backend distribution
- [ ] 2.1 Package the Python backend as a per-platform executable (sidecar) with pinned dependencies
- [ ] 2.2 Bundle the backend sidecar into the desktop installer and ensure offline launch works without system Python
- [ ] 2.3 Default data location remains local-first and stable (`<userData>/data/{workspace,snapshots,writenow.sqlite3}`)
- [ ] 2.4 Add CI jobs that build and publish Windows + macOS artifacts

### M3 — Clarity + performance hardening
- [ ] 3.1 Define measurable budgets for startup, memory, and interaction latency
- [ ] 3.2 Add instrumentation to collect timing and resource evidence into run logs
- [ ] 3.3 Verify HiDPI crispness on Windows 125%–200% DPI scale and macOS Retina
- [ ] 3.4 Add a regression checklist (manual first, automate where possible)

### M4 — Electron deprecation
- [ ] 4.1 Freeze Electron desktop to critical fixes only after M2 ships
- [ ] 4.2 Remove Electron-specific packaging and glue code after parity is achieved
- [ ] 4.3 Update documentation pointers and release notes
