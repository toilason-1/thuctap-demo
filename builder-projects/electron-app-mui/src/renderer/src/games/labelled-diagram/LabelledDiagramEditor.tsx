import { Alert, Box, Collapse } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useCallback, useMemo, useState } from 'react'
import { LabelledDiagramAppData, LabelledDiagramPoint } from '../../types'
import { ImageCanvas, PointsPanel } from './components'

interface Props {
  appData: LabelledDiagramAppData
  projectDir: string
  onChange: (data: LabelledDiagramAppData) => void
}

function normalize(d: LabelledDiagramAppData): LabelledDiagramAppData {
  return {
    ...d,
    _pointCounter: d._pointCounter ?? 0,
    points: d.points ?? [],
    image: d.image ?? null
  }
}

/**
 * Generate a distinct color for a point based on its index.
 * Uses HSL color wheel distribution for maximum distinctness.
 */
function generateColor(index: number): string {
  // Distribute colors evenly around the HSL color wheel
  const hue = (index * 137.508) % 360 // Golden angle for optimal distribution
  return `hsl(${hue.toFixed(1)}, 70%, 50%)`
}

export default function LabelledDiagramEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const { points, image } = data

  // Interaction state
  const [focusedPointId, setFocusedPointId] = useState<string | null>(null)
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)
  const [transformState, setTransformState] = useState<{
    scale: number
    positionX: number
    positionY: number
  } | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addPoint = useCallback(
    (xPercent?: number, yPercent?: number) => {
      const counter = data._pointCounter + 1
      const point: LabelledDiagramPoint = {
        id: `point-${counter}`,
        text: '',
        xPercent: xPercent ?? 50, // Default to center if not specified
        yPercent: yPercent ?? 50,
        color: generateColor(counter - 1),
        visible: true
      }
      onChange({
        ...data,
        _pointCounter: counter,
        points: [...points, point]
      })
    },
    [data, points, onChange]
  )

  const updatePoint = useCallback(
    (id: string, patch: Partial<LabelledDiagramPoint>) => {
      onChange({
        ...data,
        points: points.map((p) => (p.id === id ? { ...p, ...patch } : p))
      })
    },
    [data, points, onChange]
  )

  const deletePoint = useCallback(
    (id: string) => {
      onChange({ ...data, points: points.filter((p) => p.id !== id) })
    },
    [data, points, onChange]
  )

  const updateImage = useCallback(
    (imagePath: string | null) => {
      onChange({ ...data, image: imagePath })
    },
    [data, onChange]
  )

  const handlePointPositionChange = useCallback(
    (id: string, xPercent: number, yPercent: number) => {
      if (id === 'new') {
        // Add new point at this position
        addPoint(xPercent, yPercent)
      } else {
        // Update existing point position
        updatePoint(id, { xPercent, yPercent })
      }
    },
    [addPoint, updatePoint]
  )

  const handlePointClick = useCallback((point: LabelledDiagramPoint) => {
    setFocusedPointId(point.id)
  }, [])

  const handlePointBlur = useCallback(() => {
    setFocusedPointId(null)
  }, [])

  const handlePanelScrollToPoint = useCallback((pointId: string) => {
    // This would scroll the PointsPanel to the specific entry
    // For now, we just focus it
    setFocusedPointId(pointId)
  }, [])

  // Calculate which points are visible on screen
  const visiblePointIds = useMemo(() => {
    const visible = new Set<string>()
    if (!transformState || !imageDimensions) return visible

    const { scale, positionX, positionY } = transformState
    const viewportWidth = window.innerWidth - 320 // Account for sidebar
    const viewportHeight = window.innerHeight

    // Calculate visible area in image coordinates
    const imageLeft = -positionX / scale
    const imageTop = -positionY / scale
    const imageRight = (viewportWidth - positionX) / scale
    const imageBottom = (viewportHeight - positionY) / scale

    // Convert to percentage (assuming image fits in viewport)
    points.forEach((point) => {
      const pointX = (point.xPercent / 100) * imageDimensions.width
      const pointY = (point.yPercent / 100) * imageDimensions.height

      if (
        pointX >= imageLeft &&
        pointX <= imageRight &&
        pointY >= imageTop &&
        pointY <= imageBottom
      ) {
        visible.add(point.id)
      }
    })

    return visible
  }, [points, transformState, imageDimensions])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: () => addPoint()
  })

  // ── Validation ────────────────────────────────────────────────────────────
  const unnamedPoints = points.filter((p) => !p.text.trim())
  const overlappingPoints = useMemo(() => {
    const overlaps: [LabelledDiagramPoint, LabelledDiagramPoint][] = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i].xPercent - points[j].xPercent, 2) +
            Math.pow(points[i].yPercent - points[j].yPercent, 2)
        )
        if (dist < 2) {
          // Less than 2% apart
          overlaps.push([points[i], points[j]])
        }
      }
    }
    return overlaps
  }, [points])

  const hasIssues = !image || points.length < 2 || unnamedPoints.length > 0

  const validationMessages = useMemo(() => {
    const messages: string[] = []
    if (!image) messages.push('Upload a diagram image')
    if (points.length < 2) messages.push('Add at least 2 points')
    if (unnamedPoints.length > 0) messages.push(`${unnamedPoints.length} point(s) missing a label`)
    if (overlappingPoints.length > 0) messages.push(`${overlappingPoints.length} overlapping point(s)`)
    return messages
  }, [image, points.length, unnamedPoints.length, overlappingPoints.length])

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#0f1117' }}>
      {/* ── Main Content Area - Image Canvas ── */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mx: 3, mt: 3, mb: 2, fontSize: '0.8rem' }}>
            {validationMessages.join(' · ')}
          </Alert>
        </Collapse>

        <ImageCanvas
          projectDir={projectDir}
          image={image}
          points={points}
          onImageChange={updateImage}
          onPointPositionChange={handlePointPositionChange}
          onPointDelete={deletePoint}
          onPointClick={handlePointClick}
          onPointBlur={handlePointBlur}
          onPanelScrollToPoint={handlePanelScrollToPoint}
          focusedPointId={focusedPointId}
          hoveredPointId={hoveredPointId}
          onHoveredPointChange={setHoveredPointId}
          proximityPointIds={undefined}
          onTransformChange={setTransformState}
          onImageDimensionsChange={setImageDimensions}
        />
      </Box>

      {/* ── Left Panel - Points List (Collapsible) ── */}
      <PointsPanel
        points={points}
        focusedPointId={focusedPointId}
        visiblePointIds={visiblePointIds}
        onUpdatePoint={updatePoint}
        onDeletePoint={deletePoint}
        onFollowPoint={(pointId) => {
          const point = points.find((p) => p.id === pointId)
          if (!point) return
          // Focus the point - the follow functionality would require transform access
          setFocusedPointId(pointId)
        }}
        onFocusPoint={setFocusedPointId}
        onAddPoint={addPoint}
      />
    </Box>
  )
}
