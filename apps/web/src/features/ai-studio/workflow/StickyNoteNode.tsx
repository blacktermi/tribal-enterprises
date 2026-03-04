/**
 * STICKY NOTE NODE - Noeud post-it pour le workflow editor
 * Note editable directement sur le canvas, sans ports
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Trash2, GripVertical } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from './store'
import type { WorkflowNode } from './types'

// ─── Color presets ──────────────────────────────────────────────────────────

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string; handle: string }> = {
  yellow: {
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    text: 'text-amber-200/80',
    handle: 'text-amber-400/30',
  },
  pink: {
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    text: 'text-pink-200/80',
    handle: 'text-pink-400/30',
  },
  blue: {
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    text: 'text-blue-200/80',
    handle: 'text-blue-400/30',
  },
  green: {
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-200/80',
    handle: 'text-emerald-400/30',
  },
  purple: {
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    text: 'text-violet-200/80',
    handle: 'text-violet-400/30',
  },
}

const COLOR_OPTIONS = ['yellow', 'pink', 'blue', 'green', 'purple'] as const

const COLOR_DOTS: Record<string, string> = {
  yellow: 'bg-amber-400',
  pink: 'bg-pink-400',
  blue: 'bg-blue-400',
  green: 'bg-emerald-400',
  purple: 'bg-violet-400',
}

// ─── Component ──────────────────────────────────────────────────────────────

function StickyNoteNodeComponent({ id, data, selected }: NodeProps<WorkflowNode>) {
  const { updateNodeData, removeNode } = useWorkflowStore()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const noteColor = (data.color as string) ?? 'yellow'
  const colors = NOTE_COLORS[noteColor] ?? NOTE_COLORS.yellow
  const text = (data.text as string) ?? ''

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { text: e.target.value })
    },
    [id, updateNodeData]
  )

  const handleColorChange = useCallback(
    (color: string) => {
      updateNodeData(id, { color })
    },
    [id, updateNodeData]
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
        'relative rounded-xl border backdrop-blur-sm transition-all duration-200 min-w-[180px] max-w-[280px]',
        colors.bg,
        selected ? `${colors.border} shadow-lg` : 'border-white/[0.06]'
      )}
    >
      {/* Header — drag handle + actions */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <GripVertical className={cn('w-3.5 h-3.5 cursor-grab', colors.handle)} />

        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
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
                'w-3 h-3 rounded-full transition-transform',
                COLOR_DOTS[c],
                noteColor === c ? 'scale-125 ring-1 ring-white/30' : 'opacity-50 hover:opacity-80'
              )}
            />
          ))}

          <div className="w-px h-3 bg-white/[0.06] mx-0.5" />

          <button
            type="button"
            onClick={handleDelete}
            className="p-0.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Text content */}
      <div className="px-3 pb-3 min-h-[60px]" onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') setIsEditing(false)
            }}
            placeholder="Ecrivez ici..."
            className={cn(
              'w-full bg-transparent border-none outline-none resize-none text-xs leading-relaxed placeholder:text-white/15',
              colors.text
            )}
            rows={3}
          />
        ) : (
          <p
            className={cn(
              'text-xs leading-relaxed whitespace-pre-wrap cursor-text',
              text ? colors.text : 'text-white/15 italic'
            )}
          >
            {text || 'Double-cliquez pour ecrire...'}
          </p>
        )}
      </div>
    </div>
  )
}

export default memo(StickyNoteNodeComponent)
