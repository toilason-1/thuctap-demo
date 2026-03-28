import diff, { Difference } from 'microdiff'
import { useCallback, useState } from 'react'

const MAX_HISTORY = 50

export interface HistoryState<T> {
  present: T
  canUndo: boolean
  canRedo: boolean
  push: (next: T) => void
  undo: () => void
  redo: () => void
  reset: (next: T) => void
  past: Difference[][]
  future: Difference[][]
  getReachableStates: () => T[]
}

export function applyDiff<T>(base: T, diffs: Difference[]): T {
  const cloned = structuredClone(base)
  for (const d of diffs) {
    let target = cloned as Record<string, unknown> | unknown[]
    for (let i = 0; i < d.path.length - 1; i++) {
      target = (target as Record<string, unknown>)[d.path[i] as string] as
        | Record<string, unknown>
        | unknown[]
    }
    const prop = d.path[d.path.length - 1]

    if (d.type === 'REMOVE') {
      if (Array.isArray(target)) {
        target.splice(prop as number, 1)
      } else {
        delete (target as Record<string, unknown>)[prop as string]
      }
    } else {
      ;(target as Record<string, unknown>)[prop as string] = d.value
    }
  }
  return cloned
}

export function invertDiff(diffs: Difference[]): Difference[] {
  const inverted: Difference[] = []
  // Process in reverse order to unwind neatly
  for (let i = diffs.length - 1; i >= 0; i--) {
    const d = diffs[i]
    if (d.type === 'CREATE') {
      inverted.push({ type: 'REMOVE', path: d.path, oldValue: d.value })
    } else if (d.type === 'REMOVE') {
      inverted.push({ type: 'CREATE', path: d.path, value: d.oldValue })
    } else if (d.type === 'CHANGE') {
      inverted.push({
        type: 'CHANGE',
        path: d.path,
        value: d.oldValue,
        oldValue: d.value
      })
    }
  }
  return inverted
}

/**
 * Diff-based undo/redo. It records forward diffs so we can recreate history sparsely.
 * past contains differences from (n-1) going FORWARDS to n.
 * future contains differences from n going FORWARDS to n+1.
 */
export function useHistory<T extends object>(
  initial: T,
  initialPast: Difference[][] = [],
  initialFuture: Difference[][] = []
): HistoryState<T> {
  const [past, setPast] = useState<Difference[][]>(initialPast)
  const [present, setPresent] = useState<T>(initial)
  const [future, setFuture] = useState<Difference[][]>(initialFuture)

  const push = useCallback(
    (next: T) => {
      const patches = diff(present, next)
      if (patches.length === 0) return // Ignore exact duplicates

      setPast((p) => {
        const appended = [...p, patches]
        if (appended.length > MAX_HISTORY) return appended.slice(appended.length - MAX_HISTORY)
        return appended
      })
      setPresent(next)
      setFuture([]) // Push invalidates future
    },
    [present]
  )

  const undo = useCallback(() => {
    if (past.length === 0) return
    const inversePatches = invertDiff(past[past.length - 1])
    const nextPresent = applyDiff(present, inversePatches)

    setFuture((f) => [past[past.length - 1], ...f])
    setPresent(nextPresent)
    setPast((p) => p.slice(0, -1))
  }, [past, present])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const patches = future[0]
    const nextPresent = applyDiff(present, patches)

    setPast((p) => [...p, patches])
    setPresent(nextPresent)
    setFuture((f) => f.slice(1))
  }, [future, present])

  const reset = useCallback((next: T) => {
    setPast([])
    setPresent(next)
    setFuture([])
  }, [])

  const getReachableStates = useCallback(() => {
    const states: T[] = [present]

    // Reconstruct backwards to past
    let walkBack = present
    for (let i = past.length - 1; i >= 0; i--) {
      walkBack = applyDiff(walkBack, invertDiff(past[i]))
      states.push(walkBack)
    }

    // Reconstruct forwards via future
    let walkFwd = present
    for (let i = 0; i < future.length; i++) {
      walkFwd = applyDiff(walkFwd, future[i])
      states.push(walkFwd)
    }

    return states
  }, [present, past, future])

  return {
    present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    push,
    undo,
    redo,
    reset,
    past,
    future,
    getReachableStates
  }
}
