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

## Windows 打包/分发（EXE）

推荐在 Windows PowerShell 运行一键脚本：

```powershell
.\scripts\build-windows.ps1
```

输出目录：`frontend/release/`

- `WriteNow Setup <version>.exe`：NSIS 安装包（推荐分发；安装后从开始菜单启动）
- `WriteNow <version>.exe`：Portable 单文件（可直接拷到桌面运行；推荐给“只想双击 exe”的场景）
- `win-unpacked/`：免安装目录（可直接运行，但必须保留整个目录结构）

常见“白屏”原因（最常见）：

- 只把 `win-unpacked/WriteNow.exe` 单独拷到桌面，旁边没有 `resources/`（缺少 `resources/app.asar` / 前端静态资源等）

快速自检：

- 确认 `WriteNow.exe` 同级存在 `resources/` 目录
- 确认 `resources/app.asar` 存在
- 确认后端存在其一：
  - `resources/backend-dist/writenow-backend.exe`
  - `resources/backend-dist/writenow-backend/writenow-backend.exe`
