import { Box } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { KeepScale, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { LabelledDiagramPoint } from '../../../types'

interface ImageViewerProps {
  imagePath: string
  projectDir: string
  points: LabelledDiagramPoint[]
  selectedPointId: string | null
  onImageDoubleClick: (xPercent: number, yPercent: number) => void
  onPointDrag: (id: string, xPercent: number, yPercent: number) => void
  getPointColor: (index: number) => { bg: string; text: string }
  onAddPointAtCenter: (xPercent: number, yPercent: number) => void
  onShowWarning: (message: string | null) => void
}

interface DraggablePointProps {
  point: LabelledDiagramPoint
  index: number
  isSelected: boolean
  getPointColor: (index: number) => { bg: string; text: string }
  onDragEnd: (id: string, xPercent: number, yPercent: number) => void
}

function DraggablePoint({
  point,
  index,
  isSelected,
  getPointColor,
  onDragEnd
}: DraggablePointProps): React.ReactElement {
  const pointRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: point.xPercent, y: point.yPercent })
  const pointColor = getPointColor(index)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setIsDragging(true)
      setShowTooltip(false)
      setDragPosition({ x: point.xPercent, y: point.yPercent })
    },
    [point.xPercent, point.yPercent]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()

      // Get the content component to calculate percentages
      const content = pointRef.current?.closest('.react-transform-component')
      if (!content) return

      const contentRect = content.getBoundingClientRect()

      // Calculate the position within the scaled/panned content
      const relativeX = (e.clientX - contentRect.left) / contentRect.width
      const relativeY = (e.clientY - contentRect.top) / contentRect.height

      // Convert to percentage (0-100)
      const newPercentX = Math.max(0, Math.min(100, relativeX * 100))
      const newPercentY = Math.max(0, Math.min(100, relativeY * 100))

      // Update visual position immediately (local state, no onChange)
      setDragPosition({ x: newPercentX, y: newPercentY })
    }

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsDragging(false)

      // Commit the final position to parent
      onDragEnd(point.id, dragPosition.x, dragPosition.y)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp, { passive: false })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, point.id, dragPosition.x, dragPosition.y, onDragEnd])

  // Use drag position while dragging, otherwise use the actual point position
  const displayX = isDragging ? dragPosition.x : point.xPercent
  const displayY = isDragging ? dragPosition.y : point.yPercent

  return (
    <div
      ref={pointRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isDragging && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'absolute',
        left: `${displayX}%`,
        top: `${displayY}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging || isSelected ? 1000 : 100
      }}
    >
      {/* Point Badge with KeepScale */}
      <KeepScale>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: pointColor.bg,
            color: pointColor.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            boxShadow:
              isDragging || isSelected
                ? '0 0 0 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                : '0 2px 6px rgba(0,0,0,0.4)',
            border: isSelected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
            userSelect: 'none',
            position: 'relative'
          }}
        >
          {index + 1}
        </Box>
      </KeepScale>

      {/* Tooltip on hover - also wrapped in KeepScale */}
      {showTooltip && point.text && (
        <KeepScale>
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mt: 1,
              px: 1.5,
              py: 0.75,
              bgcolor: 'rgba(0,0,0,0.85)',
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {point.text}
          </Box>
        </KeepScale>
      )}
    </div>
  )
}

export function ImageViewer({
  imagePath,
  projectDir,
  points,
  selectedPointId,
  onImageDoubleClick,
  onPointDrag,
  getPointColor,
  onAddPointAtCenter,
  onShowWarning
}: ImageViewerProps): React.ReactElement {
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Resolve the asset URL
  useEffect(() => {
    let mounted = true
    const loadUrl = async () => {
      try {
        const url = await window.electronAPI.resolveAssetUrl(projectDir, imagePath)
        if (mounted) {
          setImageUrl(url)
        }
      } catch (error) {
        console.error('Failed to resolve asset URL:', error)
      }
    }
    loadUrl()
    return () => {
      mounted = false
    }
  }, [projectDir, imagePath])

  // Handle double-click to create point
  const handleImageDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't add point if clicking on an existing point
      if ((e.target as HTMLElement).closest('.draggable-point')) {
        return
      }

      const wrapper = e.currentTarget.closest('.react-transform-wrapper')
      if (!wrapper) return

      const content = wrapper.querySelector('.react-transform-component')
      if (!content) return

      const contentRect = content.getBoundingClientRect()

      // Calculate the position within the scaled/panned content
      const relativeX = (e.clientX - contentRect.left) / contentRect.width
      const relativeY = (e.clientY - contentRect.top) / contentRect.height

      // Convert to percentage (0-100)
      const xPercent = Math.max(0, Math.min(100, relativeX * 100))
      const yPercent = Math.max(0, Math.min(100, relativeY * 100))

      onImageDoubleClick(xPercent, yPercent)
    },
    [onImageDoubleClick]
  )

  // Add point at center of current view
  const handleAddPointAtCenter = useCallback(() => {
    if (!transformComponentRef.current || !wrapperRef.current) {
      onShowWarning('Cannot determine view center')
      return
    }

    const wrapper = wrapperRef.current
    const content = wrapper.querySelector('.react-transform-component')

    if (!content) {
      onShowWarning('Cannot determine view center')
      return
    }

    const wrapperRect = wrapper.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()

    // Center of the wrapper in screen coordinates
    const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2
    const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2

    // Convert to content coordinates
    const relativeX = (wrapperCenterX - contentRect.left) / contentRect.width
    const relativeY = (wrapperCenterY - contentRect.top) / contentRect.height

    // Check if center is within the image bounds (0-100%)
    if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
      onShowWarning(
        'The center of the view is outside the image. Zoom or pan to show the image center.'
      )
      return
    }

    // Convert to percentage
    const xPercent = relativeX * 100
    const yPercent = relativeY * 100

    onAddPointAtCenter(xPercent, yPercent)
  }, [onAddPointAtCenter, onShowWarning])

  // Expose the add point at center function to parent via window event
  useEffect(() => {
    const handleCustomEvent = () => {
      handleAddPointAtCenter()
    }
    window.addEventListener('labelled-diagram-add-point-center', handleCustomEvent)
    return () => {
      window.removeEventListener('labelled-diagram-add-point-center', handleCustomEvent)
    }
  }, [handleAddPointAtCenter])

  return (
    <TransformWrapper
      ref={transformComponentRef}
      initialScale={1}
      minScale={1}
      maxScale={5}
      centerOnInit
      limitToBounds={true}
      doubleClick={{ disabled: true }}
      panning={{
        disabled: false,
        velocityDisabled: true,
        allowLeftClickPan: true,
        allowRightClickPan: false,
        allowMiddleClickPan: false
      }}
      wheel={{
        step: 0.2,
        disabled: false
      }}
    >
      <TransformComponent
        wrapperStyle={{
          width: '100%',
          height: '100%',
          cursor: 'default'
        }}
        wrapperClass="image-viewer-wrapper"
        contentClass="image-viewer-content"
      >
        <div
          ref={wrapperRef}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
          onDoubleClick={handleImageDoubleClick}
        >
          {/* The Image */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Diagram"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                pointerEvents: 'auto'
              }}
            />
          )}

          {/* Points Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {points.map((point, index) => (
              <div key={point.id} className="draggable-point" style={{ pointerEvents: 'auto' }}>
                <DraggablePoint
                  point={point}
                  index={index}
                  isSelected={point.id === selectedPointId}
                  getPointColor={getPointColor}
                  onDragEnd={onPointDrag}
                />
              </div>
            ))}
          </div>
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
