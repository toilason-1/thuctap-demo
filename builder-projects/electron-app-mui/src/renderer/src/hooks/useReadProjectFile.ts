import { useSuspenseQuery } from '@tanstack/react-query'
import type { ProjectFile } from '@shared/types'

// Reads a project file by its path using the readProjectFile IPC alias (Suspense-enabled via React Query)
// Returns the raw ProjectFile object (including appData) once loaded.
export function useReadProjectFile(filePath: string | null): ProjectFile {
  // We rely on the IPC alias exposed in the preload (readProjectFile)
  const query = useSuspenseQuery({
    queryKey: ['project-file', filePath],
    queryFn: async () => {
      if (!filePath) throw new Error('No filePath provided for project read')
      const res = await window.electronAPI.readProjectFile(filePath)
      // The IPC should return an object { filePath, data } or null
      // Normalize to the inner data shape if necessary
      const data = res?.data ?? res
      return data as ProjectFile
    }
  })

  return query.data as ProjectFile
}
