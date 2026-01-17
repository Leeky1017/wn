# WriteNow Project Constitution (OpenSpec)

This file is a high-level entrypoint for WriteNow terms and non-negotiable boundaries.
The canonical detailed constraints live in:

- `openspec/specs/writenow-constitution/spec.md`

## Project definition

WriteNow is an AI-driven writing IDE MVP: local Markdown workspace + AI-assisted edits with diff preview/apply + platform formatting export preview.

## Non-negotiable boundaries

- Local-first: the core product MUST be usable without cloud accounts.
- AI output MUST NOT silently mutate files: all content changes MUST be previewed and explicitly applied.
- Data artifacts (workspace, snapshots, metadata) MUST be stored locally and must be reproducible.
- Canonical constraints are tracked in OpenSpec specs; operational evidence is tracked in task run logs.

## Core terms (authoritative)

- `workspace`: local Markdown files the user edits (default: `data/workspace/`).
- `snapshot`: immutable historical content captured on write/revert (default: `data/snapshots/` + SQLite metadata).
- `instruction`: a user command for the AI agent to transform content.
- `diff`: a human-reviewable patch representing proposed edits.
- `export`: platform-specific HTML output derived from Markdown.
