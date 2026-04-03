import { useContext } from 'react'
import { useStore } from 'zustand'
import { ProjectHistoryContext } from './ProjectHistoryContext'
import { ProjectHistoryState } from './ProjectHistoryProvider'

export function useProjectHistory(): ProjectHistoryState {
  const store = useContext(ProjectHistoryContext)
  if (store === null) {
    throw new Error('useProjectHistory must be used within a ProjectHistoryProvider')
  }

  // Subscribe to store changes - triggers re-renders when state changes
  const present = useStore(store, (s) => s.data)

  const { setPresent } = store.getState()

  // Get travel controls, stable
  const controls = store.getControls()
  const { back, forward, reset, getHistory, canBack, canForward } = controls

  // Subscribe to control state changes for reactive UI
  const isCanBack = useStore(store, () => canBack())
  const isCanForward = useStore(store, () => canForward())
  const position = useStore(store, () => controls.position)

  return {
    present,
    setPresent,
    undo: back,
    redo: forward,
    getHistory,
    reset,
    canUndo: isCanBack,
    canRedo: isCanForward,
    position
  }
}
