// Stub for Sparkline component
import React from 'react'

interface SparklineProps {
  data: number[]
  labels?: string[]
  stroke?: string
  showDots?: boolean
  compare?: number[]
}

export function Sparkline({ data, labels, stroke = '#14B8A6', showDots }: SparklineProps) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 400
  const height = 120
  const padding = 10

  const points = data.map((v, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding)
    const y = height - padding - ((v - min) / range) * (height - 2 * padding)
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2} />
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
      ))}
    </svg>
  )
}
