import { Box } from '@mui/material'
import React from 'react'
import { JumpingFrogAppData } from '../../types'
import { QuestionsTab, SummarySidebar } from './components'
import { useJumpingFrogCrud } from './hooks/useJumpingFrogCrud'

import { LegacyEditorProps } from '../legacyEditorProps'

/**
 * Jumping Frog Editor
 * Teachers create questions where students select the correct answer by jumping on frogs.
 */
export default function JumpingFrogEditor({
  appData,
  projectDir: _projectDir,
  onChange
}: LegacyEditorProps<JumpingFrogAppData>): React.ReactElement {
  // Extract CRUD logic to hook
  const {
    questions,
    addQuestion,
    addQuestionFromDrop,
    updateQuestion,
    deleteQuestion,
    updateAnswer
  } = useJumpingFrogCrud(appData, _projectDir, onChange)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar questions={questions} />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <QuestionsTab
          questions={questions}
          projectDir={_projectDir}
          onAddQuestion={addQuestion}
          onAddQuestionFromDrop={addQuestionFromDrop}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onUpdateAnswer={updateAnswer}
        />
      </Box>
    </Box>
  )
}
