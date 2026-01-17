# issue-5-desktop-ui-refactor — Proposal

## Summary

Refactor WriteNow Desktop App (Electron + React) UI to match the high-fidelity `demo.html` design: a writer-first, paper-centric layout with a lean Activity Bar, collapsible Sidebar (Library / Story Map), a Workspace with tabs + edit/preview, and an AI Companion pane with a persistent Skills Library.

## Plan

- Port `demo.html` design tokens into `frontend/src/styles/tokens.css` and rebuild layout components to match the four-zone blueprint.
- Add React Context i18n (`zh` default) + Activity Bar language toggle to mirror `demo.html` label behavior.
- Implement AI Skills module with local persistence via Electron IPC/fs and wire skill click → prefill composer → trigger agent.
- Add Story Map (sidebar mode) + backend API to generate outline nodes and support “Regenerate Map”.
- Preserve existing backend integration and keep AI diff/apply as an explicit user-approved action.

