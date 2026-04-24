import type { ProjectFile } from '@shared/types'
import {
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryResult
} from '@tanstack/react-query'

export const PROJECT_FILE_QUERY_KEY = (filePath: string) => ['project-file', filePath] as const

async function fetchProjectFile(filePath: string): Promise<ProjectFile> {
  const result = await window.electronAPI.openProjectFile(filePath)
  if (!result) throw new Error(`Failed to open project file: ${filePath}`)
  return result.data
}

export function useProjectFile(filePath: string): UseSuspenseQueryResult<ProjectFile, Error> {
  return useSuspenseQuery({
    queryKey: PROJECT_FILE_QUERY_KEY(filePath),
    queryFn: () => fetchProjectFile(filePath)
  })
}

export function useInvalidateProjectFile() {
  const queryClient = useQueryClient()
  return (filePath: string) => {
    queryClient.invalidateQueries({ queryKey: PROJECT_FILE_QUERY_KEY(filePath) })
  }
}
