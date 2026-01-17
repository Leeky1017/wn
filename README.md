# WriteNow (MVP)

AI 驱动的文字创作 IDE 形态 MVP：本地 Markdown 工作区 + AI 修改(diff 预览/应用) + 平台排版导出预览。

## 文档

- 架构：`docs/ARCHITECTURE.md`
- 路线图：`docs/ROADMAP.md`
- 关键技术：`docs/TECH.md`
- 桌面应用：`docs/DESKTOP.md`

## 快速开始（开发模式）

### 1) 启动后端（FastAPI + WebSocket）

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端默认会在 `data/workspace/` 里生成示例文档。

可选：配置 OpenAI 兼容模型（DeepSeek/Qwen/Doubao 等同理）

```bash
export OPENAI_API_KEY="..."
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"
```

也可以写到 `backend/.env`（后端启动时会自动加载）。

未配置时会自动使用本地 Mock AI（可运行、可预览 diff，但质量有限）。

### 2) 启动前端（React）

```bash
cd frontend
npm install   # 如果 npm 过慢，可改用：pnpm install
npm run dev   # 或：pnpm run dev
```

打开 `http://localhost:5173`。

## 桌面应用形态（Electron）

先按上面步骤准备好后端依赖（`backend/.venv` + `pip install`），然后：

```bash
cd frontend
pnpm install
pnpm desktop:dev
```

这会启动 Vite 开发服务器并打开 Electron 窗口；Electron 会自动拉起本地后端。

## 一键启动（推荐）

从仓库根目录直接运行：

```bash
node scripts/writenow.mjs
```

注：Ubuntu 24.04 如遇 Electron 报 `libasound.so.2`，请先执行 `sudo apt-get install -y libasound2t64`。
