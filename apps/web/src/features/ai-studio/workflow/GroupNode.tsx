/**
 * GROUP NODE - Conteneur visuel pour grouper des noeuds
 * Apparence : cadre arrondi semi-transparent avec label editable
 * Permet de deplacer tous les enfants ensemble
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Ungroup, GripVertical, Trash2, Pencil } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from './store'
import type { WorkflowNode } from './types'

// ─── Group color presets ────────────────────────────────────────────────────

const GROUP_COLORS: Record<
  string,
  { bg: string; border: string; label: string; borderSelected: string }
> = {
  purple: {
    bg: 'bg-violet-500/[0.04]',
    border: 'border-violet-500/15',
    borderSelected: 'border-violet-500/40',
    label: 'text-violet-400/60',
  },
  blue: {
    bg: 'bg-blue-500/[0.04]',
    border: 'border-blue-500/15',
    borderSelected: 'border-blue-500/40',
    label: 'text-blue-400/60',
  },
  green: {
    bg: 'bg-emerald-500/[0.04]',
    border: 'border-emerald-500/15',
    borderSelected: 'border-emerald-500/40',
    label: 'text-emerald-400/60',
  },
  orange: {
    bg: 'bg-amber-500/[0.04]',
    border: 'border-amber-500/15',
    borderSelected: 'border-amber-500/40',
    label: 'text-amber-400/60',
  },
  red: {
    bg: 'bg-red-500/[0.04]',
    border: 'border-red-500/15',
    borderSelected: 'border-red-500/40',
    label: 'text-red-400/60',
  },
  pink: {
    bg: 'bg-pink-500/[0.04]',
    border: 'border-pink-500/15',
    borderSelected: 'border-pink-500/40',
    label: 'text-pink-400/60',
  },
}

const COLOR_OPTIONS = ['purple', 'blue', 'green', 'orange', 'red', 'pink'] as const

const COLOR_DOTS: Record<string, string> = {
  purple: 'bg-violet-400',
  blue: 'bg-blue-400',
  green: 'bg-emerald-400',
  orange: 'bg-amber-400',
  red: 'bg-red-400',
  pink: 'bg-pink-400',
}

// ─── Component ──────────────────────────────────────────────────────────────

function GroupNodeComponent({ id, data, selected }: NodeProps<WorkflowNode>) {
  const { updateNodeData, ungroupNodes, removeNode } = useWorkflowStore()
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const groupColor = (data.color as string) ?? 'purple'
  const colors = GROUP_COLORS[groupColor] ?? GROUP_COLORS.purple
  const label = (data.label as string) ?? 'Groupe'

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { label: e.target.value })
    },
    [id, updateNodeData]
  )

  const handleColorChange = useCallback(
    (color: string) => {
      updateNodeData(id, { color })
    },
    [id, updateNodeData]
  )

  const handleUngroup = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      ungroupNodes(id)
    },
    [id, ungroupNodes]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removeNode(id)
    },
    [id, removeNode]
  )

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed transition-all duration-200 w-full h-full min-w-[200px] min-h-[150px]',
        colors.bg,
        selected ? colors.borderSelected : colors.border
      )}
    >
      {/* Header bar — top-left label + actions top-right */}
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-1">
        {/* Label */}
        <div className="flex items-center gap-1.5">
          <GripVertical className={cn('w-3 h-3 cursor-grab', colors.label)} />

          {isEditing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={handleLabelChange}
              onBlur={() => setIsEditing(false)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false)
              }}
              className="bg-transparent border-none outline-none text-[11px] font-semibold text-white/70 w-28"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setIsEditing(true)}
              className={cn('text-[11px] font-semibold', colors.label)}
            >
              {label}
            </button>
          )}
        </div>

        {/* Actions (visible when selected) */}
        <div
          className={cn(
            'flex items-center gap-0.5 transition-opacity',
            selected ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Color dots */}
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorChange(c)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-transform',
                COLOR_DOTS[c],
                groupColor === c ? 'scale-125 ring-1 ring-white/30' : 'opacity-40 hover:opacity-70'
              )}
            />
          ))}

          <div className="w-px h-3 bg-white/[0.06] mx-1" />

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-0.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
            title="Renommer"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={handleUngroup}
            className="p-0.5 rounded text-white/20 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
            title="Degrouper"
          >
            <Ungroup className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-0.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Supprimer le groupe"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(GroupNodeComponent)
