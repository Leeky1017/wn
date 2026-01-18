# WriteNow

AI 驱动的文字创作 IDE。本地优先，专为内容创作者设计。

## 规范索引

- [writenow-v2-architecture](specs/writenow-v2-architecture/spec.md): V2 系统架构规范
- [writenow-business-model](specs/writenow-business-model/spec.md): 商业模型与产品规格
- [writenow-implementation-strategy](specs/writenow-implementation-strategy/spec.md): 实施策略与阶段计划

## 技术栈

- 前端: React 18 + TypeScript + Tailwind CSS
- 桌面框架: Electron
- 后端逻辑: Node.js (Electron Main Process)
- 数据存储: SQLite (better-sqlite3)
- AI 服务: 云 API 优先 (Claude, GPT)

## 工作流

本项目采用 openspec-rulebook-github-delivery 工作流。
