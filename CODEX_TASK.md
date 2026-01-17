# Codex Task: WriteNow Frontend Refactoring

## Agent Identity & Mission
You are a Staff-level Frontend Engineer tasked with refactoring the WriteNow React frontend (`frontend/src`) to match the high-fidelity design and functionality demonstrated in `/home/leeky/work/WriteNow/demo.html`.

Your primary goal is to replace the existing UI with the new **"Writer Studio"** architecture while preserving all existing backend integrations (WebSocket, API calls).

---

## Core Design Principles (Non-Negotiable)

1.  **Premium Light Theme**: The base is a light, paper-centric palette. Extract all CSS variables from `demo.html` into a new design system file (e.g., `src/styles/tokens.css`).
2.  **"Writer-First" Layout**: The UI must prioritize the writing canvas. Sidebars and panels are tools, not distractions.
3.  **Zero Developer Junk**: No terminal panels, Git views, or line numbers cluttering the interface. This is a *Content Studio*, not a Code Editor.
4.  **Minimalism is Not Emptiness**: Every element must be intentional. Use spacing, typography, and subtle borders to create a "precise" feel, not a "bare" feel.

---

## Structural Blueprint (From Demo)

The layout consists of four primary horizontal zones:

| Zone | Component Name | Width/Behavior | Key Elements |
|---|---|---|---|
| **1. Activity Bar** | `<ActivityBar />` | `48px` fixed | Icons for: Library, Story Map, Search, Settings. Lang Toggle at bottom. |
| **2. Sidebar** | `<Sidebar />` | `260px` collapsible | Multi-mode: "Library" (file list) or "Story Map" (AI-generated outline). |
| **3. Workspace** | `<Workspace />` | `flex: 1` | Tab Bar, View Toggle (Edit/Preview), Canvas (Paper), Status Bar. |
| **4. AI Companion** | `<AIPane />` | `320px` fixed | Composer input, **Skills Library** (user-defined AI workflows). |

---

## Feature Implementation Details

### 1. AI Skills Module (`/src/components/SkillsPanel.tsx`)
- **Replace**: The old "Suggestions" chips.
- **Data Model**: `Skill { id, name, description, tag, promptTemplate }`
- **UI**:
    - List of `SkillCard` components.
    - "+ New Skill" button that opens a modal for defining custom prompts.
- **Behavior**: Clicking a skill card should populate the AI input and trigger the agent.

### 2. Story Map (`/src/components/StoryMap.tsx`)
- **Trigger**: Clicking the "layers" icon in the Activity Bar.
- **Data**: AI-generated (via a new backend endpoint or simulated). Contains nodes: `{ title, detail, depth }`.
- **UI**: A vertical "flowchart" style list with indentation and connection lines.
- **Interaction**: "Regenerate Map" button calls the AI.

### 3. Multi-Format Editor
- **Framework**: Continue using CodeMirror, but add a floating `<FormatToolbar />` above the paper.
- **Indicators**: Status bar should show current format (e.g., `Markdown Plus`, `Word Segment`).
- **Export**: The "Export / Publish" button should open a modal with options for `.md`, `.docx`, and platform-specific HTML.

### 4. Localization (`/src/i18n/`)
- **Strategy**: Implement a simple React Context-based i18n provider.
- **Dictionaries**: Create `en.json` and `zh.json` based on the `dict` object in `demo.html`.
- **Scope**: All UI text must be localized. Default to Chinese (`zh`).

---

## File Structure (Target State)

```
frontend/src/
├── App.tsx                 # Shell layout, context providers
├── components/
│   ├── ActivityBar.tsx
│   ├── Sidebar/
│   │   ├── LibraryPane.tsx
│   │   └── StoryMap.tsx
│   ├── Workspace/
│   │   ├── TabBar.tsx
│   │   ├── EditorCanvas.tsx    # The Paper + Toolbar
│   │   ├── PreviewPane.tsx
│   │   └── StatusBar.tsx
│   └── AIPane/
│       ├── Composer.tsx
│       └── SkillsPanel.tsx
├── i18n/
│   ├── context.tsx
│   ├── en.json
│   └── zh.json
├── styles/
│   ├── tokens.css           # Design tokens from demo.html
│   └── app.css              # Global styles
└── app/
    └── api.ts               # Existing API, preserve as-is
```

---

## Acceptance Criteria

1.  **Visual Parity**: Running the app should produce a UI indistinguishable from opening `demo.html` directly.
2.  **Functional Parity**: WebSocket connection, file save, and AI diff/apply must work as they do in the current codebase.
3.  **New Features**: Story Map and Skills Library are interactive and localized.
4.  **Code Quality**: No TypeScript errors. Components are modular and reusable.

---

## Reference Artifacts
- **Design Spec (Static Demo)**: `file:///home/leeky/work/WriteNow/demo.html`
- **Current Frontend Codebase**: `file:///home/leeky/work/WriteNow/frontend/src/`
- **Backend API (Preserve)**: `file:///home/leeky/work/WriteNow/backend/app/main.py`
