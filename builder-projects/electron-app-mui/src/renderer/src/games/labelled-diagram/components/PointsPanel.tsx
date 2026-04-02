import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { LabelledDiagramPoint } from '../../../types'
import { PointListItem } from './PointListItem'

export interface PointsPanelProps {
  points: LabelledDiagramPoint[]
  focusedPointId: string | null
  visiblePointIds: Set<string>
  onUpdatePoint: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDeletePoint: (id: string) => void
  onFollowPoint: (id: string) => void
  onFocusPoint: (id: string) => void
  onAddPoint: () => void
}

/**
 * PointsPanel - Collapsible left panel for managing points.
 */
export function PointsPanel({
  points,
  focusedPointId,
  visiblePointIds,
  onUpdatePoint,
  onDeletePoint,
  onFollowPoint,
  onFocusPoint,
  onAddPoint
}: PointsPanelProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [expandedPositionEditorId, setExpandedPositionEditorId] = React.useState<string | null>(null)

  const panelWidth = 320
  const collapsedWidth = 48

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? collapsedWidth : panelWidth }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
        height: '100%',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        background: '#13161f',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Header with collapse toggle */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          minHeight: 56
        }}
      >
        {!isCollapsed && (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 2, fontSize: '0.65rem', fontWeight: 600 }}
          >
            POINTS ({points.length})
          </Typography>
        )}
        <Box
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            ml: 'auto',
            '&:hover': { background: 'rgba(255,255,255,0.12)' },
            transition: 'transform 0.2s',
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 4L6 8L10 12"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      </Box>

      {/* Points list */}
      {!isCollapsed && (
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          {points.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1 }}>
                No points yet
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                Click on the image or press Ctrl+N to add a point
              </Typography>
            </Box>
          ) : (
            points.map((point, index) => (
              <PointListItem
                key={point.id}
                point={point}
                index={index}
                isFocused={focusedPointId === point.id}
                isVisibleOnScreen={visiblePointIds.has(point.id)}
                isPositionEditorExpanded={expandedPositionEditorId === point.id}
                onUpdate={onUpdatePoint}
                onDelete={onDeletePoint}
                onFollow={() => onFollowPoint(point.id)}
                onFocus={() => onFocusPoint(point.id)}
                onTogglePositionEditor={() => setExpandedPositionEditorId(expandedPositionEditorId === point.id ? null : point.id)}
              />
            ))
          )}
        </Box>
      )}

      {/* Add point button (only when expanded) */}
      {!isCollapsed && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Box
            onClick={onAddPoint}
            sx={{
              width: '100%',
              py: 1.5,
              borderRadius: 2,
              background: 'rgba(110,231,183,0.15)',
              color: '#6ee7b7',
              border: '1px solid rgba(110,231,183,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': { background: 'rgba(110,231,183,0.2)' },
              transition: 'all 0.15s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Point
          </Box>
        </Box>
      )}
    </motion.div>
  )
}
