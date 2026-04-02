import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Box, IconButton, InputBase, Tooltip } from '@mui/material'
import { motion } from 'framer-motion'
import React, { useCallback, useEffect, useRef } from 'react'
import { LabelledDiagramPoint } from '../../../types'
import { AbsolutePositionEditor } from './AbsolutePositionEditor'

export interface PointListItemProps {
  point: LabelledDiagramPoint
  index: number
  isFocused: boolean
  isVisibleOnScreen: boolean
  isPositionEditorExpanded: boolean
  onUpdate: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDelete: (id: string) => void
  onFollow: (pointId: string) => void
  onFocus: () => void
  onTogglePositionEditor: () => void
}

/**
 * PointListItem - Individual point entry in the PointsPanel.
 */
export function PointListItem({
  point,
  index,
  isFocused,
  isVisibleOnScreen,
  isPositionEditorExpanded,
  onUpdate,
  onDelete,
  onFollow,
  onFocus,
  onTogglePositionEditor
}: PointListItemProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  // Flash effect when focused
  const [isFlashing, setIsFlashing] = React.useState(false)

  useEffect(() => {
    if (isFocused) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 300)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isFocused])

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isFocused])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(point.id, { text: e.target.value })
    },
    [point.id, onUpdate]
  )

  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onUpdate(point.id, { visible: !point.visible })
    },
    [point.id, point.visible, onUpdate]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(point.id)
    },
    [point.id, onDelete]
  )

  // Background color based on state
  const getBackgroundColor = () => {
    if (isFlashing) {
      // Flash effect - bright highlight
      return 'rgba(110,231,183,0.2)'
    }
    if (isFocused) {
      // Focused state
      return 'rgba(110,231,183,0.15)'
    }
    if (isVisibleOnScreen) {
      // Visible on screen - lighter background
      return 'rgba(255,255,255,0.08)'
    }
    // Default
    return 'rgba(255,255,255,0.04)'
  }

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
    >
      <Box
        onClick={onFocus}
        sx={{
          p: 2,
          borderRadius: 2,
          background: getBackgroundColor(),
          border: isFocused ? '1px solid rgba(110,231,183,0.4)' : '1px solid transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': {
            background: isFocused ? getBackgroundColor() : 'rgba(255,255,255,0.06)'
          }
        }}
      >
        {/* Order Badge */}
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: point.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <Box
            sx={{
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {index + 1}
          </Box>
        </Box>

        {/* Text Input */}
        <InputBase
          inputRef={inputRef}
          value={point.text}
          onChange={handleTextChange}
          onClick={(e) => e.stopPropagation()}
          placeholder="Point label..."
          sx={{
            flex: 1,
            fontSize: '0.85rem',
            color: point.text ? 'text.primary' : 'text.secondary',
            '& input': {
              padding: '6px 8px',
              borderRadius: 1,
              background: 'rgba(0,0,0,0.2)',
              '&::placeholder': {
                color: 'text.disabled',
                opacity: 1
              }
            }
          }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {/* Visibility Toggle */}
          <Tooltip title={point.visible ? 'Hide point' : 'Show point'}>
            <IconButton
              size="small"
              onClick={handleToggleVisibility}
              sx={{
                width: 28,
                height: 28,
                color: point.visible ? 'text.secondary' : 'text.disabled',
                '&:hover': { background: 'rgba(255,255,255,0.08)' }
              }}
            >
              {point.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Follow Button */}
          <Tooltip title="Focus on point">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onFollow(point.id)
              }}
              sx={{
                width: 28,
                height: 28,
                color: 'text.secondary',
                '&:hover': { background: 'rgba(255,255,255,0.08)' }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
              </svg>
            </IconButton>
          </Tooltip>

          {/* Absolute Position Toggle */}
          <Tooltip title="Edit position">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePositionEditor()
              }}
              sx={{
                width: 28,
                height: 28,
                color: isPositionEditorExpanded ? 'primary.main' : 'text.secondary',
                '&:hover': { background: 'rgba(255,255,255,0.08)' }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3H5M3 8H5M3 13H5M8 3H13M8 8H13M8 13H13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
          </Tooltip>

          {/* Delete Button */}
          <Tooltip title="Delete point">
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                width: 28,
                height: 28,
                color: 'error.main',
                opacity: 0.7,
                '&:hover': { opacity: 1, background: 'rgba(244,63,94,0.15)' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Absolute Position Editor (expandable) */}
      {isPositionEditorExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Box sx={{ mt: 1, pl: 2 }}>
            <AbsolutePositionEditor
              point={point}
              onUpdate={onUpdate}
            />
          </Box>
        </motion.div>
      )}
    </motion.div>
  )
}
