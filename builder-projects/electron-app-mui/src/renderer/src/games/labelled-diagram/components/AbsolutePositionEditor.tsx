import { Box, InputBase } from '@mui/material'
import React, { useCallback, useState } from 'react'
import { LabelledDiagramPoint } from '../../../types'

export interface AbsolutePositionEditorProps {
  point: LabelledDiagramPoint
  onUpdate: (id: string, patch: Partial<LabelledDiagramPoint>) => void
}

/**
 * AbsolutePositionEditor - Allows precise position editing with linked percentage/pixel values.
 */
export function AbsolutePositionEditor({
  point,
  onUpdate
}: AbsolutePositionEditorProps): React.ReactElement {
  // We need image dimensions to convert between percentage and pixels
  // These will be provided by the parent component via props or context
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Get image dimensions from the image element
  React.useEffect(() => {
    const img = document.querySelector('.image-canvas img') as HTMLImageElement
    if (img && img.complete) {
      setImageDimensions({
        width: img.offsetWidth,
        height: img.offsetHeight
      })
    }
  }, [])

  // Calculate pixel positions
  const pixelX = imageDimensions ? Math.round((point.xPercent / 100) * imageDimensions.width) : 0
  const pixelY = imageDimensions ? Math.round((point.yPercent / 100) * imageDimensions.height) : 0

  // Handle percentage input change
  const handlePercentXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        onUpdate(point.id, { xPercent: value })
      }
    },
    [point.id, onUpdate]
  )

  const handlePercentYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        onUpdate(point.id, { yPercent: value })
      }
    },
    [point.id, onUpdate]
  )

  // Handle pixel input change (converts to percentage)
  const handlePixelXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!imageDimensions) return
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && value >= 0 && value <= imageDimensions.width) {
        const newPercent = (value / imageDimensions.width) * 100
        onUpdate(point.id, { xPercent: newPercent })
      }
    },
    [point.id, onUpdate, imageDimensions]
  )

  const handlePixelYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!imageDimensions) return
      const value = parseFloat(e.target.value)
      if (!isNaN(value) && value >= 0 && value <= imageDimensions.height) {
        const newPercent = (value / imageDimensions.height) * 100
        onUpdate(point.id, { yPercent: newPercent })
      }
    },
    [point.id, onUpdate, imageDimensions]
  )

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      {/* X Position */}
      <Box>
        <Box sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
          Horizontal Position
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <InputBase
              value={point.xPercent.toFixed(2)}
              onChange={handlePercentXChange}
              type="number"
              sx={{
                width: '100%',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                padding: '4px 8px',
                '& input': { padding: 0 },
                '&::after': {
                  content: '"%"',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }
              }}
            />
          </Box>
          <Box sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>→</Box>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <InputBase
              value={pixelX}
              onChange={handlePixelXChange}
              type="number"
              disabled={!imageDimensions}
              sx={{
                width: '100%',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                padding: '4px 8px',
                '& input': { padding: 0 },
                '&::after': {
                  content: '"px"',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Y Position */}
      <Box>
        <Box sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
          Vertical Position
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <InputBase
              value={point.yPercent.toFixed(2)}
              onChange={handlePercentYChange}
              type="number"
              sx={{
                width: '100%',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                padding: '4px 8px',
                '& input': { padding: 0 },
                '&::after': {
                  content: '"%"',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }
              }}
            />
          </Box>
          <Box sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>→</Box>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <InputBase
              value={pixelY}
              onChange={handlePixelYChange}
              type="number"
              disabled={!imageDimensions}
              sx={{
                width: '100%',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                padding: '4px 8px',
                '& input': { padding: 0 },
                '&::after': {
                  content: '"px"',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {!imageDimensions && (
        <Box sx={{ fontSize: '0.65rem', color: 'text.disabled', textAlign: 'center' }}>
          Image dimensions not available
        </Box>
      )}
    </Box>
  )
}
