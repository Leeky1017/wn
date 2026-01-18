# WriteNow 实施策略

## Purpose
基于系统架构规范与商业模型规范，定义 WriteNow V2 的分阶段实施策略，明确 Phase 1 本地 MVP 与 Phase 2 后端服务的任务拆解、依赖关系、文件改动、工作量预估与验收方式。

## Requirements

### Requirement: Phase 1 本地 MVP 详细任务分解

#### Task 1: 项目骨架与构建启动
- 文件改动: `package.json`, `vite.config.ts`, `index.html`, `electron/main.ts`, `electron/preload.ts`, `src/main.tsx`, `src/App.tsx`
- 依赖: 无
- 预估: 0.5-1 人日
- 技术细节:
  - Electron 主进程创建 `BrowserWindow`，开发态加载 `http://localhost:5173`，生产态加载 `dist/index.html`。
  - `electron:dev` 使用 `concurrently` 启动 Vite 与 Electron。
  - `contextIsolation` + `preload` 为 IPC 做准备。

#### Task 2: Tailwind CSS 配置步骤
- 文件改动: `src/styles/globals.css`, `src/index.css`, `tailwind.config.ts`, `postcss.config.cjs`, `src/main.tsx`
- 依赖: Task 1
- 预估: 0.5 人日
- 技术细节:
  - 创建 `tailwind.config.ts`，`content` 指向 `./index.html` 与 `./src/**/*.{ts,tsx}`。
  - 创建 `postcss.config.cjs`，启用 `tailwindcss` 与 `autoprefixer`。
  - 在 `src/styles/globals.css` 或 `src/index.css` 引入 Tailwind (`@import "tailwindcss";` 或 `@tailwind base/components/utilities`)。
  - `src/main.tsx` 统一导入全局样式，确保 UI 组件可用 Tailwind token 与自定义变量。

#### Task 3: Electron IPC 基础框架
- 文件改动: `electron/ipc/index.ts`, `electron/ipc/files.ts`, `electron/ipc/database.ts`, `electron/ipc/ai.ts`, `electron/preload.ts`, `src/types/ipc.ts`, `src/lib/ipc.ts`
- 依赖: Task 1
- 预估: 1 人日
- 技术细节:
  - IPC channel 命名采用 `domain:action`，并在 `src/types/ipc.ts` 定义请求/响应类型。
  - 主进程 `ipcMain.handle` 注册处理器；渲染进程通过 `ipcRenderer.invoke` 调用。
  - `preload` 使用 `contextBridge.exposeInMainWorld` 暴露 `window.writenow.invoke()`。

#### Task 4: SQLite 本地数据库初始化
- 文件改动: `electron/db/index.ts`, `electron/db/schema.sql`, `electron/ipc/database.ts`, `src/types/db.ts`
- 依赖: Task 3
- 预估: 1 人日
- 技术细节:
  - `better-sqlite3` 连接 `app.getPath('userData')/writenow.db`。
  - 启动时执行 schema 初始化与迁移。
  - 通过 IPC 暴露 `db:article:list`, `db:settings:get` 等基础接口。

#### Task 5: Zustand 状态管理集成
- 文件改动: `src/stores/editorStore.ts`, `src/stores/sidebarStore.ts`, `src/stores/aiStore.ts`, `src/stores/settingsStore.ts`, `src/hooks/useIpc.ts`
- 依赖: Task 1, Task 4
- 预估: 1 人日
- 技术细节:
  - 每个领域独立 store，明确初始状态与 action。
  - 先以内存状态完成交互，再逐步加入 SQLite 持久化。
  - 关键状态保存/恢复通过 IPC 与数据库连接。

#### Task 6: 连接 src 组件到应用入口
- 文件改动: `src/App.tsx`, `src/components/ActivityBar.tsx`, `src/components/Sidebar.tsx`, `src/components/Editor.tsx`, `src/components/AIPanel.tsx`, `src/components/StatsBar.tsx`
- 依赖: Task 1, Task 5
- 预估: 0.5 人日
- 技术细节:
  - `App` 负责布局拼装，组件从 Zustand store 读取状态。
  - 侧边栏视图组件统一通过 props 或 store 控制。
  - 以 Figma 导出组件为 UI 权威参考。

#### Phase 1 依赖关系总结
- Task 1 为所有后续任务基础。
- Task 2 依赖 Task 1。
- Task 3 依赖 Task 1。
- Task 4 依赖 Task 3。
- Task 5 依赖 Task 1 + Task 4。
- Task 6 依赖 Task 1 + Task 5。

#### Phase 1 验收标准
- `npm run electron:dev` 可启动桌面应用并加载 UI。
- 主视图组件渲染完整，交互状态可被 Zustand 管理。
- IPC 基础通道可调用，数据库文件初始化成功。
- Tailwind 样式生效，与 Figma 组件一致。

### Requirement: Phase 2 后端服务任务分解

#### Task 1: Supabase 项目初始化
- 文件改动: `.env`, `src/lib/supabase.ts`, `supabase/migrations/*.sql`
- 依赖: Phase 1 完成
- 预估: 0.5-1 人日
- 技术细节:
  - 创建 Supabase 项目与数据库 schema。
  - 配置本地开发环境变量与客户端初始化。

#### Task 2: 用户认证集成
- 文件改动: `src/components/auth/*`, `src/stores/authStore.ts`, `electron/ipc/auth.ts`
- 依赖: Phase 2 Task 1
- 预估: 1 人日
- 技术细节:
  - 采用 Supabase Auth 或 Clerk，获取 JWT 并本地保存。
  - 应用启动检查会话并刷新 token。

#### Task 3: AI API 代理实现
- 文件改动: `supabase/functions/ai-proxy/index.ts`, `src/lib/aiClient.ts`, `electron/ipc/ai.ts`
- 依赖: Phase 2 Task 2
- 预估: 1-2 人日
- 技术细节:
  - 后端函数校验订阅与额度，调用 Claude/GPT 并流式返回。
  - 记录用量并写入后端表。

#### Task 4: 数据同步实现
- 文件改动: `src/lib/sync.ts`, `src/stores/syncStore.ts`, `supabase/migrations/*.sql`
- 依赖: Phase 2 Task 1
- 预估: 1-2 人日
- 技术细节:
  - 本地写入后异步推送云端，采用 LWW 冲突策略。
  - 保留版本历史用于回滚。

#### Phase 2 验证检查点
- Supabase 项目可连接，schema 与本地一致。
- Auth 流程可注册/登录并刷新 token。
- AI 请求经代理可流式返回并记录用量。
- 数据同步在多端登录下可完成一次往返。

#### Phase 2 验收标准
- 付费用户登录后可使用高级 AI 模型。
- 数据在两台设备间同步且无明显冲突错误。
- 订阅状态变化可触发功能权限调整。

## Scenarios

### Scenario: Phase 1 本地 MVP 验证
- **WHEN** 运行 `npm run electron:dev`
- **THEN** Electron 应用正常启动并展示主界面
- **THEN** 通过 `window.writenow.invoke('db:article:list')` 得到空列表或默认值
- **THEN** UI 组件响应 Zustand 状态变更

### Scenario: Phase 2 后端服务验证
- **WHEN** 用户登录并触发 AI SKILL
- **THEN** AI 代理返回流式响应并记录用量
- **THEN** 修改文章后 5 秒内同步到云端
