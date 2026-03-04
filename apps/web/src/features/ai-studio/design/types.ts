export interface CanvasSize {
  width: number
  height: number
  unit: 'px' | 'cm' | 'mm' | 'in'
}

export type DesignTool =
  | 'select'
  | 'pan'
  | 'text'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'image'

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf'

export interface SizePreset {
  name: string
  width: number
  height: number
  category: string
}
