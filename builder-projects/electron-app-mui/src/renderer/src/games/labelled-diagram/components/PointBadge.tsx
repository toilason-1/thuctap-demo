import { Box, Typography } from '@mui/material'
import React, { useRef, useState } from 'react'
import { LabelledDiagramPoint } from '../../../types'

export interface PointBadgeProps {
  point: LabelledDiagramPoint
  imageRef: React.RefObject<HTMLImageElement>
  isFocused: boolean
  isHovered: boolean
  isProximity?: boolean
  onClick: () => void
  onHoverChange: (pointId: string | null) => void
  onPositionChange: (id: string, xPercent: number, yPercent: number) => void
}

/**
 * PointBadge - Displays a numbered badge on the image at the point's position.
 * Badge does NOT scale with zoom (uses counter-transform).
 */
export function PointBadge({
  point,
  imageRef,
  isFocused,
  isHovered,
  isProximity: _isProximity,
  onClick,
  onHoverChange,
  onPositionChange
}: PointBadgeProps): React.ReactElement | null {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  if (!point.visible) return null

  // Calculate badge position
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${point.xPercent}%`,
    top: `${point.yPercent}%`,
    transform: 'translate(-50%, -50%)',
    zIndex: isFocused ? 1000 : isHovered ? 100 : 10
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFocused) {
      setIsDragging(true)
      dragStartPos.current = { x: e.clientX, y: e.clientY }
    }
  }

  // Handle mouse move for dragging
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartPos.current || !imageRef.current) return

      const imgRect = imageRef.current.getBoundingClientRect()

      // Calculate new position relative to image
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      // Convert delta to percentage
      const deltaXPercent = (deltaX / imgRect.width) * 100
      const deltaYPercent = (deltaY / imgRect.height) * 100

      const newXPercent = Math.max(0, Math.min(100, point.xPercent + deltaXPercent))
      const newYPercent = Math.max(0, Math.min(100, point.yPercent + deltaYPercent))

      onPositionChange(point.id, newXPercent, newYPercent)
      dragStartPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartPos.current = null
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, point.id, point.xPercent, point.yPercent, imageRef, onPositionChange])

  // Badge size - not scaled with zoom
  const badgeSize = isFocused ? 40 : isHovered ? 36 : 32

  return (
    <Box
      ref={badgeRef}
      className="point-badge"
      onClick={onClick}
      onMouseEnter={() => onHoverChange(point.id)}
      onMouseLeave={() => onHoverChange(null)}
      onMouseDown={handleMouseDown}
      sx={{
        ...style,
        width: badgeSize,
        height: badgeSize,
        borderRadius: '50%',
        background: point.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isFocused ? 'grab' : 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        boxShadow: isFocused
          ? `0 0 0 4px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.4)`
          : isHovered
            ? `0 0 0 2px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3)`
            : `0 2px 6px rgba(0,0,0,0.3)`,
        '&:active': {
          cursor: 'grabbing'
        }
      }}
    >
      <Typography
        sx={{
          color: 'white',
          fontSize: isFocused ? '0.85rem' : '0.75rem',
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}
      >
        {point.text ? point.text.charAt(0).toUpperCase() : '?'}
      </Typography>

      {/* Focused state indicator ring */}
      {isFocused && (
        <Box
          sx={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      )}
    </Box>
  )
}
