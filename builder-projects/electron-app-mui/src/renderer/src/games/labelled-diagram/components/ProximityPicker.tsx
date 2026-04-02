import { Box, Typography } from '@mui/material'
import React from 'react'
import { LabelledDiagramPoint } from '../../../types'

export interface ProximityPickerProps {
  nearbyPoints: LabelledDiagramPoint[]
  cursorPosition: { x: number; y: number }
  imageRef: React.RefObject<HTMLImageElement>
  onPointClick: (pointId: string) => void
}

/**
 * ProximityPicker - Displays a grid of badges for nearby points when they're too close together.
 */
export function ProximityPicker({
  nearbyPoints,
  cursorPosition,
  imageRef,
  onPointClick
}: ProximityPickerProps): React.ReactElement | null {
  if (!imageRef.current) return null
  if (nearbyPoints.length < 2) return null

  const imgRect = imageRef.current.getBoundingClientRect()

  return (
    <Box
      sx={{
        position: 'absolute',
        left: cursorPosition.x - imgRect.left,
        top: cursorPosition.y - imgRect.top + 15,
        transform: 'translateX(-50%)',
        zIndex: 1500,
        pointerEvents: 'auto'
      }}
    >
      <Box
        sx={{
          background: 'rgba(20,25,35,0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center'
          }}
        >
          {nearbyPoints.length} points here
        </Typography>

        {/* Grid of point badges */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 0.75
          }}
        >
          {nearbyPoints.slice(0, 6).map((point) => (
            <Box
              key={point.id}
              onClick={() => onPointClick(point.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                p: 0.75,
                borderRadius: 1.5,
                background: 'rgba(255,255,255,0.05)',
                border: `2px solid ${point.color}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              {/* Badge */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: point.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Box
                  sx={{
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {nearbyPoints.indexOf(point) + 1}
                </Box>
              </Box>

              {/* Label preview */}
              <Box
                sx={{
                  fontSize: '0.7rem',
                  color: point.text ? 'text.primary' : 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 80
                }}
              >
                {point.text || '(no label)'}
              </Box>
            </Box>
          ))}
        </Box>

        {/* More indicator if there are more points */}
        {nearbyPoints.length > 6 && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              color: 'text.secondary',
              textAlign: 'center',
              mt: 0.5
            }}
          >
            +{nearbyPoints.length - 6} more in panel
          </Typography>
        )}
      </Box>
    </Box>
  )
}
