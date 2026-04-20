import { Box } from '@mui/material'
import { BalloonLetterPickerAppData } from '@shared/types'
import { JSX } from 'react'
import { SummarySidebar, WordsTab } from './components'
import { useBalloonCrud } from './hooks/useBalloonCrud'

import { LegacyEditorProps } from '../legacyEditorProps'

/**
 * Balloon Letter Picker Editor
 * Teachers create words where students pop balloons to spell words from hints.
 */
export default function BalloonLetterPickerEditor({
  appData,
  projectDir,
  onChange
}: LegacyEditorProps<BalloonLetterPickerAppData>): JSX.Element {
  // Extract CRUD logic to hook
  const { words, addWord, addWordFromDrop, updateWord, deleteWord } = useBalloonCrud(
    appData,
    projectDir,
    onChange
  )

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar words={words} />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <WordsTab
          words={words}
          projectDir={projectDir}
          onAddWord={addWord}
          onAddWordFromDrop={addWordFromDrop}
          onUpdateWord={updateWord}
          onDeleteWord={deleteWord}
        />
      </Box>
    </Box>
  )
}
