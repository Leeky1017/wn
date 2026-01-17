# ISSUE-1
- Issue: #1
- Branch: task/1-repo-bootstrap
- PR: https://github.com/Leeky1017/wn/pull/2

## Goal
- Bootstrap WriteNow as an SS-style spec-first repo (OpenSpec + Rulebook + GitHub) and import the MVP codebase.

## Status
- CURRENT: waiting for PR checks and merge.

## Next Actions
- [ ] Add Rulebook task skeleton for Issue #1
- [ ] Add OpenSpec specs + strict validation gate
- [ ] Add GitHub workflows (`ci`/`openspec-log-guard`/`merge-serial`)
- [ ] Add agent scripts (worktree / preflight / automerge)
- [ ] Import WriteNow codebase excluding local artifacts
- [ ] Create PR, enable auto-merge, verify merged
- [ ] Configure `main` branch protection + required checks

## Decisions Made
- 2026-01-17: Seed `main` with minimal commit to enable PR-based bootstrap.

## Runs

### 2026-01-17 seed main
- Command: `git init -b main`
- Key output: `Initialized empty Git repository`
- Evidence: `git log --oneline`

### 2026-01-17 push main
- Command: `git push -u origin main`
- Key output: `main -> main`
- Evidence: `gh repo view Leeky1017/wn`

### 2026-01-17 create Issue #1
- Command: `gh issue create -R Leeky1017/wn ...`
- Key output: `https://github.com/Leeky1017/wn/issues/1`
- Evidence: Issue #1

### 2026-01-17 local validation
- Command: `openspec validate --specs --strict --no-interactive`
- Key output: `Totals: 3 passed, 0 failed`
- Evidence: `openspec/specs/`

### 2026-01-17 open PR
- Command: `gh pr create -R Leeky1017/wn --base main --head task/1-repo-bootstrap ...`
- Key output: `https://github.com/Leeky1017/wn/pull/2`
- Evidence: PR #2
