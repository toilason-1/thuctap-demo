import { createStore, type StoreApi } from 'zustand'
import { travel } from 'zustand-travel'
import { AnyAppData } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────
export const MAX_HISTORY_LENGTH = 50

// ── Store State Type ──────────────────────────────────────────────────────────
interface HistoryStoreState {
  data: AnyAppData
  setPresent: (newState: AnyAppData) => void
}

// ── Store Type ────────────────────────────────────────────────────────────────
export type HistoryStore = StoreApi<HistoryStoreState> & {
  getControls: () => {
    back: () => void
    forward: () => void
    reset: () => void
    getHistory: () => readonly ({ data: AnyAppData } | { getState: () => { data: AnyAppData } })[]
    canBack: () => boolean
    canForward: () => boolean
    position: number
  }
}

// ── Store Factory ─────────────────────────────────────────────────────────────
/**
 * Creates a scoped history store with time-travel capabilities.
 * Uses zustand-travel middleware for automatic undo/redo management.
 *
 * Note: We use a custom `setPresent` action instead of directly exposing `setState`
 * to maintain a clear API and ensure the travel middleware properly tracks changes.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createHistoryStore(initialState: AnyAppData) {
  const store = createStore<HistoryStoreState>()(
    travel(
      (set) => ({
        data: { ...initialState },
        setPresent: (newState: AnyAppData) => {
          set((state) => {
            state.data = newState
          })
        }
      }),
      {
        maxHistory: MAX_HISTORY_LENGTH,
        autoArchive: true,
        strict: process.env.NODE_ENV === 'development'
      }
    )
  )

  // intentional
  return store as unknown as HistoryStore
}
