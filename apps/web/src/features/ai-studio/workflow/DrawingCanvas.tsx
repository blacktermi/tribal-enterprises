/**
 * DRAWING CANVAS - Overlay SVG pour le dessin libre
 * Actif uniquement quand activeTool === 'draw'
 * Capture les mouvements souris et dessine des paths SVG
 */

import { useCallback, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useWorkflowStore, type DrawingPath } from './store'

// ─── Convert points to SVG path with smoothing ──────────────────────────────

function pointsToSvgPath(points: number[][]): string {
  if (points.length < 2) return ''

  // Start at first point
  let d = `M ${points[0][0]} ${points[0][1]}`

  if (points.length === 2) {
    d += ` L ${points[1][0]} ${points[1][1]}`
    return d
  }

  // Use quadratic bezier curves for smoothing
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i][0] + points[i + 1][0]) / 2
    const yc = (points[i][1] + points[i + 1][1]) / 2
    d += ` Q ${points[i][0]} ${points[i][1]}, ${xc} ${yc}`
  }

  // End at last point
  const last = points[points.length - 1]
  d += ` L ${last[0]} ${last[1]}`

  return d
}

// ─── Single path renderer ───────────────────────────────────────────────────

function DrawPath({ path }: { path: DrawingPath }) {
  const d = pointsToSvgPath(path.points)
  if (!d) return null

  return (
    <path
      d={d}
      stroke={path.color}
      strokeWidth={path.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={0.8}
    />
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DrawingCanvas() {
  const {
    activeTool,
    drawingPaths,
    activeDrawingPoints,
    drawColor,
    drawStrokeWidth,
    startDrawing,
    continueDrawing,
    finishDrawing,
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()
  const isDrawing = useRef(false)

  // Convert screen coords to flow coords for consistent positioning
  const getFlowPoint = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      return [pos.x, pos.y]
    },
    [screenToFlowPosition]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'draw' || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      isDrawing.current = true
      startDrawing(getFlowPoint(e))
    },
    [activeTool, startDrawing, getFlowPoint]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || activeTool !== 'draw') return
      e.preventDefault()
      continueDrawing(getFlowPoint(e))
    },
    [activeTool, continueDrawing, getFlowPoint]
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    finishDrawing()
  }, [finishDrawing])

  // Active path being drawn right now
  const activeD = activeDrawingPoints ? pointsToSvgPath(activeDrawingPoints) : ''

  // Only show overlay + capture events when draw tool is active
  const isDrawTool = activeTool === 'draw'

  // Always render the SVG (to show existing drawings), but only capture events in draw mode
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: isDrawTool ? 'auto' : 'none',
        cursor: isDrawTool ? 'crosshair' : 'default',
        zIndex: isDrawTool ? 15 : 5,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Completed paths */}
      {drawingPaths.map(path => (
        <DrawPath key={path.id} path={path} />
      ))}

      {/* Active path being drawn */}
      {activeD && (
        <path
          d={activeD}
          stroke={drawColor}
          strokeWidth={drawStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.6}
          strokeDasharray="none"
        />
      )}
    </svg>
  )
}
