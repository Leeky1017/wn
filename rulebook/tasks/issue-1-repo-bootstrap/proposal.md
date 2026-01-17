# issue-1-repo-bootstrap — Proposal

## Summary

为 WriteNow 仓库引入 SS 式的 OpenSpec + Rulebook + GitHub 交付基础设施与硬门禁，并导入当前 MVP 代码库：

- OpenSpec：`openspec/` 结构、spec-first 规范与 strict 校验
- Rulebook：`.rulebook` 配置与任务清单目录骨架
- GitHub：PR 模板 + workflows（`ci`/`openspec-log-guard`/`merge-serial`）
- Agent 工具：worktree / preflight / automerge 脚本
- 代码导入：backend/frontend/scripts 等（排除本地产物：`data/`、`node_modules/`、`.venv/`）

## Impact

- 交付流程标准化：Issue → Branch → PR → Checks → Auto-merge。
- 未来所有改动具备可追溯证据（spec + run log），降低协作漂移与回归风险。
