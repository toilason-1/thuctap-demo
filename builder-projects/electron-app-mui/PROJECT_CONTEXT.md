Project Context
================

Goal
- Implement an editors-layer wrapper so that all existing editors can be driven by a new onCommit/getValue/setValue API in the parent, without requiring invasive changes to each editor's internal code.
- The wrapper forwards editor onChange calls to onCommit, enabling a gradual migration toward a formal commit-based data flow while reducing re-renders of the editor container.
- The initial pilot editor (plane-quiz) is not migrated yet; we wrap all current editors and plan to migrate editors progressively after validating the wrapper approach.

Rationale
- Performance: Herding re-renders in heavy editor trees is a key motivation. Wrapping editors to decouple inner state from parent state reduces top-level re-renders while preserving existing typing behavior.
- Compatibility: Editors currently rely on onChange to push immutable appData up for history/undo. The wrapper forwards onChange to onCommit, enabling the parent history flow to be preserved and gradually migrated.
- Non-disruptive: The wrapper is designed to require no edits inside editors themselves; the wrapper handles the bridging logic and imperative hooks for future state queries (getValue/setValue).

Context specifics
- Project structure: Electron app (renderer) with multiple game editors (plane-quiz, group-sort, balloon-letter-picker, pair-matching, word-search, whack-a-mole).
- Current state: App is type-checked and functional; the refactor targets performance improvements via a wrapper layer that minimizes parent re-renders.
- Migration plan: Phase 1 – introduce EditorWrapper and apply wrapper to all editors; Phase 2 – progressively migrate individual editors to new onCommit-based API, using getValue/setValue for value retrieval and control only at commit points.

Risks and considerations
- Type contracts across renderer/main IPC: keep changes isolated to the renderer wrapper layer for now to avoid IPC surface changes.
- Data shapes: AppData types are defined in the shared types module; the wrapper should operate on those shapes without mutating them.
- Undo/redo: The wrapper forwards onChange to onCommit; the parent’s history stack must be updated accordingly. getValue/setValue will be used by the parent for explicit value capture during undo operations in Phase 2.

Artifacts
- EditorWrapper.tsx: new generic wrapper for existing editors
- Documentation: current migration plan and project context stored in docs for reuse in future sessions

Notes
- If any editor exposes a non-standard API, wrapper usage can be adjusted to map the specific props as needed without touching editor internals.
