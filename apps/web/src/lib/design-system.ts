// Shim for @tribal/design-system
import React from 'react'

export function Badge({ children, variant, size }: { children: React.ReactNode; variant?: string; size?: string }) {
  const colors: Record<string, string> = {
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    danger: 'bg-red-500/20 text-red-300 border-red-500/30',
    default: 'bg-white/10 text-white/60 border-white/20',
  }
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return React.createElement('span', {
    className: `inline-flex items-center rounded-lg border font-medium ${sizeClass} ${colors[variant || 'default'] || colors.default}`,
  }, children)
}
