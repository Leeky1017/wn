## 1. Implementation
- [x] 1.1 Rebalance canvas sizing/padding while keeping 4-zone fixed widths
- [x] 1.2 Remove resizer-only UI to match the desktop layout spec
- [x] 1.3 Harden packaged Electron startup (logging, backend exe resolution, zoom init)
- [x] 1.4 Update Windows packaging assets + docs/demo references

## 2. Testing
- [x] 2.1 openspec validate --specs --strict --no-interactive
- [x] 2.2 pnpm -C frontend lint
- [x] 2.3 pnpm -C frontend build
- [x] 2.4 python -m compileall backend/app
- [x] 2.5 Build Windows portable exe and launch for manual check

## 3. Documentation
- [x] 3.1 Update docs/DESKTOP.md packaging guidance
- [x] 3.2 Update demo.html to reflect new canvas proportions
