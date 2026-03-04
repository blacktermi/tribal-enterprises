import type { CanvasSize, SizePreset } from './types'

// Conversion vers pixels (base 96 DPI)
const DPI = 96
export const UNIT_TO_PX: Record<CanvasSize['unit'], number> = {
  px: 1,
  mm: DPI / 25.4,
  cm: DPI / 2.54,
  in: DPI,
}

export const UNIT_LABELS: { value: CanvasSize['unit']; label: string }[] = [
  { value: 'px', label: 'Pixels (px)' },
  { value: 'cm', label: 'Centimetres (cm)' },
  { value: 'mm', label: 'Millimetres (mm)' },
  { value: 'in', label: 'Pouces (in)' },
]

export const SIZE_PRESETS: SizePreset[] = [
  // Reseaux sociaux
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Reseaux sociaux' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Reseaux sociaux' },
  { name: 'Facebook Post', width: 1200, height: 630, category: 'Reseaux sociaux' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Reseaux sociaux' },
  { name: 'Twitter Post', width: 1600, height: 900, category: 'Reseaux sociaux' },
  // Impression
  { name: 'A4', width: 2480, height: 3508, category: 'Impression' },
  { name: 'A5', width: 1748, height: 2480, category: 'Impression' },
  { name: 'Sticker', width: 500, height: 500, category: 'Impression' },
  { name: 'Carte de visite', width: 1050, height: 600, category: 'Impression' },
]

export const FONT_LIST = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Playfair Display',
  'Poppins',
  'Lora',
  'Oswald',
]

export const DEFAULT_COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#6b7280',
]

export const DEFAULT_SHAPE_PROPS = {
  fill: '#6366f1',
  stroke: '#000000',
  strokeWidth: 0,
  opacity: 1,
}

export const DEFAULT_TEXT_PROPS = {
  fontSize: 32,
  fontFamily: 'Inter',
  fill: '#ffffff',
  fontWeight: 'normal' as const,
  fontStyle: 'normal' as const,
  textAlign: 'left' as const,
}
