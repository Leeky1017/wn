## 1. Implementation
- [x] 1.1 Add Electron/Chromium HiDPI switches
- [x] 1.2 Update BrowserWindow `webPreferences` defaults
- [x] 1.3 Enforce `webContents` zoom factor and limits
- [x] 1.4 Add global CSS rendering quality rules

## 2. Testing
- [x] 2.1 `openspec validate --specs --strict --no-interactive`
- [x] 2.2 `pnpm -C frontend lint`
- [x] 2.3 `pnpm -C frontend build`
- [x] 2.4 `python -m compileall backend/app`
- [ ] 2.5 Manual: launch desktop on HiDPI and verify crisp UI

## 3. Documentation
- [x] 3.1 Update `openspec/_ops/task_runs/ISSUE-7.md`
