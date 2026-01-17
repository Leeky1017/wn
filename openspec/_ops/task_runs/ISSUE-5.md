# ISSUE-5
- Issue: https://github.com/Leeky1017/wn/issues/5
- Branch: task/5-desktop-ui-refactor
- PR: <fill-after-created>

## Goal
- Refactor `frontend/src` to match `demo.html` (writer-first, premium light theme) while keeping Electron + local Python backend integration working.

## Status
- CURRENT: UI refactor + Story Map/Skills/IPC implemented; ready to commit and open PR.

## Next Actions
- [ ] Commit changes (all commits include `(#5)`)
- [ ] Open PR with `Closes #5` and enable auto-merge
- [ ] Wait for checks: `ci` / `openspec-log-guard` / `merge-serial`

## Decisions Made
- 2026-01-17: Use `demo.html` as the source of truth for layout + tokens; keep existing backend APIs and extend only when required for Story Map.

## Errors Encountered
- 2026-01-17: `scripts/agent_controlplane_sync.sh` refused to run due to dirty controlplane → stashed changes and applied them inside worktree.

## Runs

### 2026-01-17 create issue
- Command: `gh issue create -t "WriteNow Desktop UI refactor to match demo.html" ...`
- Key output: `https://github.com/Leeky1017/wn/issues/5`
- Evidence: Issue #5

### 2026-01-17 worktree setup
- Command: `git stash push -u -m "wip: issue-5 setup" && scripts/agent_controlplane_sync.sh && scripts/agent_worktree_setup.sh 5 desktop-ui-refactor && cd .worktrees/issue-5-desktop-ui-refactor && git stash pop`
- Key output: `Worktree created: .worktrees/issue-5-desktop-ui-refactor`
- Evidence: `.worktrees/issue-5-desktop-ui-refactor`

### 2026-01-17 frontend install/lint/build
- Command: `pnpm -C frontend install && pnpm -C frontend lint && pnpm -C frontend build`
- Key output: `eslint .` (pass) + `vite build` (pass)
- Evidence: `frontend/pnpm-lock.yaml` updated; production build output under `frontend/dist/`

### 2026-01-17 openspec validate
- Command: `openspec validate --specs --strict --no-interactive`
- Key output: `Totals: 4 passed, 0 failed (4 items)`
- Evidence: `openspec/specs/writenow-desktop-ui/spec.md`
