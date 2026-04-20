# Uncontrolled Editors Implementation Plan

## Context Summary

Based on `UNCONTROLLED_EDITORS_CONTEXT.md`, the task is to convert controlled editors (currently calling `onChange` on every keystroke) to use TanStack Form for uncontrolled state management.

**Current Architecture (Controlled):**
- Editors receive `appData` as prop and call `onChange(newData)` on every field change
- ProjectPage provides the `onChange` which passes to `setPresent()` for undo/redo history
- Every keystroke triggers a history snapshot and full editor re-render

**Goal Architecture (Uncontrolled):**
- Editors maintain their own internal state via TanStack Form
- Editors decide when to commit (on blur or explicit trigger)
- ProjectPage calls `getValue()` to get current state when needed (save/undo)
- ProjectPage calls `setValue()` to reset editor state on undo

## Project Findings

### Structure
- **9 Editors**: group-sort, plane-quiz, balloon-letter-picker, pair-matching, word-search, whack-a-mole, labelled-diagram, find-the-treasure, jumping-frog
- **TanStack Form**: Already installed (`@tanstack/react-form@^1.29.0`)
- **ProjectPage** (`pages/ProjectPage.tsx`): Manages history via `useProjectHistory()` context, calls `handleAppDataChange()` on editor changes
- **Registry** (`games/registry.ts`): Defines Editor component type as `{ appData, projectDir, onChange }`

### Key Files to Modify
1. **Editor interface** in `games/registry.ts` - needs new API
2. **ProjectPage.tsx** - needs to call `getValue()`/`setValue()` instead of `onChange`
3. **Each Editor** - needs to use TanStack Form
4. **CRUD hooks** - currently call `onChange`, need to use form.setValue

## Implementation Plan

### Phase 1: Temporary Disable Editors (for incremental development)

Temporarily disable 8 editors in `games/registry.ts` to work on one editor at a time:

```typescript
// Example disable pattern (comment out entries)
'plane-quiz': { /* disabled: TODO implement uncontrolled */ },
// Enable only during development:
// 'group-sort': { ... },
```

### Phase 2: Define New Editor Interface

Modify `GameRegistryEntry` in `registry.ts`:

```typescript
export interface GameRegistryEntry {
  Editor: ComponentType<{
    // --- Existing (will be deprecated) ---
    // appData: AnyAppData
    // projectDir: string
    // onChange: (data: AnyAppData) => void
    // --- New (uncontrolled) ---
    initialData: AnyAppData      // For initial render only
    projectDir: string
    // Methods for ProjectPage to call:
    getValue: () => AnyAppData   // Synchronous pull for save
    setValue: (data: AnyAppData) => void  // For undo
    onCommit: (data: AnyAppData) => void  // Called when editor commits
  }>
  createInitialData: () => AnyAppData
}
```

### Phase 3: Implement First Editor (Group Sort)

1. **Create `useGroupSortForm` hook** that:
   - Calls `useForm({ defaultValues: initialData })`
   - Returns `{ form, getValue, setValue, onCommit }`
   - Uses internal `form.state.values` for getValue
   - Uses `form.reset(data)` for setValue
   - Uses `handleSubmit` with `onCommit` callback

2. **Modify `GroupSortEditor.tsx`** to:
   - Accept new props (initialData, getValue, setValue, onCommit)
   - Use the form hook internally
   - Connect fields to form (not direct onChange)

3. **Modify CRUD hooks** to use `form.setValue` instead of `onChange`

### Phase 4: Update ProjectPage

Convert `ProjectPageInner` to work with new API:

```typescript
// Current:
<Editor appData={appData} projectDir={meta.projectDir} onChange={handleAppDataChange} />

// New:
const editorHandle = useXxxEditor(appData, handleAppDataChange)
<Editor
  initialData={appData}
  projectDir={meta.projectDir}
  getValue={editorHandle.getValue}
  setValue={editorHandle.setValue}
  onCommit={handleAppDataChange}
/>
```

Where `handleAppDataChange` is wrapped to call `setPresent()` for history.

### Phase 5: Repeat for Each Editor

Enable editors one at a time in registry, implement uncontrolled pattern, verify build/lint pass:

1. plane-quiz
2. balloon-letter-picker
3. pair-matching
4. word-search
5. whack-a-mole
6. labelled-diagram
7. find-the-treasure
8. jumping-frog

### Phase 6: Final Cleanup

- Remove all disabled guards
- Update registry interface to new API only
- Run full typecheck and lint

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking build during transition | Disable editors temporarily, enable one at a time |
| Type errors in shared components | Create type-safe form hook per editor, keep internal |
| Nested form complexity | Use `useFieldContext` for nested components (per answer) |
| Losing undo/redo | ProjectPage history uses `setPresent()` on commit, not every keystroke |

## Key Insight from Answer

The answer recommends creating **form outside the Editor** (in ProjectPage or a hook), then passing it as prop:

```typescript
// ProjectPage or custom hook:
const editorHandle = useGroupSortForm(initialData, onCommit)
// editorHandle.form is passed to Editor
// editorHandle.getValue() = () => form.state.values
// editorHandle.setValue = (data) => form.reset(data)
```

This avoids `useRef`/`useImperativeHandle` and keeps the API declarative (props, not refs).