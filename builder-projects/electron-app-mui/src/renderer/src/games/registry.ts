/**
 * Game Registry — the single file to update when adding a new game.
 *
 * To add a new game:
 *  1. Build your game template project and add it under template-projects/<game-id>/
 *  2. Create your editor component at  games/<game-id>/<Name>Editor.tsx
 *  3. Import it below and add one entry to GAME_REGISTRY
 *  4. If the game needs a runtime data transform, also add it to
 *     src/main/gameRegistry.ts
 *
 * --- Uncontrolled Editor Architecture ---
 *
 * The project is migrating from controlled (onChange on every keystroke) to uncontrolled
 * (TanStack Form with commit-on-blur). During transition, both APIs are supported.
 *
 * Old API (controlled):
 *   - appData: The current data (passed on every render)
 *   - projectDir: Project directory path
 *   - onChange: Callback when data changes
 *
 * New API (uncontrolled):
 *   - initialData: Initial data (only on first render)
 *   - projectDir: Project directory path
 *   - getValue: Function to get current data (sync)
 *   - setValue: Function to reset data (for undo)
 *   - onCommit: Callback when editor commits changes
 */

import type { AnyAppData } from '@shared/types'
import type { ComponentType } from 'react'

import GroupSortEditor from './group-sort/GroupSortEditor'
// TODO: Enable these editors after implementing uncontrolled architecture
// import BalloonLetterPickerEditor from './balloon-letter-picker/BalloonLetterPickerEditor'
// import FindTheTreasureEditor from './find-the-treasure/FindTheTreasureEditor'
// import JumpingFrogEditor from './jumping-frog/JumpingFrogEditor'
// import LabelledDiagramEditor from './labelled-diagram/LabelledDiagramEditor'
// import PairMatchingEditor from './pair-matching/PairMatchingEditor'
// import QuizEditor from './plane-quiz/QuizEditor'
// import WhackAMoleEditor from './whack-a-mole/WhackAMoleEditor'
// import WordSearchEditor from './word-search/WordSearchEditor'

// ── Old controlled API interface (deprecated) ─────────────────────────────────────
interface ControlledEditorProps {
  appData: AnyAppData
  projectDir: string
  onChange: (data: AnyAppData) => void
}

// ── New uncontrolled API interface ────────────────────────────────────────────────────
interface UncontrolledEditorProps {
  /** Initial data for first render only */
  initialData: AnyAppData
  /** Project directory for image imports */
  projectDir: string
  /** Synchronous pull for current data (called by parent on save) */
  getValue: () => AnyAppData
  /** Reset editor state (called by parent on undo) */
  setValue: (data: AnyAppData) => void
  /** Callback when editor commits changes (on blur/save) */
  onCommit: (data: AnyAppData) => void
}

// Union type - editors may use either API during transition
export type EditorProps = ControlledEditorProps | UncontrolledEditorProps

export interface GameRegistryEntry {
  /** Editor component rendered on the ProjectPage */
  Editor: ComponentType<EditorProps>
  /** Returns a fresh, empty appData object for new projects */
  createInitialData: () => AnyAppData
}

// ── Add new games here ────────────────────────────────────────────────────────────────
//
// NOTE: Only group-sort is currently implemented with uncontrolled architecture.
// Other editors are disabled during the migration. To enable them:
// 1. Implement their uncontrolled version
// 2. Uncomment their import above
// 3. Uncomment their entry below (with new API)
//
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'group-sort': {
    Editor: GroupSortEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({
      groups: [],
      items: [],
      _groupCounter: 0,
      _itemCounter: 0
    })
  },

  // --- Disabled editors (TODO: implement uncontrolled) ---
  // 'plane-quiz': {
  //   Editor: QuizEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     questions: [],
  //     _questionCounter: 0
  //   })
  // },
  //
  // 'balloon-letter-picker': {
  //   Editor: BalloonLetterPickerEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     words: [],
  //     _wordCounter: 0
  //   })
  // },
  //
  // 'pair-matching': {
  //   Editor: PairMatchingEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     items: [],
  //     minTotalPairs: 2,
  //     _itemCounter: 0
  //   })
  // },
  //
  // 'word-search': {
  //   Editor: WordSearchEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     items: [],
  //     _itemCounter: 0
  //   })
  // },
  //
  // 'whack-a-mole': {
  //   Editor: WhackAMoleEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     title: '',
  //     grade: '',
  //     questions: [],
  //     _questionCounter: 0
  //   })
  // },
  //
  // 'labelled-diagram': {
  //   Editor: LabelledDiagramEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     imagePath: null,
  //     points: [],
  //     _pointCounter: 0
  //   })
  // },
  //
  // 'find-the-treasure': {
  //   Editor: FindTheTreasureEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     stages: [],
  //     _stageCounter: 0,
  //     _answerCounter: 0
  //   })
  // },
  //
  // 'jumping-frog': {
  //   Editor: JumpingFrogEditor as GameRegistryEntry['Editor'],
  //   createInitialData: () => ({
  //     questions: [],
  //     _questionCounter: 0,
  //     _answerCounter: 0
  //   })
  // }
}