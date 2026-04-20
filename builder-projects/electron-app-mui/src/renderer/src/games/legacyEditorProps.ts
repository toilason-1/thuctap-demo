import { AnyAppData } from '@shared'

// Generic base for legacy editors.
// T defaults to AnyAppData for backward compatibility at generic usage sites.
export type LegacyEditorProps<T extends AnyAppData = AnyAppData> = {
  appData: T
  projectDir: string
  onChange: (data: T) => void
}
