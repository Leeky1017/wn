# Proposal: issue-13-ui-layout-proportions

## Why
Windows packaged builds show skewed proportions (center canvas feels too narrow versus side panes) and can white-screen when backend/resource paths are wrong. We need a balanced writer-first layout while hardening packaged startup.

## What Changes
- Keep the four-zone layout fixed-width but rebalance the canvas max width and padding for common 1366–1920px screens.
- Remove resizer-only UI so the layout stays consistent with the desktop UI spec.
- Harden packaged Electron startup (log capture, backend exe resolution, safer zoom init).
- Update Windows packaging scripts and docs/demo references.

## Impact
- Affected specs: openspec/specs/writenow-desktop-ui/spec.md (layout alignment)
- Affected code: frontend/electron/main.cjs, frontend/src/styles/tokens.css, frontend/src/styles/app.css, frontend/src/App.tsx, frontend/package.json, scripts/build-windows.ps1, docs/DESKTOP.md, demo.html, backend/main_entry.py, .gitignore
- Breaking change: NO
- User benefit: packaged app launches reliably; default layout feels balanced and readable.
