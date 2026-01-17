# ISSUE-1
- Issue: #1
- Branch: task/1-repo-bootstrap
- PR: (pending)

## Goal
- Bootstrap WriteNow as an SS-style spec-first repo (OpenSpec + Rulebook + GitHub) and import the MVP codebase.

## Status
- CURRENT: preparing bootstrap PR for repo standardization.

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
