# Issue #10 — Native desktop rewrite (Win + mac): decision notes

## Decision
- Desktop shell framework: **Tauri (Rust) + system WebView** (WebView2 on Windows, WKWebView on macOS)
- Renderer strategy: keep the existing `frontend/` React UI for the first migration milestone
- Backend strategy: keep the existing Python FastAPI backend; dev starts via `python -m uvicorn`, packaged builds ship a backend sidecar executable

## Goals (from Issue #10)
- HiDPI/Retina 清晰度优先：避免缩放导致的系统性发虚（Windows 125%–200% DPI scale、macOS Retina）
- 性能优先：更快启动、更顺滑的输入/滚动、更可控的内存与 CPU 占用
- 不中断交付：允许分阶段迁移，维持 Issue → PR → Checks → Auto-merge 的门禁

## Options considered (high-level)

### Option A — Tauri (chosen)
Why it fits:
- Uses the **system WebView** (no bundled Chromium), typically reducing binary size and memory overhead vs Electron.
- Enables an **incremental migration** by reusing the existing React renderer and current backend API contract.
- Provides native window/menu/dialog integration and supports spawning a bundled backend sidecar.

Key risks / mitigations:
- Windows WebView2 runtime dependency → document installer/runtime expectations in the packaging milestone and add smoke checks.
- Cross-WebView differences (WKWebView vs WebView2) → include platform-specific QA in each milestone run log.

References:
- `https://tauri.app/`
- `https://v2.tauri.app/` (if using v2)

### Option B — Flutter
Why not (for this repo’s constraints):
- Requires a **full UI rewrite** in Dart to reach parity, increasing migration time and regression risk.
- Incremental reuse of the current React renderer is not the default path.

### Option C — Avalonia / .NET MAUI
Why not (for this repo’s constraints):
- Requires a new UI stack and runtime footprint; parity would still be a large rewrite.
- Packaging and backend-sidecar integration is feasible but adds another ecosystem shift.

### Option D — Qt (C++/QML)
Why not (for this repo’s constraints):
- Licensing considerations and a new stack (C++/QML) increase organizational and migration cost.

## Conclusion
Given WriteNow already has a production React renderer and a local Python backend, **Tauri provides the best clarity + performance trade-off while preserving delivery velocity** via an incremental “shell migration” (Electron → Tauri) rather than a full UI rewrite.

## Constraints carried forward (non-negotiable)
- Must comply with `openspec/specs/writenow-constitution/spec.md` (local-first, diff/apply gating, auditable snapshots, offline export).
- Must maintain a stable on-disk layout under app user data (`data/workspace/`, `data/snapshots/`, `data/writenow.sqlite3`).
