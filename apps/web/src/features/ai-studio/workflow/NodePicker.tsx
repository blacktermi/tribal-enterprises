/**
 * WORKFLOW NODE PICKER - Panneau d'ajout de noeuds
 * Affiche les categories et templates disponibles
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Search,
  Upload,
  Sparkles,
  Repeat,
  Wrench,
  Download,
  Image as ImageIcon,
  Video,
  Mic,
  Type,
  ImagePlus,
  Film,
  Music,
  Box,
  Wand2,
  Play,
  ArrowUpRight,
  Eraser,
  PenTool,
  Bot,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from './store'
import { NODE_CATEGORIES, NODE_TEMPLATES, getTemplatesByCategory } from './templates'

// ─── Icon maps ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  Upload,
  Sparkles,
  Repeat,
  Wrench,
  Download,
  Bot,
}

const NODE_ICONS: Record<string, typeof ImageIcon> = {
  Image: ImageIcon,
  Video,
  Mic,
  Type,
  ImagePlus,
  Film,
  Music,
  Box,
  Wand2,
  Play,
  ArrowUpRight,
  Eraser,
  Repeat,
  PenTool,
  Download,
  Bot,
}

const CATEGORY_COLORS: Record<string, string> = {
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
}

const CATEGORY_BG: Record<string, string> = {
  emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20',
  violet: 'bg-violet-500/10 hover:bg-violet-500/20',
  blue: 'bg-blue-500/10 hover:bg-blue-500/20',
  amber: 'bg-amber-500/10 hover:bg-amber-500/20',
  cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20',
  pink: 'bg-pink-500/10 hover:bg-pink-500/20',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function NodePicker() {
  const { showNodePicker, closeNodePicker, addNode, nodePickerPosition } = useWorkflowStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showNodePicker) {
      setSearch('')
      setActiveCategory(null)
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [showNodePicker])

  // Click outside
  useEffect(() => {
    if (!showNodePicker) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeNodePicker()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNodePicker, closeNodePicker])

  const handleAdd = useCallback(
    (nodeType: string) => {
      addNode(nodeType, nodePickerPosition ?? undefined)
      closeNodePicker()
    },
    [addNode, closeNodePicker, nodePickerPosition]
  )

  if (!showNodePicker) return null

  // Filter templates by search
  const allTemplates = Object.values(NODE_TEMPLATES)
  const filtered = search.trim()
    ? allTemplates.filter(
        t =>
          t.label.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory
      ? getTemplatesByCategory(activeCategory)
      : allTemplates

  return (
    <div
      ref={panelRef}
      className="absolute left-4 top-4 z-50 w-72 rounded-2xl border border-white/[0.08] bg-[#0c0c14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-bold text-white">Ajouter un noeud</span>
        <button
          type="button"
          onClick={closeNodePicker}
          className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (e.target.value) setActiveCategory(null)
            }}
            placeholder="Rechercher un noeud..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </div>

      {/* Category pills */}
      {!search.trim() && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {NODE_CATEGORIES.map(cat => {
            const CatIcon = CATEGORY_ICONS[cat.icon] ?? Sparkles
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all',
                  activeCategory === cat.id
                    ? `${CATEGORY_BG[cat.color]} ${CATEGORY_COLORS[cat.color]}`
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                )}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Templates list */}
      <div className="max-h-[340px] overflow-y-auto scrollbar-studio px-2 pb-2">
        {filtered.length === 0 && (
          <div className="py-6 text-center">
            <span className="text-xs text-white/30">Aucun noeud trouve</span>
          </div>
        )}

        {filtered.map(template => {
          const NodeIcon = NODE_ICONS[template.icon] ?? Box
          return (
            <button
              key={template.type}
              type="button"
              onClick={() => handleAdd(template.type)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors group"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  CATEGORY_BG[template.color],
                  CATEGORY_COLORS[template.color]
                )}
              >
                <NodeIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-white/80 group-hover:text-white block">
                  {template.label}
                </span>
                <span className="text-[10px] text-white/30 line-clamp-1">
                  {template.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
