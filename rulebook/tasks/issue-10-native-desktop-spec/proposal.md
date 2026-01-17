# issue-10-native-desktop-spec — Proposal

## Why
WriteNow 桌面端目前基于 Electron + React，在 Windows DPI 缩放与 macOS Retina 场景下存在清晰度与性能上的改进空间（例如文本/界面发虚、启动与滚动/输入不够顺滑、资源占用偏高）。本 Issue 的目标是在不破坏 WriteNow 现有「本地优先 + 可审计 + 可复现」硬约束的前提下，产出一份可执行的规格与迁移路线图，为后续重写提供可验收的里程碑与门禁。

## What Changes
- 明确「跨平台原生框架」选择结论与证据（优先清晰度与性能，同时尽量复用现有 React UI 以降低迁移风险）。
- 定义新桌面端的目标架构与模块边界：原生壳层、渲染层、Python backend（FastAPI）集成方式、数据目录与生命周期管理。
- 给出分阶段迁移策略与里程碑验收点：如何从 Electron 平滑迁移到新壳层，不中断迭代与交付。
- 输出场景化 OpenSpec（渲染清晰度、性能指标、启动/退出行为、backend 可靠性、迁移门禁等）。

## Non-goals
- Linux 支持
- 权限/安全加固（保持合理默认，但不是本 Issue 的主验收目标）

## Impact
- Affected specs: `openspec/specs/writenow-constitution/spec.md`（约束引用），`openspec/specs/writenow-delivery-workflow/spec.md`（流程门禁引用）
- Affected code: 本 PR 为“规格与计划”，不引入运行时代码变更
- Breaking change: NO
- User benefit: HiDPI/Retina 下更清晰的显示效果、更快的启动与更可控的资源占用（由后续迁移里程碑落地）
