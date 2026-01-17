# ISSUE-10
- Issue: #10
- Branch: task/10-native-desktop-spec
- PR: (pending)

## Goal
- Produce an executable OpenSpec + migration roadmap for a Windows + macOS native desktop rewrite (clarity + performance first), while preserving the hard constraints in `openspec/specs/writenow-constitution/spec.md`.

## Status
- CURRENT: drafting deliverables in worktree; validation + PR pending.

## Next Actions
- [ ] Finalize `rulebook/tasks/issue-10-native-desktop-spec/` (proposal, tasks, specs, evidence)
- [ ] Add run log entries for validations + PR actions
- [ ] `openspec validate --specs --strict --no-interactive`
- [ ] `rulebook task validate issue-10-native-desktop-spec`
- [ ] `scripts/agent_pr_preflight.sh` and open PR with auto-merge

## Decisions Made
- 2026-01-17: Choose Tauri (Rust) as the native shell and reuse the existing React renderer for the first migration milestone; package the Python backend as a bundled sidecar (see `rulebook/tasks/issue-10-native-desktop-spec/evidence/notes.md`).

## Errors Encountered
- (none)

## Runs

### 2026-01-17 worktree setup
- Command: `scripts/agent_controlplane_sync.sh`
- Key output: `Already on 'main'` / `Already up to date.`
- Evidence: `.worktrees/issue-10-native-desktop-spec`

- Command: `scripts/agent_worktree_setup.sh 10 native-desktop-spec`
- Key output: `Worktree created: .worktrees/issue-10-native-desktop-spec`
- Evidence: `git worktree list`

### 2026-01-17 rulebook task create
- Command: `rulebook task create issue-10-native-desktop-spec`
- Key output: `✅ Task issue-10-native-desktop-spec created successfully`
- Evidence: `rulebook/tasks/issue-10-native-desktop-spec/`

### 2026-01-17 openspec validate
- Command: `openspec validate --specs --strict --no-interactive`
- Key output: `Totals: 4 passed, 0 failed (4 items)`
- Evidence: `openspec/specs/`

### 2026-01-17 rulebook task validate (initial)
- Command: `rulebook task validate issue-10-native-desktop-spec`
- Key output: `✅ Task issue-10-native-desktop-spec is valid` (warnings about Given/When/Then in `specs/native-desktop-rewrite/spec.md`)
- Evidence: `rulebook/tasks/issue-10-native-desktop-spec/specs/native-desktop-rewrite/spec.md`

### 2026-01-17 rulebook task validate (after fix)
- Command: `rulebook task validate issue-10-native-desktop-spec`
- Key output: `✅ Task issue-10-native-desktop-spec is valid`
- Evidence: `rulebook/tasks/issue-10-native-desktop-spec/specs/native-desktop-rewrite/spec.md`

### 2026-01-17 frontend install (pnpm)
- Command: `pnpm -C frontend install --frozen-lockfile`
- Key output: `Packages: +323` / `Done in 910ms`
- Evidence: `frontend/node_modules/`

### 2026-01-17 frontend lint/build
- Command: `pnpm -C frontend lint`
- Key output: `<no output>`
- Evidence: `frontend/eslint.config.js`

- Command: `pnpm -C frontend build`
- Key output: `✓ built in 3.15s` (chunk size warning emitted)
- Evidence: `frontend/dist/`

### 2026-01-17 python compileall
- Command: `python3 -m compileall backend/app`
- Key output: `Compiling 'backend/app/main.py'...`
- Evidence: `backend/app/`
