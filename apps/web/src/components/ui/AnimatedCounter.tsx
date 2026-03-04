// Stub for AnimatedCounter
import React from 'react'

interface AnimatedCounterProps {
  value: number
  format?: 'number' | 'currency' | 'percent'
  currency?: string
}

export function AnimatedCounter({ value, format = 'number', currency = 'XOF' }: AnimatedCounterProps) {
  let display: string
  if (format === 'currency') {
    display = new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } else if (format === 'percent') {
    display = `${value.toFixed(1)}%`
  } else {
    display = new Intl.NumberFormat('fr-FR').format(value)
  }
  return <span>{display}</span>
}
