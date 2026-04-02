import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { LabelledDiagramPoint } from '../../../types'

export interface ProximityControlProps {
  points: LabelledDiagramPoint[]
  cursorPosition: { x: number; y: number } | null
  imageRef: React.RefObject<HTMLImageElement>
  hoveredPointId?: string | null
  onHoveredPointChange: (pointId: string | null) => void
  onClick: (pointId: string) => void
  onNearbyPointsChange?: (points: LabelledDiagramPoint[], isTooClose: boolean) => void
  proximityThreshold?: number
  tooCloseThreshold?: number
}

/**
 * ProximityControl - Handles hover detection and displays animated circle around nearby points.
 */
export function ProximityControl({
  points,
  cursorPosition,
  imageRef,
  onHoveredPointChange,
  onClick,
  onNearbyPointsChange,
  proximityThreshold = 50,
  tooCloseThreshold = 15
}: ProximityControlProps): React.ReactElement | null {
  const [nearbyPoints, setNearbyPoints] = useState<LabelledDiagramPoint[]>([])
  const [isTooClose, setIsTooClose] = useState(false)

  // Calculate distances and find nearby points
  useEffect(() => {
    if (!cursorPosition || !imageRef.current) {
      setNearbyPoints([])
      setIsTooClose(false)
      onHoveredPointChange(null)
      return
    }

    const imgRect = imageRef.current.getBoundingClientRect()

    // Check if cursor is within image bounds
    if (
      cursorPosition.x < imgRect.left ||
      cursorPosition.x > imgRect.right ||
      cursorPosition.y < imgRect.top ||
      cursorPosition.y > imgRect.bottom
    ) {
      setNearbyPoints([])
      setIsTooClose(false)
      onHoveredPointChange(null)
      return
    }

    // Calculate distance from cursor to each visible point
    const distances = points
      .filter((p) => p.visible)
      .map((point) => {
        const pointX = imgRect.left + (point.xPercent / 100) * imgRect.width
        const pointY = imgRect.top + (point.yPercent / 100) * imgRect.height

        const distance = Math.sqrt(
          Math.pow(cursorPosition.x - pointX, 2) + Math.pow(cursorPosition.y - pointY, 2)
        )

        return { point, distance }
      })

    // Find points within proximity threshold
    const nearby = distances
      .filter((d) => d.distance <= proximityThreshold)
      .sort((a, b) => a.distance - b.distance)
      .map((d) => d.point)

    setNearbyPoints(nearby)

    // Check if points are too close together
    let tooClose = false
    if (nearby.length >= 2) {
      const distBetweenPoints = Math.sqrt(
        Math.pow(nearby[0].xPercent - nearby[1].xPercent, 2) +
          Math.pow(nearby[0].yPercent - nearby[1].yPercent, 2)
      )
      tooClose = distBetweenPoints < tooCloseThreshold
      setIsTooClose(tooClose)
    } else {
      setIsTooClose(false)
    }

    // Set hovered point (closest one)
    if (nearby.length > 0 && !tooClose) {
      onHoveredPointChange(nearby[0].id)
    } else {
      onHoveredPointChange(null)
    }

    // Notify parent of nearby points
    onNearbyPointsChange?.(nearby, tooClose)
  }, [
    cursorPosition,
    imageRef,
    points,
    proximityThreshold,
    tooCloseThreshold,
    onHoveredPointChange,
    onNearbyPointsChange
  ])

  if (nearbyPoints.length === 0) return null

  if (!imageRef.current) return null

  const imgRect = imageRef.current.getBoundingClientRect()

  // If too close, don't show individual controls - show hint instead
  if (isTooClose) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: cursorPosition!.x - imgRect.left,
          top: cursorPosition!.y - imgRect.top + 10,
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <Box
          sx={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          Multiple points here - select from panel
        </Box>
      </Box>
    )
  }

  // Show animated circle for the closest point
  const closestPoint = nearbyPoints[0]
  const pointX = imgRect.left + (closestPoint.xPercent / 100) * imgRect.width
  const pointY = imgRect.top + (closestPoint.yPercent / 100) * imgRect.height

  return (
    <Box
      sx={{
        position: 'absolute',
        left: pointX - imgRect.left,
        top: pointY - imgRect.top,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      {/* Animated outline circle */}
      <Box
        onClick={(e) => {
          e.stopPropagation()
          onClick(closestPoint.id)
        }}
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `3px solid ${closestPoint.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(0,0,0,0.3)',
          animation: 'proximityPulse 1.5s ease-in-out infinite',
          '&:hover': {
            background: 'rgba(0,0,0,0.5)',
            transform: 'translate(-50%, -50%) scale(1.1)'
          },
          '@keyframes proximityPulse': {
            '0%, 100%': {
              borderColor: closestPoint.color,
              boxShadow: `0 0 0 0 rgba(${hexToRgb(closestPoint.color)}, 0.4)`
            },
            '50%': {
              borderColor: 'white',
              boxShadow: `0 0 0 10px rgba(${hexToRgb(closestPoint.color)}, 0)`
            }
          }
        }}
      >
        {/* Click indicator */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'white'
          }}
        />
      </Box>
    </Box>
  )
}

// Helper to convert HSL to RGB for CSS animations
function hexToRgb(color: string): string {
  // If it's already in rgb format, extract values
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) return `${match[1]}, ${match[2]}, ${match[3]}`
  }

  // Handle HSL format
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/)
    if (match) {
      const h = parseFloat(match[1]) / 360
      const s = parseFloat(match[2]) / 100
      const l = parseFloat(match[3]) / 100

      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      const r = hue2rgb(p, q, h + 1 / 3)
      const g = hue2rgb(p, q, h)
      const b = hue2rgb(p, q, h - 1 / 3)

      return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`
    }
  }

  return '255, 255, 255'
}
