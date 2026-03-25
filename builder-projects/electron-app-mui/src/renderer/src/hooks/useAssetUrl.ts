import { useQuery, UseQueryResult } from '@tanstack/react-query'

/**
 * Resolves a project-relative asset path (e.g. "assets/cat.png") to a
 * displayable file:// URL so <img> tags work in the Electron renderer.
 */
export function useAssetUrl(
  projectDir: string,
  relativePath: string | null
): UseQueryResult<string> {
  return useQuery({
    queryKey: ['project-assets', projectDir, relativePath],
    queryFn: () => window.electronAPI.resolveAssetUrl(projectDir, relativePath!),
    enabled: !!relativePath, // Don't run if path is null
    staleTime: Infinity // Effectively replaces your manual Map cache
  })
}
