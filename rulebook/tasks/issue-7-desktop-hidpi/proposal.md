# Proposal: issue-7-desktop-hidpi

## Why
WriteNow Electron 桌面端在 HiDPI/Retina/4K 与 Windows DPI 缩放环境下出现 UI “发虚/模糊”，影响可读性与观感，需要通过 Electron/Chromium 配置与全局样式提升渲染清晰度。

## What Changes
- 在 `frontend/electron/main.cjs` 中追加 Chromium 命令行开关，启用 HiDPI/Retina 渲染与硬件加速，并对 Linux 做兼容开关处理。
- 在 `createMainWindow()` 的 `BrowserWindow` 配置中补齐 `webPreferences` 的安全默认值与渲染质量相关设置。
- 创建窗口后锁定缩放因子，避免缩放导致的模糊。
- 在全局样式（`frontend/src/styles/tokens.css`）中增加字体与文本渲染优化规则。

## Impact
- Affected specs: [list]
- Affected code: `frontend/electron/main.cjs`, `frontend/src/styles/tokens.css`
- Breaking change: NO
- User benefit: HiDPI 环境下文字与边框更清晰锐利，缩放/调整窗口时保持稳定画质
