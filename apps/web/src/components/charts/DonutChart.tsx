// Stub for DonutChart component
import React from 'react'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSegment[]
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) {
    return (
      <div className="w-48 h-48 rounded-full border-8 border-white/10 flex items-center justify-center">
        <span className="text-sm text-white/50">Aucune donnée</span>
      </div>
    )
  }

  // Build conic-gradient segments
  let cumulative = 0
  const stops = data.map(d => {
    const start = cumulative
    cumulative += (d.value / total) * 360
    return `${d.color} ${start}deg ${cumulative}deg`
  })

  return (
    <div
      className="w-48 h-48 rounded-full relative"
      style={{ background: `conic-gradient(${stops.join(', ')})` }}
    >
      <div className="absolute inset-6 rounded-full bg-[#050505] flex items-center justify-center">
        <span className="text-sm font-semibold text-white">{data.length} postes</span>
      </div>
    </div>
  )
}
