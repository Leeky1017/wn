# Spec: writenow-v2-architecture

## Purpose

定义 WriteNow V2 的完整系统架构，作为所有开发工作的权威参考。WriteNow 是一个 AI 驱动的文字创作 IDE，采用本地优先策略，专为内容创作者设计。

## Requirements

### Requirement: 技术栈选型 MUST
技术栈 MUST 覆盖 React、Electron、SQLite 与云端 AI。

前端、桌面端、数据层与 AI 服务必须遵循以下技术栈：

- 前端: React 18 + TypeScript (strict) + Tailwind CSS v4
- 桌面框架: Electron
- 本地数据: SQLite (better-sqlite3)
- AI 服务: Claude / GPT 云 API

- Evidence: `package.json`

#### Scenario: 技术栈一致
- **WHEN** 审核依赖声明
- **THEN** `package.json` 包含 React、Tailwind、Electron 与 better-sqlite3 依赖

### Requirement: 系统分层架构 MUST
系统架构 MUST 明确区分表现层、业务逻辑层与数据层。

系统分为三个主要层次：表现层、业务逻辑层、数据层。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 进程通信
- **WHEN** 渲染进程需要访问本地文件或数据库
- **THEN** 必须通过 Electron IPC 调用主进程 API
- **THEN** 主进程执行实际的 I/O 操作并返回结果

#### Scenario: AI 服务调用
- **WHEN** 用户触发 AI SKILL
- **THEN** 渲染进程通过 IPC 发送请求到主进程
- **THEN** 主进程调用云 API 并流式返回结果

### Requirement: 目录结构 MUST
目录结构 MUST 按规范组织 electron/ 与 src/ 等目录。

项目目录结构必须遵循以下规范：

```
WriteNow/
├── electron/                 # Electron 主进程代码
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   └── ipc/                 # IPC 处理器
│       ├── index.ts         # IPC 注册入口
│       ├── files.ts         # 文件操作 IPC
│       ├── database.ts      # 数据库操作 IPC
│       └── ai.ts            # AI 服务 IPC
│
├── src/                     # 前端源码
│   ├── main.tsx             # React 入口
│   ├── App.tsx              # 根组件
│   ├── index.css            # 全局样式 + Tailwind
│   │
│   ├── components/          # UI 组件
│   │   ├── ActivityBar.tsx
│   │   ├── Editor.tsx
│   │   ├── AIPanel.tsx
│   │   ├── StatsBar.tsx
│   │   ├── SidebarPanel.tsx
│   │   ├── sidebar-views/   # 侧边栏视图组件
│   │   └── ui/              # 基础 UI 组件 (shadcn)
│   │
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useIpc.ts        # IPC 调用封装
│   │   ├── useEditor.ts     # 编辑器状态
│   │   └── useAI.ts         # AI 交互
│   │
│   ├── stores/              # 状态管理 (Zustand)
│   │   ├── editorStore.ts   # 编辑器状态
│   │   ├── sidebarStore.ts  # 侧边栏状态
│   │   ├── aiStore.ts       # AI 面板状态
│   │   └── settingsStore.ts # 用户设置
│   │
│   ├── lib/                 # 工具函数
│   │   ├── ipc.ts           # IPC 客户端
│   │   └── utils.ts         # 通用工具
│   │
│   └── types/               # TypeScript 类型定义
│       ├── ipc.ts           # IPC 消息类型
│       ├── editor.ts        # 编辑器类型
│       └── ai.ts            # AI 相关类型
│
├── openspec/                # OpenSpec 规范文档
├── rulebook/                # Rulebook 任务
└── 配置文件 (package.json, tsconfig.json, etc.)
```

- Evidence: `src/`

#### Scenario: 新增功能模块
- **WHEN** 需要添加新功能
- **THEN** 前端 UI 放在 `src/components/`
- **THEN** 状态逻辑放在 `src/stores/`
- **THEN** 主进程逻辑放在 `electron/ipc/`

### Requirement: Electron IPC 通信规范 MUST
IPC 规范 MUST 采用 domain:action 命名并保持类型一致。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: IPC Channel 命名
- **WHEN** 定义新的 IPC 通道
- **THEN** 使用 `domain:action` 格式命名
- **THEN** 示例: `file:read`, `file:write`, `ai:skill:run`, `db:article:list`

#### Scenario: IPC 类型安全
- **WHEN** 定义 IPC 请求和响应
- **THEN** 必须在 `src/types/ipc.ts` 中定义类型接口
- **THEN** 主进程和渲染进程共享同一类型定义

```typescript
// src/types/ipc.ts
export interface IpcChannels {
  'file:read': {
    request: { path: string };
    response: { content: string; mtime: number };
  };
  'file:write': {
    request: { path: string; content: string };
    response: { success: boolean };
  };
  'ai:skill:run': {
    request: { skillId: string; input: string; context?: string };
    response: AsyncIterable<{ type: 'delta' | 'done'; text?: string }>;
  };
}
```

### Requirement: 数据层设计 MUST
数据层 MUST 使用 SQLite (better-sqlite3) 并遵循定义的 schema。

采用 SQLite 作为本地数据库，使用 better-sqlite3 进行同步操作。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 数据库 Schema

