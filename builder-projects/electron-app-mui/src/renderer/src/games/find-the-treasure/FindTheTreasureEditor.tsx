import { Box, Typography } from '@mui/material'
import type { FindTheTreasureAppData } from '@shared/types'
import React, { useState } from 'react'
import type { Tab } from './components'
import { StageSidebar, StagesTab } from './components'
import { useFindTheTreasureCrud } from './hooks/useFindTheTreasureCrud'

import { LegacyEditorProps } from '../legacyEditorProps'

export default function FindTheTreasureEditor({
  appData,
  projectDir,
  onChange
}: LegacyEditorProps<FindTheTreasureAppData>): React.ReactElement {
  const [tab, setTab] = useState<Tab>('stages')
  const {
    stages,
    activeStageId,
    setActiveStageId,
    addStage,
    addStageFromDrop,
    updateStage,
    deleteStage,
    addAnswer,
    updateAnswer,
    deleteAnswer
  } = useFindTheTreasureCrud(appData, projectDir, onChange)

  // ── Stage selection ─────────────────────────────────────────────────────
  const handleStageSelect = (stageId: string): void => {
    setActiveStageId(stageId)
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <StageSidebar
        tab={tab}
        onTabChange={setTab}
        stages={stages}
        activeStageId={activeStageId}
        onStageSelect={handleStageSelect}
        onStageDelete={deleteStage}
      />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {tab === 'stages' && (
          <StagesTab
            stages={stages}
            selectedStageId={activeStageId}
            onAddStage={addStage}
            onAddStageFromDrop={addStageFromDrop}
            onUpdateStage={updateStage}
            onDeleteStage={deleteStage}
            onAddAnswer={addAnswer}
            onUpdateAnswer={updateAnswer}
            onDeleteAnswer={deleteAnswer}
            onSelectStage={handleStageSelect}
          />
        )}
        {tab === 'settings' && (
          <Box>
            <Typography variant="h6" sx={{ color: 'common.white', mb: 2 }}>
              Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No settings available for this game yet.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
