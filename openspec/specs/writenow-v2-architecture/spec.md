# WriteNow V2 系统架构规范

## Purpose

定义 WriteNow V2 的完整系统架构，作为所有开发工作的权威参考。WriteNow 是一个 AI 驱动的文字创作 IDE，采用本地优先策略，专为内容创作者设计。

## 技术栈

### 前端 (Renderer Process)

- 框架: React 18
- 语言: TypeScript (strict mode)
- 样式: Tailwind CSS v4
- 组件库: 基于 shadcn/ui 的自定义组件 (src/components/ui/)
- 图标: Lucide React
- 构建工具: Vite

### 桌面框架 (Main Process)

- 框架: Electron
- IPC: 类型安全的 Electron IPC
- 本地数据: better-sqlite3

### AI 服务

- 云 API: Claude (Anthropic), GPT (OpenAI)
- 本地模型: 预留接口 (Ollama 等)

---

## Requirements

### Requirement: 系统分层架构

系统分为三个主要层次：表现层、业务逻辑层、数据层。

#### Scenario: 进程通信

- **WHEN** 渲染进程需要访问本地文件或数据库
- **THEN** 必须通过 Electron IPC 调用主进程 API
- **THEN** 主进程执行实际的 I/O 操作并返回结果

#### Scenario: AI 服务调用

- **WHEN** 用户触发 AI SKILL
- **THEN** 渲染进程通过 IPC 发送请求到主进程
- **THEN** 主进程调用云 API 并流式返回结果

---

### Requirement: 目录结构

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

#### Scenario: 新增功能模块

- **WHEN** 需要添加新功能
- **THEN** 前端 UI 放在 src/components/
- **THEN** 状态逻辑放在 src/stores/
- **THEN** 主进程逻辑放在 electron/ipc/

---

### Requirement: Electron IPC 通信规范

#### Scenario: IPC Channel 命名

- **WHEN** 定义新的 IPC 通道
- **THEN** 使用 `domain:action` 格式命名
- **THEN** 示例: `file:read`, `file:write`, `ai:skill:run`, `db:article:list`

#### Scenario: IPC 类型安全

- **WHEN** 定义 IPC 请求和响应
- **THEN** 必须在 src/types/ipc.ts 中定义类型接口
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

---

### Requirement: 数据层设计

采用 SQLite 作为本地数据库，使用 better-sqlite3 进行同步操作。

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

---

### Requirement: AI 服务集成 (SKILL 系统)

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

以下为首批内置 SKILL:

1. **生成大纲** (generate-outline): 根据主题生成文章大纲
2. **润色文本** (polish-text): 优化文本表达和用词
3. **扩写内容** (expand-content): 扩展和丰富现有内容
4. **改写风格** (rewrite-style): 转换文本风格和语气
5. **事实核查** (fact-check): 验证内容中的事实和数据

---

### Requirement: 状态管理

采用 Zustand 进行状态管理，按领域拆分 store。

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

---

### Requirement: 构建与打包

#### Scenario: 开发模式

- **WHEN** 开发者运行 `npm run dev`
- **THEN** Vite 启动开发服务器
- **THEN** Electron 加载 localhost:5173

#### Scenario: 生产构建

- **WHEN** 运行 `npm run build`
- **THEN** Vite 构建前端到 dist/
- **THEN** electron-builder 打包为平台安装包

#### Scenario: 支持平台

- Windows: .exe 安装包
- macOS: .dmg 安装包
- Linux: .AppImage

---

## 验证计划

### 自动化测试

1. 单元测试: 使用 Vitest 测试核心逻辑
   - 命令: `npm run test`

2. 组件测试: 使用 React Testing Library
   - 命令: `npm run test:components`

### 手动验证

1. 启动应用: `npm run dev` 后确认 Electron 窗口正常显示
2. 验证 IPC: 在 DevTools 控制台调用 window.writenow.invoke() 确认通信正常
3. 验证 UI: 对照 src/components/ 设计确认渲染正确

---

## 实施阶段

### Phase 1: 基础框架 (P0)

- 配置 Tailwind CSS
- 配置 Vite + React + TypeScript
- 实现 Electron IPC 基础框架
- 实现 SQLite 数据库初始化
- 连接 src/ 目录组件到应用入口

### Phase 2: 核心功能 (P0)

- 实现文件管理 (创建、读取、保存)
- 实现编辑器功能 (Markdown/Word 双模式)
- 实现状态管理 (Zustand stores)
- 集成 AI 服务 (Claude API)
- 实现 SKILL 系统

### Phase 3: 增强功能 (P1)

- 实现创作统计
- 实现番茄钟
- 实现工作流管理
- 实现导出功能

### Phase 4: 抛光与发布 (P2)

- 完善 UI 细节
- 性能优化
- 打包测试
- 发布第一个版本
