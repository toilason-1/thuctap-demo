import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { Box, IconButton, InputBase, Tooltip } from '@mui/material'
import React, { useCallback, useEffect, useRef } from 'react'
import { LabelledDiagramPoint } from '../../../types'

export interface FocusedPointEditorProps {
  point: LabelledDiagramPoint
  imageRef: React.RefObject<HTMLImageElement>
  onUpdate: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDelete: (id: string) => void
  onFocusInPanel: () => void
  onBlur: () => void
}

/**
 * FocusedPointEditor - Inline editor that appears when a point is focused.
 * Allows quick text editing and dragging to reposition.
 */
export function FocusedPointEditor({
  point,
  imageRef,
  onUpdate,
  onDelete,
  onFocusInPanel,
  onBlur
}: FocusedPointEditorProps): React.ReactElement {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartPos = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)

  // Focus the input when mounted
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  // Handle click outside to blur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        onBlur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onBlur])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBlur()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onBlur])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(point.id, { text: e.target.value })
    },
    [point.id, onUpdate]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(point.id)
      onBlur()
    },
    [point.id, onDelete, onBlur]
  )

  const handleFocusInPanel = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onFocusInPanel()
    },
    [onFocusInPanel]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!imageRef.current) return

      const imgRect = imageRef.current.getBoundingClientRect()
      const currentX = imgRect.left + (point.xPercent / 100) * imgRect.width
      const currentY = imgRect.top + (point.yPercent / 100) * imgRect.height

      setIsDragging(true)
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        startX: currentX,
        startY: currentY
      }
    },
    [imageRef, point.xPercent, point.yPercent]
  )

  // Handle drag move
  React.useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartPos.current || !imageRef.current) return

      const imgRect = imageRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      const newX = dragStartPos.current.startX + deltaX
      const newY = dragStartPos.current.startY + deltaY

      // Convert to percentage
      const newXPercent = Math.max(0, Math.min(100, (newX / imgRect.width) * 100))
      const newYPercent = Math.max(0, Math.min(100, (newY / imgRect.height) * 100))

      onUpdate(point.id, { xPercent: newXPercent, yPercent: newYPercent })
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      dragStartPos.current = null
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging, point.id, onUpdate, imageRef])

  if (!imageRef.current) return <></>

  const imgRect = imageRef.current.getBoundingClientRect()
  const pointX = imgRect.left + (point.xPercent / 100) * imgRect.width
  const pointY = imgRect.top + (point.yPercent / 100) * imgRect.height

  return (
    <Box
      ref={editorRef}
      className="point-control focused-point-editor"
      sx={{
        position: 'absolute',
        left: pointX - imgRect.left,
        top: pointY - imgRect.top,
        transform: 'translate(-50%, -50%)',
        zIndex: 2000,
        pointerEvents: 'auto'
      }}
    >
      {/* Editor panel */}
      <Box
        sx={{
          background: 'rgba(20,25,35,0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          border: `2px solid ${point.color}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 4px ${point.color}33`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1.5,
          minWidth: 200,
          animation: 'editorFadeIn 0.2s ease-out'
        }}
      >
        {/* Header with drag handle and actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5
          }}
        >
          <Box
            onMouseDown={handleDragStart}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: isDragging ? 'grabbing' : 'grab',
              color: 'text.secondary',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 14 }} />
            Drag to move
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Scroll to entry in panel">
              <IconButton
                size="small"
                onClick={handleFocusInPanel}
                sx={{
                  width: 24,
                  height: 24,
                  color: 'text.secondary',
                  '&:hover': { background: 'rgba(255,255,255,0.1)' }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2V14M2 8L8 14L14 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete point">
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{
                  width: 24,
                  height: 24,
                  color: 'error.main',
                  '&:hover': { background: 'rgba(244,63,94,0.2)' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={onBlur}
                sx={{
                  width: 24,
                  height: 24,
                  color: 'text.secondary',
                  '&:hover': { background: 'rgba(255,255,255,0.1)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Text input */}
        <InputBase
          inputRef={inputRef}
          value={point.text}
          onChange={handleTextChange}
          placeholder="Enter label..."
          sx={{
            width: '100%',
            fontSize: '0.9rem',
            fontWeight: 500,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 1,
            padding: '8px 10px',
            color: 'white',
            '& input': {
              padding: 0
            },
            '&::placeholder': {
              color: 'text.disabled',
              opacity: 1
            }
          }}
        />

        {/* Position info */}
        <Box
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <span>X: {point.xPercent.toFixed(1)}%</span>
          <span>Y: {point.yPercent.toFixed(1)}%</span>
        </Box>
      </Box>

      {/* Connector line to point */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          width: 2,
          height: 20,
          background: point.color,
          transform: 'translateX(-50%)',
          opacity: 0.5
        }}
      />
    </Box>
  )
}
