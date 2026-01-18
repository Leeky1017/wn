# WriteNow Windows 完整打包脚本
# 在 Windows PowerShell 中运行此脚本

$ErrorActionPreference = "Stop"

Write-Host "=== WriteNow Windows Build ===" -ForegroundColor Cyan

# 1. 进入项目目录
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot
Write-Host "Project root: $projectRoot"

# 2. 检查 Python
Write-Host "`n[1/5] Checking Python..." -ForegroundColor Yellow
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "ERROR: Python not found. Please install Python and add to PATH." -ForegroundColor Red
    exit 1
}
python --version

# 3. 创建后端虚拟环境并安装依赖
Write-Host "`n[2/5] Setting up backend..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pyinstaller

# 4. 用 PyInstaller 打包后端
Write-Host "`n[3/5] Building backend executable..." -ForegroundColor Yellow
pyinstaller --onedir --noconfirm --clean `
    --name "writenow-backend" `
    --add-data "app;app" `
    --hidden-import "uvicorn.logging" `
    --hidden-import "uvicorn.protocols.http" `
    --hidden-import "uvicorn.protocols.http.auto" `
    --hidden-import "uvicorn.protocols.websockets" `
    --hidden-import "uvicorn.protocols.websockets.auto" `
    --hidden-import "uvicorn.lifespan" `
    --hidden-import "uvicorn.lifespan.on" `
    --hidden-import "httpx" `
    --hidden-import "markdown" `
    --collect-submodules "uvicorn" `
    --collect-submodules "fastapi" `
    --collect-submodules "starlette" `
    --collect-submodules "pydantic" `
    main_entry.py

deactivate

# 5. 安装前端依赖并构建
Write-Host "`n[4/5] Building frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..."
    npm install -g pnpm
}

pnpm install

# 6. 打包 Electron（使用打包好的后端）
Write-Host "`n[5/5] Building Electron app..." -ForegroundColor Yellow

# 复制打包好的后端到 frontend/backend-dist
$backendDist = "$projectRoot\frontend\backend-dist"
if (Test-Path $backendDist) {
    Remove-Item -Recurse -Force $backendDist
}
Copy-Item -Recurse "$projectRoot\backend\dist\writenow-backend" $backendDist

pnpm run dist:win

Write-Host "`n=== Build Complete ===" -ForegroundColor Green
Write-Host "Output: $projectRoot\frontend\release\" -ForegroundColor Cyan
Write-Host "`nTips:" -ForegroundColor Yellow
Write-Host "1) 推荐分发/安装：运行 release 目录下的 'WriteNow Setup *.exe'（NSIS 安装包）"
Write-Host "2) 如果只想单文件运行：使用 release 目录下的 Portable 单文件（'WriteNow *.exe'，非 Setup 版本）"
Write-Host "3) 如果使用 win-unpacked 免安装目录：请保留整个 win-unpacked 文件夹，不要只拷贝 WriteNow.exe（缺少 resources 会导致白屏）"
