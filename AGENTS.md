# WriteNow — Agent Instructions

本仓库目标：构建一个 **AI 驱动的文字创作 IDE**（本地优先、可审计、可复现）。

## 文档权威（必须遵守）

- 项目权威文档（开发圣旨）在 `openspec/specs/`，尤其是：
  - `openspec/specs/writenow-constitution/spec.md`
  - `openspec/specs/writenow-delivery-workflow/spec.md`
- `docs/` 仅保留指针/入口与背景说明，避免形成第二套“圣旨”。

## 交付流程（必须遵守）

本仓库沿用 `$openspec-rulebook-github-delivery`：

- GitHub 是并发与交付唯一入口：**Issue → Branch → PR → Checks → Auto-merge**。
- Issue 号 `N` 是任务唯一 ID：
  - 分支名：`task/<N>-<slug>`
  - 每个 commit message 必须包含 `(#N)`
  - PR body 必须包含 `Closes #N`
  - 必须新增/更新：`openspec/_ops/task_runs/ISSUE-N.md`
- Rulebook task：`rulebook/tasks/issue-<N>-<slug>/`
- required checks：`ci` / `openspec-log-guard` / `merge-serial`

## 本地验证

- `openspec validate --specs --strict --no-interactive`
- `pnpm -C frontend lint`
- `pnpm -C frontend build`
- `python -m compileall backend/app`
