# ISSUE-3
- Issue: https://github.com/Leeky1017/wn/issues/3
- Branch: task/3-ci-pnpm
- PR: (pending)

## Goal
- Fix GitHub Actions CI by ensuring `pnpm` is available before frontend install/lint/build.

## Status
- CURRENT: preparing PR.

## Next Actions
- [ ] Add Rulebook task for Issue #3
- [ ] Fix workflows (`ci` and `merge-serial`)
- [ ] Open PR with `Closes #3`
- [ ] Enable auto-merge and verify merged

## Runs

### 2026-01-17 root cause
- Command: `gh run view <run-id> --log-failed`
- Key output: `Unable to locate executable file: pnpm`
- Evidence: GitHub Actions logs
