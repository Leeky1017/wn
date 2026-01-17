# issue-3-ci-pnpm — Proposal

## Summary

修复 GitHub Actions 的 `ci` / `merge-serial` 工作流：当前使用 `actions/setup-node` 的 `cache: pnpm`，但 runner 上未预装 `pnpm`，导致 workflow 在 setup 阶段直接失败。

## Plan

- 移除 `actions/setup-node` 的 `cache: pnpm`（避免在未安装 pnpm 时触发报错）
- 使用 `corepack prepare pnpm@... --activate` 显式安装 pnpm
- 维持 OpenSpec strict validation 作为必过门禁