```sql
-- 文章表
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  format TEXT DEFAULT 'markdown',  -- 'markdown' | 'richtext'
  workflow_stage TEXT DEFAULT 'draft',  -- 'idea' | 'outline' | 'draft' | 'review' | 'published'
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 文章快照 (版本历史)
CREATE TABLE article_snapshots (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reason TEXT,  -- 保存原因
  actor TEXT DEFAULT 'user',  -- 'user' | 'ai'
  created_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- SKILL 定义
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  system_prompt TEXT,
  user_prompt_template TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet',
  is_builtin INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 创作统计
CREATE TABLE writing_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
  word_count INTEGER DEFAULT 0,
  writing_minutes INTEGER DEFAULT 0,
  articles_created INTEGER DEFAULT 0,
  articles_published INTEGER DEFAULT 0
);

-- 用户设置
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### Scenario: 数据访问
- **WHEN** 渲染进程需要读写数据
- **THEN** 通过 IPC 调用主进程的数据库模块
- **THEN** 主进程同步执行 SQL 并返回结果

### Requirement: AI 服务集成 (SKILL 系统) MUST
AI 服务 MUST 通过 IPC 由主进程代理调用云 API。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: SKILL 定义结构

```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  tag: string;  // 分类标签

  // 提示词
  systemPrompt: string;
  userPromptTemplate: string;  // 支持 {{input}}, {{selection}}, {{context}} 占位符

  // 模型配置
  model: 'claude-sonnet' | 'claude-opus' | 'gpt-4' | 'gpt-4-turbo';
  temperature?: number;
  maxTokens?: number;

  // 元数据
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Scenario: SKILL 执行流程
- **WHEN** 用户点击 SKILL 卡片或输入指令
- **THEN** 渲染进程收集当前编辑器内容和选区
- **THEN** 通过 IPC 发送到主进程
- **THEN** 主进程调用云 API
- **THEN** 流式返回结果到渲染进程
- **THEN** 渲染进程展示 diff 并等待用户确认

#### Scenario: 内置 SKILL 列表
- **WHEN** 初始化默认 SKILL
- **THEN** 包含生成大纲、润色、扩写、改写、事实核查等能力

### Requirement: 状态管理 MUST
状态管理 MUST 使用 Zustand 并按领域拆分 store。

采用 Zustand 进行状态管理，按领域拆分 store。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: Store 划分

```typescript
// editorStore.ts - 编辑器状态
interface EditorState {
  activeFile: string | null;
  openTabs: string[];
  content: string;
  isDirty: boolean;
  editorMode: 'markdown' | 'word';
  viewMode: 'edit' | 'preview' | 'split';
  focusMode: boolean;
}

// sidebarStore.ts - 侧边栏状态
interface SidebarState {
  activeView: 'files' | 'outline' | 'workflow' | 'materials' | 'publish' | 'stats' | 'settings';
  sidebarWidth: number;
}

// aiStore.ts - AI 面板状态
interface AIState {
  isPanelOpen: boolean;
  messages: Message[];
  isStreaming: boolean;
  selectedModel: string;
  chatMode: 'agent' | 'auto' | 'normal';
}

// settingsStore.ts - 用户设置
interface SettingsState {
  theme: 'dark' | 'light';
  fontSize: number;
  dailyGoal: number;
  pomodoroMinutes: number;
}
```

#### Scenario: 状态持久化
- **WHEN** 用户关闭应用
- **THEN** 关键状态 (设置、打开的文件等) 保存到 SQLite
- **WHEN** 应用启动
- **THEN** 从 SQLite 恢复上次的状态

### Requirement: 构建与打包 MUST
构建与打包流程 MUST 支持 dev/prod 与多平台输出。

- Evidence: `package.json`

#### Scenario: 开发模式
- **WHEN** 开发者运行 `npm run dev`
- **THEN** Vite 启动开发服务器
- **THEN** Electron 加载 localhost:5173

#### Scenario: 生产构建
- **WHEN** 运行 `npm run build`
- **THEN** Vite 构建前端到 dist/
- **THEN** electron-builder 打包为平台安装包

#### Scenario: 支持平台
- **WHEN** 打包完成
- **THEN** 产出 Windows `.exe`、macOS `.dmg`、Linux `.AppImage`

### Requirement: 验证计划 MUST
验证计划 MUST 覆盖自动化测试与手动验证。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 自动化测试
- **WHEN** 执行 `npm run test`
- **THEN** 单元测试覆盖核心逻辑

#### Scenario: 手动验证
- **WHEN** 开发者运行 `npm run dev`
- **THEN** Electron 窗口正常显示
- **THEN** 通过 `window.writenow.invoke()` 确认 IPC 通信正常

### Requirement: 实施阶段 MUST
实施阶段 MUST 与实施策略 spec 的 Phase 规划保持一致。

- Evidence: `openspec/specs/writenow-implementation-strategy/spec.md`

#### Scenario: 阶段规划一致
- **WHEN** 查看实施策略
- **THEN** Phase 1 覆盖基础框架与本地 MVP
- **THEN** Phase 2 覆盖后端服务与云同步
