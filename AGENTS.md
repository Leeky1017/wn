# WriteNow - Agent Instructions
本仓库目标：构建一个 AI 驱动的文字创作 IDE（本地优先、可审计、可复现）。
## 技术栈
前端：React 18 + TypeScript + Tailwind CSS
桌面框架：Electron
后端逻辑：Node.js（运行在 Electron Main Process）
数据存储：SQLite（better-sqlite3）
AI 服务：云 API 优先（Claude、GPT）
## 核心设计参考
src 目录包含从 Figma 导出的权威 UI 设计，所有前端开发必须以此为准。
## 工作流程
本仓库沿用 openspec-rulebook-github-delivery 工作流：
- GitHub 是并发与交付唯一入口：Issue -> Branch -> PR -> Checks -> Auto-merge
- Issue 号 N 是任务唯一 ID
- 分支名：task/N-slug
- 每个 commit message 必须包含 (#N)
- PR body 必须包含 Closes #N
## 本地开发
npm install
npm run electron:dev
