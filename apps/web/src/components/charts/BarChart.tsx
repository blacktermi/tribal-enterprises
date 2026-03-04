// Stub for BarChart component
import React from 'react'

interface BarChartProps {
  data: number[]
  labels?: string[]
  color?: string
  compare?: number[]
}

export function BarChart({ data, labels, color = '#14B8A6' }: BarChartProps) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-full w-full px-2 pb-6 pt-2">
      {data.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(value / max) * 100}%`,
              minHeight: value > 0 ? 4 : 0,
              backgroundColor: color,
              opacity: 0.8,
            }}
          />
          {labels?.[i] && (
            <span className="text-[10px] text-white/50 truncate w-full text-center">
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
