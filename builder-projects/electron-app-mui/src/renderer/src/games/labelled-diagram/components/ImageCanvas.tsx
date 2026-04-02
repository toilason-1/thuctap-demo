import { Box } from '@mui/material'
import React, { useCallback, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import ImagePicker from '../../../components/ImagePicker'
import { useAssetUrl } from '../../../hooks/useAssetUrl'
import { LabelledDiagramPoint } from '../../../types'
import { FocusedPointEditor, PointBadge, ProximityControl, ProximityPicker } from './'

export interface ImageCanvasProps {
  projectDir: string
  image: string | null
  points: LabelledDiagramPoint[]
  onImageChange: (imagePath: string | null) => void
  onPointPositionChange: (id: string, xPercent: number, yPercent: number) => void
  onPointDelete?: (id: string) => void
  onPointClick: (point: LabelledDiagramPoint) => void
  onPointBlur?: () => void
  onPanelScrollToPoint?: (pointId: string) => void
  focusedPointId: string | null
  hoveredPointId: string | null
  onHoveredPointChange: (pointId: string | null) => void
  proximityPointIds?: string[] | null
  onTransformChange?: (state: { scale: number; positionX: number; positionY: number }) => void
  onImageDimensionsChange?: (dimensions: { width: number; height: number }) => void
}

/**
 * ImageCanvas - Main canvas component with zoom/pan functionality.
 * Displays the diagram image with interactive points.
 */
export function ImageCanvas({
  projectDir,
  image,
  points,
  onImageChange,
  onPointPositionChange,
  onPointDelete,
  onPointClick,
  onPointBlur,
  onPanelScrollToPoint,
  focusedPointId,
  hoveredPointId,
  onHoveredPointChange,
  proximityPointIds,
  onTransformChange,
  onImageDimensionsChange
}: ImageCanvasProps): React.ReactElement {
  const { data: imageUrl } = useAssetUrl(projectDir, image)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const transformRef = useRef<{ setTransform: (s: number, x: number, y: number) => void } | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nearbyPoints, setNearbyPoints] = useState<LabelledDiagramPoint[]>([])
  const [isTooClose, setIsTooClose] = useState(false)

  // Handle mouse move for proximity detection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null)
  }, [])

  // Convert screen coordinates to percentage position on image
  const getPercentagePosition = useCallback(
    (clientX: number, clientY: number): { xPercent: number; yPercent: number } | null => {
      if (!imageDimensions || !imageRef.current) return null

      const imgRect = imageRef.current.getBoundingClientRect()

      // Check if cursor is within image bounds
      if (
        clientX < imgRect.left ||
        clientX > imgRect.right ||
        clientY < imgRect.top ||
        clientY > imgRect.bottom
      ) {
        return null
      }

      // Calculate position relative to image
      const xPercent = ((clientX - imgRect.left) / imgRect.width) * 100
      const yPercent = ((clientY - imgRect.top) / imgRect.height) * 100

      return { xPercent, yPercent }
    },
    [imageDimensions]
  )

  // Handle clicking on empty space to add a point
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks on the container background, not on points or controls
      if ((e.target as HTMLElement).closest('.point-badge, .point-control, .transform-controls')) {
        return
      }

      const position = getPercentagePosition(e.clientX, e.clientY)

      if (position) {
        // Signal to add a new point at this position
        onPointPositionChange('new', position.xPercent, position.yPercent)
      }
    },
    [getPercentagePosition, onPointPositionChange]
  )

  if (!image) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 4
        }}
      >
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix="diagram"
          value={image}
          onChange={onImageChange}
          label="Click to select diagram image"
          size={120}
        />
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <Box sx={{ fontSize: '0.9rem', mb: 0.5 }}>Upload a diagram to begin</Box>
          <Box sx={{ fontSize: '0.75rem' }}>Then click anywhere on the image to add labelled points</Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0a0f',
        position: 'relative'
      }}
      onClick={handleCanvasClick}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        limitToBounds={false}
        centerOnInit={true}
        initialPositionY={0}
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: false }}
        onTransformed={(ref) => {
          if (onTransformChange) {
            onTransformChange({
              scale: ref.state.scale ?? 1,
              positionX: ref.state.positionX ?? 0,
              positionY: ref.state.positionY ?? 0
            })
          }
        }}
      >
        {({ setTransform }) => {
          // Store setTransform for external access
          transformRef.current = { setTransform }

          return (
            <React.Fragment>
              {/* Zoom/Pan Controls */}
              <Box className="transform-controls" sx={{ position: 'absolute', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 1 }}>
                <Box
                  sx={{
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: 2,
                    padding: '4px',
                    display: 'flex',
                    gap: '4px'
                  }}
                >
                  <Box
                    onClick={() => setTransform(1.2, 0, 0)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      '&:hover': { background: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    +
                  </Box>
                  <Box
                    onClick={() => setTransform(0.8, 0, 0)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      '&:hover': { background: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    −
                  </Box>
                  <Box
                    onClick={() => setTransform(1, 0, 0)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      '&:hover': { background: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    RST
                  </Box>
                </Box>
              </Box>

              <TransformComponent>
                <Box
                  sx={{
                    display: 'inline-block',
                    position: 'relative',
                    minWidth: '100%',
                    minHeight: '100%'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl || ''}
                    alt="Diagram"
                    onLoad={() => {
                      if (imageRef.current) {
                        const dims = {
                          width: imageRef.current.naturalWidth,
                          height: imageRef.current.naturalHeight
                        }
                        setImageDimensions(dims)
                        onImageDimensionsChange?.(dims)
                      }
                    }}
                    style={{
                      display: 'block',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Render all points */}
                  {points.map((point) => (
                    <PointBadge
                      key={point.id}
                      point={point}
                      imageRef={imageRef as React.RefObject<HTMLImageElement>}
                      isFocused={focusedPointId === point.id}
                      isHovered={hoveredPointId === point.id}
                      isProximity={proximityPointIds?.includes(point.id) ?? false}
                      onClick={() => onPointClick(point)}
                      onHoverChange={onHoveredPointChange}
                      onPositionChange={onPointPositionChange}
                    />
                  ))}
                </Box>
              </TransformComponent>
            </React.Fragment>
          )
        }}
      </TransformWrapper>

      {/* Proximity Control - Hover detection with animated circle */}
      <ProximityControl
        points={points}
        cursorPosition={cursorPosition}
        imageRef={imageRef as React.RefObject<HTMLImageElement>}
        hoveredPointId={hoveredPointId}
        onHoveredPointChange={onHoveredPointChange}
        onClick={(pointId) => {
          const point = points.find((p) => p.id === pointId)
          if (point) onPointClick(point)
        }}
        onNearbyPointsChange={(nearby, tooClose) => {
          setNearbyPoints(nearby)
          setIsTooClose(tooClose)
        }}
      />

      {/* Proximity Picker - Grid of nearby points when too close */}
      {isTooClose && nearbyPoints.length > 0 && cursorPosition && (
        <ProximityPicker
          nearbyPoints={nearbyPoints}
          cursorPosition={cursorPosition}
          imageRef={imageRef as React.RefObject<HTMLImageElement>}
          onPointClick={(pointId) => {
            const point = points.find((p) => p.id === pointId)
            if (point) onPointClick(point)
          }}
        />
      )}

      {/* Focused Point Editor - Inline editor for focused point */}
      {focusedPointId && (
        <FocusedPointEditor
          point={points.find((p) => p.id === focusedPointId)!}
          imageRef={imageRef as React.RefObject<HTMLImageElement>}
          onUpdate={(id, patch) => {
            if (patch.xPercent !== undefined || patch.yPercent !== undefined) {
              onPointPositionChange(id, patch.xPercent ?? 0, patch.yPercent ?? 0)
            }
          }}
          onDelete={(id) => {
            onPointDelete?.(id)
          }}
          onFocusInPanel={() => {
            onPanelScrollToPoint?.(focusedPointId)
          }}
          onBlur={() => {
            onPointBlur?.()
          }}
        />
      )}
    </Box>
  )
}
