# WriteNow 系统架构（MVP → 可扩展）

## 总览

WriteNow 的定位是“文字创作 IDE + AI Agent”，核心思路是 **前端负责高效交互与可视化**，**后端负责可控的工具调用与内容变更**，并坚持 **本地优先**：

- **前端**：React（编辑器 / 命令面板 / diff 预览 / 排版预览 / 快照时间线）
- **桌面壳**：Electron（应用窗口形态、启动时拉起本地后端）
- **本地后端**：FastAPI（文件/快照 API + WebSocket Agent 流式任务 + 排版引擎）
- **数据**：文件系统（Markdown 工作区）+ SQLite（快照元信息）
- **模型**：OpenAI 兼容接口（可替换 DeepSeek / Qwen / Doubao 等），无 Key 时使用 Mock

> MVP 已提供 Electron 桌面形态（见 `docs/DESKTOP.md`）。

## 模块划分

### 1) 前端（`frontend/`）

- **Workspace / FileTree**：文件树（`.md`），打开/新建
- **Editor**：Markdown 编辑（选区/光标位置 → 触发 Agent）
- **Command Palette**：`Ctrl/Cmd + K` 输入指令，执行“改写选区”
- **Diff Preview**：统一 diff 预览，用户确认后才写入
- **Preview / Export**：平台模式切换（公众号/知乎/小红书），实时 HTML 预览与下载
- **Snapshots**：按文件展示快照列表，支持回退

### 2) 后端（`backend/`）

- **REST API**
  - `GET /api/files`：列出工作区文件
  - `GET /api/file`：读取文件内容
  - `PUT /api/file`：写入并创建快照（reason/actor）
  - `GET /api/snapshots`：快照列表
  - `POST /api/snapshots/revert`：回退到快照
  - `POST /api/export`：平台排版导出（HTML + warnings）
  - `GET /api/platforms`：平台列表
- **WebSocket Agent**
  - `WS /ws/agent`：流式改写任务（delta → result）
- **Storage**
  - 文件系统：`data/workspace/*.md`
  - 快照内容：`data/snapshots/<uuid>.md`
  - 元信息：`data/writenow.sqlite3`（快照表）
- **Formatting**
  - Markdown → HTML（`markdown`）
  - CSS 模板（按平台切换）
  - 基础规则检查（标题层级、段落过长…）

## 关键数据流

### A) AI 修改（可控写入 + diff）

1. 用户在编辑器中选区（或仅光标 → 自动扩展到当前段落）
2. `Ctrl/Cmd + K` 打开命令面板，输入指令
3. 前端通过 WebSocket 发送：
   - `content`（当前全文）
   - `selection.from/to`（选区范围）
   - `instruction`
4. 后端 Agent：
   - 选择 provider（OpenAI 兼容 / Mock）
   - 流式输出 `delta`
   - 生成 `patched_content` + `unified diff`
5. 前端展示 diff；用户点击“应用修改”后：
   - `PUT /api/file` 写入
   - 自动创建快照（`actor=ai`，`reason=ai:<instruction>`）

### B) 排版导出（平台模式）

1. 用户切换平台模式或编辑内容
2. 前端 debounce 后调用 `POST /api/export`
3. 后端返回 `html + warnings`
4. 前端 iframe `srcDoc` 预览，并支持下载 HTML

### C) 快照（轻量版本管理）

- 每次 `PUT /api/file` 都会生成快照（含 actor/reason）
- 回退：`POST /api/snapshots/revert` 写回文件并生成新快照（reason=`revert:<id>`)

## 可扩展设计（面向 V2/V3）

- **ReAct/MCP 工具层**：将“改写/重组/查素材/排版/发布”拆成工具集，Agent 通过标准协议调用，提升可靠性与可观测性。
- **多平台发布**：公众号草稿箱 API（优先），知乎/小红书可先走 RPA，后续再替换为 API/官方开放能力。
- **素材库**：PDF/网页/图片 → 向量索引 + 摘要缓存，编辑时支持 `@素材` 引用。
- **行为数据（本地→可选上云）**：记录命令、选区、diff 通过率、回退率等，为“场景深度理解”与并购资产做准备。
