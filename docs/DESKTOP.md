# WriteNow 桌面应用（Electron）说明

## 目标

提供“VSCode/Cursor 一样的软件形态”：独立窗口、侧边栏/编辑器/预览区域、命令面板与快捷键；并在启动时自动拉起本地 FastAPI 后端。

## 开发模式

1) 安装后端依赖：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) 启动桌面应用：

```bash
cd frontend
pnpm install
pnpm desktop:dev
```

- Ubuntu 24.04 如果提示缺少 `libasound.so.2`，请安装：`sudo apt-get install -y libasound2t64`

- Electron 主进程：`frontend/electron/main.cjs`
- 预加载：`frontend/electron/preload.cjs`
- 开发启动脚本：`frontend/scripts/dev-desktop.mjs`

## 本地运行（renderer build）

```bash
cd frontend
pnpm install
pnpm build
pnpm desktop
```

## 运行机制

- Electron 启动时会以子进程方式运行 `uvicorn app.main:app`（默认 `127.0.0.1:8000`）
- 工作区与数据库默认写入 `Electron userData` 目录下的 `data/`
- 渲染进程通过 `window.writenow.apiBase/wsBase` 与后端通信（见 `frontend/src/app/api.ts`）
