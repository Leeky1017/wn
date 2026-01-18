# Spec: issue-13-ui-layout-proportions

## Requirement: Canvas proportions stay balanced on common screens

The writer canvas defaults are tuned for 1366–1920px widths while keeping the four-zone layout fixed.

Defaults:
- `--canvas-max: 840px`
- `--canvas-padding-x: 64px`
- `--canvas-padding-y: 64px`
- For `min-width: 1600px`: `--canvas-max: 900px`, `--canvas-padding-x: 72px`, `--canvas-padding-y: 72px`

Side panes remain fixed-width per the desktop spec (Activity 48px, Sidebar 260px, AI 320px) with no resize handles.

#### Scenario: Balanced layout on typical desktops
- **GIVEN** the desktop app is running in the default layout
- **WHEN** the window width is between 1366px and 1920px
- **THEN** the paper canvas remains readable and the side panes do not overpower the workspace

#### Scenario: Fixed-width panes remain the default
- **GIVEN** the desktop app is running
- **WHEN** the desktop app is opened
- **THEN** sidebar and AI widths are fixed by tokens and no resize handles are present
