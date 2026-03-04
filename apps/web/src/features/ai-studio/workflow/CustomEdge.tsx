/**
 * CUSTOM EDGE - Belle courbe fluide style Freepik Spaces
 * Bezier douce avec glow emerald, animation de flux, handles visuels
 */

import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  animated,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  })

  const strokeColor = style?.stroke ?? 'rgba(52, 211, 153, 0.6)'
  const strokeWidth = (style?.strokeWidth as number) ?? 2.5

  return (
    <>
      {/* Glow layer (wider, more transparent) */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth + 6}
        strokeOpacity={selected ? 0.15 : 0.06}
        className="transition-all duration-300"
      />

      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          strokeLinecap: 'round',
          filter: selected ? `drop-shadow(0 0 6px ${strokeColor})` : undefined,
          transition: 'stroke-width 0.2s, filter 0.2s',
        }}
      />

      {/* Animated flow dots */}
      {animated && (
        <circle r={2.5} fill={strokeColor as string}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Source dot */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={selected ? 5 : 4}
        fill="#0a0a0f"
        stroke={strokeColor as string}
        strokeWidth={2}
        className="transition-all duration-200"
      />

      {/* Target dot */}
      <circle
        cx={targetX}
        cy={targetY}
        r={selected ? 5 : 4}
        fill="#0a0a0f"
        stroke={strokeColor as string}
        strokeWidth={2}
        className="transition-all duration-200"
      />
    </>
  )
}

export default memo(CustomEdgeComponent)
