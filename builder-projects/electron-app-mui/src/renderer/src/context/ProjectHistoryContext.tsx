import { createContext } from 'react'
import type { HistoryStore } from './ProjectHistoryStore'

// ── Context ───────────────────────────────────────────────────────────────────

export const ProjectHistoryContext = createContext<HistoryStore | null>(null)
