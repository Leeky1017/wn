# issue-5-desktop-ui-refactor — Tasks

## UI / Frontend
- [ ] Extract `demo.html` CSS variables into `frontend/src/styles/tokens.css`
- [ ] Implement four-zone layout (ActivityBar / Sidebar / Workspace / AIPane)
- [ ] Replace sidebar with Library + Story Map modes
- [ ] Implement tab bar + edit/preview switch + paper canvas + status bar
- [ ] Add Export / Publish modal (.md / .docx / HTML)

## AI Companion
- [ ] Implement Skills Library (CRUD) UI + persistence via Electron fs/IPC
- [ ] Wire skill click → prefill composer → trigger agent WebSocket
- [ ] Keep diff/apply gating (no silent writes)

## Backend / Integration
- [ ] Ensure backend Python auto-spawns reliably in Electron main
- [ ] Add Story Map API for AI-generated outline nodes (fallback heuristic when no API key)
- [ ] Add native Electron menu (File/Edit/View/Help) with Cmd+K / Cmd+S accelerators

## Localization
- [ ] Add `frontend/src/i18n/` provider + `en.json` / `zh.json` from `demo.html`
- [ ] Language toggle switches labels and updates `lang` attribute

## Verification
- [ ] `pnpm -C frontend lint`
- [ ] `pnpm -C frontend build`
- [ ] `pnpm -C frontend desktop:dev` (manual smoke: layout parity, save, agent run, story map regenerate, skills persist)

