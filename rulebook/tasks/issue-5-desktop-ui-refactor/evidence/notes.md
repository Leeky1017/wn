# Notes — issue-5-desktop-ui-refactor

## Source of Truth
- `demo.html` is the UI reference: tokens, spacing, typography, and the 4-zone layout blueprint.

## Decisions
- Keep backend storage + diff/apply guarantees intact; Story Map gets a new read-only endpoint.
- Skills persistence lives in Electron main (userData JSON) and is accessed via preload IPC.

## Later
- Optional frameless window + custom title bar controls for Windows/Linux.

