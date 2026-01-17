# 关键技术实现细节（对应 MVP）

## 1) Agent 工作流（可控工具调用）

MVP 的 Agent 以“改写选区”为中心，强调 **可控性**：

- 输入：`content + selection + instruction`
- 输出：`patched_content + unified diff + summary`
- 写入：必须由用户点击“应用修改”触发

后端实现位置：
- `backend/app/agent/engine.py`：`edit_stream(...)`（流式事件）
- `backend/app/agent/providers.py`：OpenAI 兼容流式 provider + Mock provider

扩展到 ReAct 的建议：
- 把能力拆成工具（read/replace/outline/format/export/publish）
- 让模型输出结构化行动（JSON），后端只执行白名单工具并记录轨迹
- 每一步都生成 diff（或 patch），用户可逐步确认

## 2) WebSocket 流式任务

前端发送（示例）：

```json
{
  "type": "edit",
  "request": {
    "path": "welcome.md",
    "content": "...",
    "selection": { "from": 10, "to": 40 },
    "instruction": "改得更口语化"
  }
}
```

后端流式返回事件：

- `log`：可观测信息（阶段/提示）
- `delta`：生成中的增量文本（前端展示草稿）
- `result`：最终结果（diff + patched_content）
- `error`：错误信息

后端入口：
- `backend/app/main.py`：`/ws/agent`

## 3) Diff 预览（unified diff）

后端 diff：
- `backend/app/diffing.py`：基于 `difflib.unified_diff` 输出 unified diff 文本

前端 diff 渲染：
- `frontend/src/components/DiffModal.tsx`：按行首 `+/-/@@` 做语义高亮

## 4) 排版引擎（规则 + 模板）

MVP 采用“Markdown → HTML + 平台 CSS 模板”的方式：

- 渲染：`markdown`（`extra`/`sane_lists`）
- 模板：`backend/app/formatting/templates/*.css`
- 输出：完整 HTML（内联 style，便于下载/复制）
- 检查：标题层级跳跃、段落过长等 warnings

后端位置：
- `backend/app/formatting/render.py`

可进阶方向：
- Markdown AST 解析（更精细的结构识别与规则应用）
- 平台特定结构（分隔符、卡片、提示块）用规则引擎生成，而非仅 CSS

