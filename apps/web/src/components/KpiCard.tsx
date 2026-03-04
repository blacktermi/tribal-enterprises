import React from 'react'
import { AnimatedCounter } from './ui/AnimatedCounter'

interface KpiCardProps {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon: React.ReactNode
  containerClassName?: string // e.g. 'from-blue-50 to-blue-100'
  titleClassName?: string // e.g. 'text-blue-700'
  valueClassName?: string // e.g. 'text-blue-900'
  subtitleClassName?: string // e.g. 'text-blue-700'
  iconBgClassName?: string // e.g. 'from-blue-500 to-blue-600'
  padding?: string // e.g. 'p-5' (default)
  rounded?: string // e.g. 'rounded-3xl' (default)
  shadow?: string // e.g. 'shadow-md' (default)
  /** Enable animated counting effect for numeric values */
  animated?: boolean
  /** Currency code for animated currency values */
  currency?: string
  /** Format type for animated values: 'number' | 'currency' | 'percent' */
  format?: 'number' | 'currency' | 'percent'
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  containerClassName = '',
  titleClassName = 'text-white/60',
  valueClassName = 'text-white',
  subtitleClassName = 'text-white/60',
  iconBgClassName = 'from-gray-500 to-gray-600',
  padding = 'p-6',
  rounded = 'rounded-2xl',
  shadow = '',
  animated = false,
  currency = 'XOF',
  format = 'number',
}: KpiCardProps) {
  // Render value with optional animation
  const renderValue = () => {
    if (animated && typeof value === 'number') {
      return <AnimatedCounter value={value} format={format} currency={currency} />
    }
    return value
  }

  return (
    <div
      className={`${padding} ${rounded} glass ${containerClassName} ${shadow} transition-all hover:shadow-lg`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-3">
          <div className={`text-sm font-bold uppercase tracking-wider ${titleClassName}`}>
            {title}
          </div>
          <div className={`text-4xl leading-none font-black mt-2 break-words ${valueClassName}`}>
            {renderValue()}
          </div>
          {subtitle && <div className={`text-sm mt-2 ${subtitleClassName}`}>{subtitle}</div>}
        </div>
        <div
          className={`w-12 h-12 flex-shrink-0 bg-gradient-to-br ${iconBgClassName} rounded-xl flex items-center justify-center shadow-lg ml-auto`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export default KpiCard
