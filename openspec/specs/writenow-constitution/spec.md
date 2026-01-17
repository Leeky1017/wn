# Spec: writenow-constitution

## Purpose

Define non-negotiable project boundaries and core behaviors for WriteNow (local-first writing IDE + AI diff/apply + export), so the product remains predictable and auditable.

## Requirements

### Requirement: Local-first storage layout MUST be stable

WriteNow MUST store user content and history locally with a stable default layout:

- workspace Markdown files under `data/workspace/`
- snapshot contents under `data/snapshots/`
- snapshot metadata in `data/writenow.sqlite3`

#### Scenario: Backend initializes local storage on first run
- **WHEN** the backend initializes storage on a fresh machine
- **THEN** `data/workspace/` and `data/snapshots/` are created if missing

### Requirement: AI edits MUST be user-approved via diff/apply

AI-generated changes MUST NOT silently mutate user files.
The system MUST present a human-reviewable diff and MUST only write when the user explicitly applies the change.

#### Scenario: A proposed edit is not persisted without explicit apply
- **WHEN** the AI produces a proposed patch for a file
- **THEN** the file content is not updated until the user applies the change

### Requirement: Every write MUST create an auditable snapshot

Whenever a file is written (including AI-applied edits and revert operations), the backend MUST create an immutable snapshot record with:

- `path`
- `reason`
- `actor`
- `created_at`

#### Scenario: A file update creates a snapshot entry
- **WHEN** a file is updated via the backend write API
- **THEN** a snapshot entry is recorded for that file path

### Requirement: Platform export MUST be reproducible from Markdown

Platform export MUST be derived from Markdown content deterministically (modulo platform templates) and must not require network access.

#### Scenario: Export runs offline
- **WHEN** running export on a machine without network
- **THEN** HTML output can still be produced from Markdown content
