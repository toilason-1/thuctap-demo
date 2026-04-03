import { useState, type ReactNode } from 'react'
import { AnyAppData } from '../types'
import { ProjectHistoryContext } from './ProjectHistoryContext'
import { createHistoryStore } from './ProjectHistoryStore'

// ── Provider ──────────────────────────────────────────────────────────────────
interface ProjectHistoryProviderProps {
  children: ReactNode
  initialState: AnyAppData
}

export function ProjectHistoryProvider({
  children,
  initialState
}: ProjectHistoryProviderProps): React.ReactElement {
  const [store] = useState(() => createHistoryStore(initialState))

  return <ProjectHistoryContext.Provider value={store}>{children}</ProjectHistoryContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Direct access to the scoped travel store.
 * Each ProjectHistoryProvider instance has its own isolated history state.
 *
 * @example
 * const { state, setPresent, controls, canBack, canForward } = useProjectHistory()
 * controls.back()   // undo
 * controls.forward() // redo
 */
export interface ProjectHistoryState {
  present: AnyAppData
  setPresent: (newState: AnyAppData) => void
  undo: () => void
  redo: () => void
  getHistory: () => readonly ({ data: AnyAppData } | { getState: () => { data: AnyAppData } })[]
  reset: () => void
  canUndo: boolean
  canRedo: boolean
  position: number
}
