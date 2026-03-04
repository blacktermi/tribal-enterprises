/**
 * WORKFLOW EDITOR - Composant principal
 * Canvas React Flow + Toolbar verticale gauche (style Freepik Spaces)
 * Welcome screen avec cards categories + particules constellation
 * Dark premium theme coherent avec Tribal Studio
 *
 * Outils: Hand (pan), Select (rectangle), Cut, Connect, Draw, Note
 * Actions: Group (Ctrl+G), Duplicate (Ctrl+D), Color selection
 */

import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  SelectionMode,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Plus,
  Play,
  Undo2,
  Redo2,
  Trash2,
  Loader2,
  DollarSign,
  Clock,
  MousePointer2,
  Hand,
  Scissors,
  Link2,
  Pencil,
  StickyNote,
  Settings,
  Upload,
  Wrench,
  Download,
  ImagePlus,
  Film,
  Bot,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clipboard,
  Group,
  Ungroup,
  Copy,
  Palette,
  X,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore, type NodeColor } from './store'
import { NodePicker } from './NodePicker'
import { PropertiesPanel } from './PropertiesPanel'
import WorkflowNodeComponent from './WorkflowNode'
import StickyNoteNodeComponent from './StickyNoteNode'
import GroupNodeComponent from './GroupNode'
import { DrawingCanvas } from './DrawingCanvas'
import CustomEdgeComponent from './CustomEdge'
import { aiStudioApi, type RunModelPayload } from '../api/aiStudioApi'
import { llmApi } from '../../tribal-llm/api/llmApi'
import type { ActiveTool } from './types'

// ─── Custom node types for React Flow ───────────────────────────────────────

const nodeTypes = {
  workflow: WorkflowNodeComponent,
  'sticky-note': StickyNoteNodeComponent,
  group: GroupNodeComponent,
}

const edgeTypes = {
  custom: CustomEdgeComponent,
}

// ─── Selection color palette ────────────────────────────────────────────────

const SELECTION_COLORS: Array<{ id: NodeColor; dot: string; label: string }> = [
  { id: 'none', dot: 'bg-white/20 ring-1 ring-white/10', label: 'Aucune' },
  { id: 'red', dot: 'bg-red-500', label: 'Rouge' },
  { id: 'orange', dot: 'bg-amber-500', label: 'Orange' },
  { id: 'yellow', dot: 'bg-yellow-400', label: 'Jaune' },
  { id: 'green', dot: 'bg-emerald-500', label: 'Vert' },
  { id: 'blue', dot: 'bg-blue-500', label: 'Bleu' },
  { id: 'purple', dot: 'bg-violet-500', label: 'Violet' },
  { id: 'pink', dot: 'bg-pink-500', label: 'Rose' },
]

// ─── Constellation Background (SVG particles + lines) ───────────────────────

function ConstellationBg() {
  // Fixed constellation points — decorative connected dots
  const points = useMemo(
    () => [
      { x: 120, y: 80, r: 2, delay: 0 },
      { x: 280, y: 40, r: 1.5, delay: 0.5 },
      { x: 400, y: 110, r: 2.5, delay: 1 },
      { x: 180, y: 200, r: 1.5, delay: 1.5 },
      { x: 340, y: 180, r: 2, delay: 0.3 },
      { x: 500, y: 60, r: 1.5, delay: 0.8 },
      { x: 60, y: 160, r: 2, delay: 1.2 },
      { x: 460, y: 200, r: 1.5, delay: 0.6 },
      { x: 220, y: 120, r: 1, delay: 1.8 },
      { x: 540, y: 150, r: 2, delay: 0.2 },
      { x: 100, y: 240, r: 1.5, delay: 1.4 },
      { x: 380, y: 250, r: 2, delay: 0.9 },
    ],
    []
  )

  const lines = useMemo(
    () => [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [4, 2],
      [1, 5],
      [6, 0],
      [4, 7],
      [8, 4],
      [5, 9],
      [6, 10],
      [7, 11],
      [3, 8],
    ],
    []
  )

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      viewBox="0 0 600 300"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Lines */}
      {lines.map(([a, b], i) => (
        <line
          key={`l-${i}`}
          x1={points[a].x}
          y1={points[a].y}
          x2={points[b].x}
          y2={points[b].y}
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth={0.5}
        />
      ))}
      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="rgba(139, 92, 246, 0.4)"
          className="animate-pulse"
          style={{ animationDelay: `${p.delay}s` }}
        />
      ))}
    </svg>
  )
}

// ─── Welcome Screen with Category Cards ─────────────────────────────────────

const WELCOME_CARDS = [
  {
    id: 'sources',
    label: 'Sources',
    icon: Upload,
    color: 'emerald',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    id: 'generation-img',
    label: "Generateur d'images",
    icon: ImagePlus,
    color: 'violet',
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    nodeType: 'text-to-image',
  },
  {
    id: 'generation-vid',
    label: 'Generateur de videos',
    icon: Film,
    color: 'blue',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    nodeType: 'text-to-video',
  },
  {
    id: 'tools',
    label: 'Outils',
    icon: Wrench,
    color: 'amber',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: Bot,
    color: 'pink',
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    border: 'border-pink-500/20',
    nodeType: 'assistant',
  },
  {
    id: 'output',
    label: 'Sortie',
    icon: Download,
    color: 'cyan',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    nodeType: 'output',
  },
]

function WelcomeScreen({
  onCategoryClick,
}: {
  onCategoryClick: (categoryId: string, nodeType?: string) => void
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="relative text-center pointer-events-auto max-w-xl mx-auto px-4">
        {/* Constellation particles behind */}
        <div className="absolute -inset-20 -top-10">
          <ConstellationBg />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Votre espace est pret</h2>
          <p className="text-sm text-white/40">
            Choisissez votre premier noeud et commencez a creer
          </p>
        </div>

        {/* Category cards */}
        <div className="relative z-10 flex items-stretch gap-3 justify-center">
          {WELCOME_CARDS.map(card => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  card.nodeType ? onCategoryClick(card.id, card.nodeType) : onCategoryClick(card.id)
                }
                className={cn(
                  'flex flex-col items-center gap-2.5 w-[110px] px-3 py-5 rounded-2xl border transition-all duration-200',
                  'bg-white/[0.03] border-white/[0.06]',
                  'hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-[1.03]',
                  'group'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                    card.bg,
                    card.text
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-white/60 group-hover:text-white/80 leading-tight line-clamp-2 text-center">
                  {card.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tooltip (right side) ───────────────────────────────────────────────────

function Tooltip({
  label,
  shortcut,
  children,
}: {
  label: string
  shortcut?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/[0.08] shadow-xl shadow-black/40">
          <span className="text-[11px] font-medium text-white/80">{label}</span>
          {shortcut && (
            <kbd className="text-[10px] font-mono text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vertical Left Toolbar (Freepik Spaces style) ───────────────────────────

interface ToolbarProps {
  onRun: () => void
  isExecuting: boolean
  totalCost: number
  totalDuration: number
  nodeCount: number
}

function LeftToolbar({ nodeCount }: { nodeCount: number }) {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearWorkflow,
    openNodePicker,
    activeTool,
    setActiveTool,
    addStickyNote,
    selectedNodeIds,
    groupSelectedNodes,
    duplicateSelection,
  } = useWorkflowStore()

  const hasMultiSelection = selectedNodeIds.length >= 2

  const tools: Array<{
    id: ActiveTool | 'add' | 'sticky'
    icon: typeof Plus
    label: string
    shortcut: string
    action?: () => void
  }> = [
    {
      id: 'add',
      icon: Plus,
      label: 'Ajouter un noeud',
      shortcut: 'A',
      action: () => openNodePicker(),
    },
    { id: 'hand', icon: Hand, label: 'Main (naviguer)', shortcut: 'H' },
    { id: 'select', icon: MousePointer2, label: 'Selection', shortcut: 'V' },
    { id: 'cut', icon: Scissors, label: 'Couper connexion', shortcut: 'X' },
    { id: 'connect', icon: Link2, label: 'Connecter', shortcut: 'C' },
    { id: 'draw', icon: Pencil, label: 'Dessiner', shortcut: 'D' },
    {
      id: 'sticky',
      icon: StickyNote,
      label: 'Note',
      shortcut: 'N',
      action: () => addStickyNote(),
    },
  ]

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Ctrl/Cmd combos
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            undo()
            return
          case 'y':
            e.preventDefault()
            redo()
            return
          case 'g':
            e.preventDefault()
            groupSelectedNodes()
            return
          case 'd':
            e.preventDefault()
            duplicateSelection()
            return
        }
        return
      }

      if (e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault()
          openNodePicker()
          break
        case 'h':
          e.preventDefault()
          setActiveTool('hand')
          break
        case 'v':
          e.preventDefault()
          setActiveTool('select')
          break
        case 'x':
          e.preventDefault()
          setActiveTool('cut')
          break
        case 'c':
          e.preventDefault()
          setActiveTool('connect')
          break
        case 'd':
          e.preventDefault()
          setActiveTool('draw')
          break
        case 'n':
          e.preventDefault()
          addStickyNote()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    openNodePicker,
    setActiveTool,
    addStickyNote,
    groupSelectedNodes,
    duplicateSelection,
    undo,
    redo,
  ])

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 px-1.5 py-2 rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
      {/* Tool buttons */}
      {tools.map((tool, i) => {
        const Icon = tool.icon
        const isActive = tool.id !== 'add' && tool.id !== 'sticky' && activeTool === tool.id
        const isSpecial = tool.id === 'add'

        return (
          <div key={tool.id}>
            <Tooltip label={tool.label} shortcut={tool.shortcut}>
              <button
                type="button"
                onClick={() => {
                  if (tool.action) {
                    tool.action()
                  } else if (tool.id !== 'add' && tool.id !== 'sticky') {
                    setActiveTool(tool.id as ActiveTool)
                  }
                }}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150',
                  isSpecial
                    ? 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/25'
                    : isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* Separator after add button and after sticky note */}
            {(i === 0 || i === 6) && <div className="w-5 h-px bg-white/[0.06] mx-auto my-1" />}
          </div>
        )
      })}

      {/* Separator */}
      <div className="w-5 h-px bg-white/[0.06] mx-auto my-1" />

      {/* Group */}
      <Tooltip label="Grouper" shortcut="Ctrl+G">
        <button
          type="button"
          onClick={groupSelectedNodes}
          disabled={!hasMultiSelection}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Group className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Duplicate */}
      <Tooltip label="Dupliquer" shortcut="Ctrl+D">
        <button
          type="button"
          onClick={duplicateSelection}
          disabled={selectedNodeIds.length === 0}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Copy className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="w-5 h-px bg-white/[0.06] mx-auto my-1" />

      {/* Undo / Redo */}
      <Tooltip label="Annuler" shortcut="Ctrl+Z">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      </Tooltip>
      <Tooltip label="Retablir" shortcut="Ctrl+Y">
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="w-5 h-px bg-white/[0.06] mx-auto my-1" />

      {/* Clear */}
      <Tooltip label="Tout effacer">
        <button
          type="button"
          onClick={clearWorkflow}
          disabled={nodeCount === 0}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Settings placeholder */}
      <Tooltip label="Parametres">
        <button
          type="button"
          onClick={() => useWorkflowStore.getState().toggleSettings()}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  )
}

// ─── Floating Selection Bar (appears when multi-selecting) ───────────────────

function SelectionBar() {
  const {
    selectedNodeIds,
    groupSelectedNodes,
    duplicateSelection,
    setSelectionColor,
    ungroupNodes,
    nodes,
  } = useWorkflowStore()
  const [showColors, setShowColors] = useState(false)

  if (selectedNodeIds.length < 2) return null

  // Check if the selection is a single group node (for ungroup)
  const isGroupSelected =
    selectedNodeIds.length === 1 &&
    nodes.find(n => n.id === selectedNodeIds[0])?.data.nodeType === 'group'

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
      {/* Selection count */}
      <span className="text-[10px] font-mono text-white/30 px-2">
        {selectedNodeIds.length} selectionne{selectedNodeIds.length > 1 ? 's' : ''}
      </span>

      <div className="w-px h-5 bg-white/[0.06]" />

      {/* Group */}
      <Tooltip label="Grouper" shortcut="Ctrl+G">
        <button
          type="button"
          onClick={groupSelectedNodes}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Group className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      {/* Ungroup (if group selected) */}
      {isGroupSelected && (
        <Tooltip label="Degrouper">
          <button
            type="button"
            onClick={() => ungroupNodes(selectedNodeIds[0])}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            <Ungroup className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      )}

      {/* Duplicate */}
      <Tooltip label="Dupliquer" shortcut="Ctrl+D">
        <button
          type="button"
          onClick={duplicateSelection}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-px h-5 bg-white/[0.06]" />

      {/* Color picker toggle */}
      <div className="relative">
        <Tooltip label="Couleur">
          <button
            type="button"
            onClick={() => setShowColors(!showColors)}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
              showColors
                ? 'text-white/70 bg-white/[0.06]'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
            )}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Color dropdown */}
        {showColors && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/[0.08] bg-[#0c0c14]/95 backdrop-blur-xl shadow-2xl shadow-black/60">
            {SELECTION_COLORS.map(color => (
              <button
                key={color.id}
                type="button"
                onClick={() => {
                  setSelectionColor(color.id)
                  setShowColors(false)
                }}
                title={color.label}
                className={cn(
                  'w-4 h-4 rounded-full transition-transform hover:scale-125',
                  color.dot
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Floating Execute Bar (top-right) ───────────────────────────────────────

// ─── Draw Toolbar (bottom-center, visible when draw tool active) ─────────────

const DRAW_COLORS = [
  { id: '#ffffff', dot: 'bg-white' },
  { id: '#a78bfa', dot: 'bg-violet-400' },
  { id: '#60a5fa', dot: 'bg-blue-400' },
  { id: '#34d399', dot: 'bg-emerald-400' },
  { id: '#fbbf24', dot: 'bg-amber-400' },
  { id: '#f87171', dot: 'bg-red-400' },
  { id: '#f472b6', dot: 'bg-pink-400' },
]

const DRAW_WIDTHS = [
  { id: 2, label: 'Fin' },
  { id: 4, label: 'Moyen' },
  { id: 8, label: 'Epais' },
]

function DrawToolbar() {
  const {
    activeTool,
    drawColor,
    drawStrokeWidth,
    setDrawColor,
    setDrawStrokeWidth,
    clearDrawings,
    drawingPaths,
  } = useWorkflowStore()

  if (activeTool !== 'draw') return null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
      {/* Color dots */}
      <div className="flex items-center gap-1.5">
        {DRAW_COLORS.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setDrawColor(c.id)}
            className={cn(
              'w-5 h-5 rounded-full transition-all',
              c.dot,
              drawColor === c.id
                ? 'scale-110 ring-2 ring-white/40 ring-offset-1 ring-offset-[#0c0c14]'
                : 'opacity-50 hover:opacity-80'
            )}
          />
        ))}
      </div>

      <div className="w-px h-5 bg-white/[0.06]" />

      {/* Stroke width */}
      <div className="flex items-center gap-1">
        {DRAW_WIDTHS.map(w => (
          <button
            key={w.id}
            type="button"
            onClick={() => setDrawStrokeWidth(w.id)}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
              drawStrokeWidth === w.id
                ? 'bg-white/[0.08] text-white'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
            )}
            title={w.label}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <line
                x1="2"
                y1="8"
                x2="14"
                y2="8"
                stroke="currentColor"
                strokeWidth={w.id}
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-white/[0.06]" />

      {/* Clear drawings */}
      <Tooltip label="Effacer les dessins">
        <button
          type="button"
          onClick={clearDrawings}
          disabled={drawingPaths.length === 0}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  )
}

// ─── Floating Execute Bar (top-right) ───────────────────────────────────────

function ExecuteBar({ onRun, isExecuting, totalCost, totalDuration, nodeCount }: ToolbarProps) {
  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-2 px-2 py-1.5 rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
      {/* Stats */}
      {totalCost > 0 && (
        <div className="flex items-center gap-2 px-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400/60 font-mono">
            <DollarSign className="w-3 h-3" />
            {totalCost.toFixed(3)}
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
              <Clock className="w-3 h-3" />
              {totalDuration.toFixed(1)}s
            </span>
          )}
        </div>
      )}

      {/* Run button */}
      <button
        type="button"
        onClick={onRun}
        disabled={isExecuting || nodeCount === 0}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
          isExecuting
            ? 'bg-violet-500/20 text-violet-400 cursor-wait'
            : 'bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/25 disabled:opacity-30 disabled:cursor-not-allowed'
        )}
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Execution...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Executer
          </>
        )}
      </button>
    </div>
  )
}

// ─── Context Menu (right-click) ─────────────────────────────────────────────

interface ContextMenuState {
  x: number
  y: number
  flowPosition: { x: number; y: number }
}

function ContextMenu({ menu, onClose }: { menu: ContextMenuState; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const {
    openNodePicker,
    addStickyNote,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    clearWorkflow,
    nodes,
    selectedNodeIds,
    groupSelectedNodes,
    duplicateSelection,
  } = useWorkflowStore()
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const hasMultiSelection = selectedNodeIds.length >= 2
  const hasSelection = selectedNodeIds.length >= 1

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items: Array<{
    label: string
    icon: typeof Plus
    shortcut?: string
    action: () => void
    danger?: boolean
    disabled?: boolean
    separator?: boolean
  }> = [
    {
      label: 'Ajouter un noeud',
      icon: Plus,
      shortcut: 'A',
      action: () => {
        openNodePicker(menu.flowPosition)
        onClose()
      },
    },
    {
      label: 'Ajouter une note',
      icon: StickyNote,
      shortcut: 'N',
      action: () => {
        addStickyNote(menu.flowPosition)
        onClose()
      },
    },
    {
      label: 'Coller',
      icon: Clipboard,
      shortcut: 'Ctrl+V',
      action: () => onClose(),
      disabled: true,
      separator: true,
    },
    {
      label: 'Dupliquer',
      icon: Copy,
      shortcut: 'Ctrl+D',
      action: () => {
        duplicateSelection()
        onClose()
      },
      disabled: !hasSelection,
    },
    {
      label: 'Grouper',
      icon: Group,
      shortcut: 'Ctrl+G',
      action: () => {
        groupSelectedNodes()
        onClose()
      },
      disabled: !hasMultiSelection,
      separator: true,
    },
    {
      label: 'Main (naviguer)',
      icon: Hand,
      shortcut: 'H',
      action: () => {
        setActiveTool('hand')
        onClose()
      },
    },
    {
      label: 'Selection',
      icon: MousePointer2,
      shortcut: 'V',
      action: () => {
        setActiveTool('select')
        onClose()
      },
    },
    {
      label: 'Couper connexion',
      icon: Scissors,
      shortcut: 'X',
      action: () => {
        setActiveTool('cut')
        onClose()
      },
    },
    {
      label: 'Connecter',
      icon: Link2,
      shortcut: 'C',
      action: () => {
        setActiveTool('connect')
        onClose()
      },
      separator: true,
    },
    {
      label: 'Zoom avant',
      icon: ZoomIn,
      shortcut: '+',
      action: () => {
        zoomIn()
        onClose()
      },
    },
    {
      label: 'Zoom arriere',
      icon: ZoomOut,
      shortcut: '-',
      action: () => {
        zoomOut()
        onClose()
      },
    },
    {
      label: 'Ajuster la vue',
      icon: Maximize2,
      action: () => {
        fitView({ padding: 0.2 })
        onClose()
      },
      separator: true,
    },
    {
      label: 'Annuler',
      icon: Undo2,
      shortcut: 'Ctrl+Z',
      action: () => {
        undo()
        onClose()
      },
      disabled: !canUndo,
    },
    {
      label: 'Retablir',
      icon: Redo2,
      shortcut: 'Ctrl+Y',
      action: () => {
        redo()
        onClose()
      },
      disabled: !canRedo,
      separator: true,
    },
    {
      label: 'Tout effacer',
      icon: Trash2,
      action: () => {
        clearWorkflow()
        onClose()
      },
      danger: true,
      disabled: nodes.length === 0,
    },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0c0c14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 py-1.5 overflow-hidden"
      style={{ left: menu.x, top: menu.y }}
    >
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={item.action}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                item.disabled
                  ? 'opacity-30 cursor-not-allowed'
                  : item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="text-[10px] font-mono text-white/20 ml-2">{item.shortcut}</kbd>
              )}
            </button>
            {item.separator && i < items.length - 1 && (
              <div className="h-px bg-white/[0.06] my-1 mx-2" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Settings Panel (Freepik Spaces style modal) ─────────────────────────────

const SETTINGS_TABS = [
  { id: 'general', label: 'General' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'execution', label: 'Execution' },
  { id: 'shortcuts', label: 'Raccourcis' },
] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]['id']

const SHORTCUTS = [
  { keys: 'A', action: 'Ajouter un noeud' },
  { keys: 'H', action: 'Outil Main (naviguer)' },
  { keys: 'V', action: 'Outil Selection' },
  { keys: 'X', action: 'Outil Couper connexion' },
  { keys: 'C', action: 'Outil Connecter' },
  { keys: 'D', action: 'Outil Dessiner' },
  { keys: 'N', action: 'Ajouter une note' },
  { keys: 'Ctrl+Z', action: 'Annuler' },
  { keys: 'Ctrl+Y', action: 'Retablir' },
  { keys: 'Ctrl+G', action: 'Grouper la selection' },
  { keys: 'Ctrl+D', action: 'Dupliquer la selection' },
  { keys: 'Double-clic', action: 'Ajouter un noeud (a la position)' },
  { keys: 'Clic droit', action: 'Menu contextuel' },
  { keys: 'Suppr / Backspace', action: 'Supprimer le noeud selectionne' },
]

function SettingsPanel() {
  const { showSettings, toggleSettings } = useWorkflowStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const panelRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    if (!showSettings) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleSettings()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSettings, toggleSettings])

  // Escape to close
  useEffect(() => {
    if (!showSettings) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleSettings()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showSettings, toggleSettings])

  if (!showSettings) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="w-[520px] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">Parametres</h2>
          <button
            type="button"
            onClick={toggleSettings}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-studio px-6 py-4">
          {activeTab === 'general' && <SettingsGeneral />}
          {activeTab === 'navigation' && <SettingsNavigation />}
          {activeTab === 'execution' && <SettingsExecution />}
          {activeTab === 'shortcuts' && <SettingsShortcuts />}
        </div>
      </div>
    </div>
  )
}

function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <span className="text-sm font-medium text-white/80">{label}</span>
        {description && (
          <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 w-9 h-5 rounded-full transition-colors',
          checked ? 'bg-violet-500' : 'bg-white/[0.08]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </button>
    </div>
  )
}

function SettingsGeneral() {
  const [showGrid, setShowGrid] = useState(true)
  const [showTooltips, setShowTooltips] = useState(true)
  const [experimental, setExperimental] = useState(false)

  return (
    <div className="divide-y divide-white/[0.06]">
      <SettingsToggle
        label="Reperes (grille)"
        description="Afficher la grille de points en arriere-plan du canvas"
        checked={showGrid}
        onChange={setShowGrid}
      />
      <SettingsToggle
        label="Infos detaillees sur les outils"
        description="Afficher les tooltips au survol des boutons de la barre d'outils"
        checked={showTooltips}
        onChange={setShowTooltips}
      />
      <SettingsToggle
        label="Outils experimentaux"
        description="Activer les fonctionnalites en cours de developpement"
        checked={experimental}
        onChange={setExperimental}
      />
    </div>
  )
}

function SettingsNavigation() {
  const [wheelMode, setWheelMode] = useState<'pan' | 'zoom'>('zoom')

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70 mb-3">Molette de la souris</h3>
      <div className="flex flex-col gap-2">
        {[
          {
            id: 'zoom' as const,
            label: 'Zoom avant / arriere',
            desc: 'Zoomer avec la molette (par defaut)',
          },
          {
            id: 'pan' as const,
            label: 'Deplacer le canvas',
            desc: 'Naviguer verticalement avec la molette',
          },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setWheelMode(opt.id)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-colors text-left',
              wheelMode === opt.id
                ? 'border-violet-500/40 bg-violet-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center',
                wheelMode === opt.id ? 'border-violet-500' : 'border-white/20'
              )}
            >
              {wheelMode === opt.id && <div className="w-2 h-2 rounded-full bg-violet-500" />}
            </div>
            <div>
              <span className="text-sm font-medium text-white/80">{opt.label}</span>
              <p className="text-[11px] text-white/30 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function SettingsExecution() {
  const [listMode, setListMode] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

  return (
    <div className="divide-y divide-white/[0.06]">
      <SettingsToggle
        label="Generations en mode liste"
        description="Afficher les resultats dans une liste au lieu d'un apercu inline"
        checked={listMode}
        onChange={setListMode}
      />
      <SettingsToggle
        label="Lecture automatique des videos"
        description="Lire automatiquement les previews video dans les noeuds"
        checked={autoPlay}
        onChange={setAutoPlay}
      />
    </div>
  )
}

function SettingsShortcuts() {
  return (
    <div className="space-y-1">
      {SHORTCUTS.map(s => (
        <div key={s.keys} className="flex items-center justify-between py-2">
          <span className="text-[12px] text-white/60">{s.action}</span>
          <kbd className="text-[11px] font-mono text-white/40 bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.08]">
            {s.keys}
          </kbd>
        </div>
      ))}
    </div>
  )
}

// ─── Inner Editor (must be inside ReactFlowProvider) ────────────────────────

function WorkflowEditorInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    selectedNodeId,
    selectNode,
    openNodePicker,
    isExecuting,
    setExecuting,
    updateNodeStatus,
    getTopologicalOrder,
    activeTool,
    addNode,
    addStickyNote,
    removeEdge,
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()
  const [totalCost, setTotalCost] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // ── Tool-dependent React Flow config ──────────────────────

  const isSelectMode = activeTool === 'select'

  // panOnDrag: only in hand mode (or non-select tools that aren't cut/note)
  // selectionOnDrag: only in select mode
  const panOnDrag = !isSelectMode
  const selectionOnDrag = isSelectMode

  // ── Execute Pipeline ────────────────────────────────────────

  const executePipeline = useCallback(async () => {
    const { nodes } = useWorkflowStore.getState()
    if (nodes.length === 0) return

    setExecuting(true)
    setTotalCost(0)
    setTotalDuration(0)

    // Reset all node statuses
    for (const node of nodes) {
      updateNodeStatus(node.id, 'idle', {
        outputUrls: undefined,
        error: undefined,
        cost: undefined,
        duration: undefined,
      })
    }

    const order = getTopologicalOrder()
    let accCost = 0
    let accDuration = 0

    // Results map: nodeId -> outputUrls
    const results = new Map<string, string[]>()

    for (const nodeId of order) {
      const currentState = useWorkflowStore.getState()
      const node = currentState.nodes.find(n => n.id === nodeId)
      if (!node) continue

      const data = node.data

      // Skip sticky notes and groups
      if (data.nodeType === 'sticky-note' || data.nodeType === 'group') continue

      // Mark as running
      updateNodeStatus(nodeId, 'running')

      try {
        // ── Source nodes: just pass through ──────────────────
        if (data.nodeType.startsWith('input-')) {
          if (data.nodeType === 'input-text') {
            results.set(nodeId, [(data.params.text as string) ?? ''])
          } else {
            const fileUrl = data.params.fileUrl as string | undefined
            if (fileUrl) {
              results.set(nodeId, [fileUrl])
            }
          }
          updateNodeStatus(nodeId, 'success', { outputUrls: results.get(nodeId) })
          continue
        }

        // ── Output node: collect from input ─────────────────
        if (data.nodeType === 'output') {
          const incomingEdge = currentState.edges.find(e => e.target === nodeId)
          if (incomingEdge) {
            const sourceOutput = results.get(incomingEdge.source)
            if (sourceOutput) {
              results.set(nodeId, sourceOutput)
              updateNodeStatus(nodeId, 'success', { outputUrls: sourceOutput })
            }
          }
          continue
        }

        // ── Assistant LLM node: call via llmApi ──────────────
        if (data.nodeType === 'assistant') {
          // Collect text inputs from connected nodes
          const incomingEdges = currentState.edges.filter(e => e.target === nodeId)
          let promptText = ''
          let contextText = ''

          for (const edge of incomingEdges) {
            const sourceOutput = results.get(edge.source)
            if (!sourceOutput?.length) continue
            if (edge.targetHandle === 'prompt') {
              promptText = sourceOutput[0]
            } else if (edge.targetHandle === 'context') {
              contextText = sourceOutput[0]
            }
          }

          // Fallback: use params if no connected prompt
          if (!promptText && data.params.prompt) {
            promptText = data.params.prompt as string
          }

          if (!promptText) {
            updateNodeStatus(nodeId, 'error', { error: 'Aucun prompt fourni' })
            continue
          }

          const modelId = (data.params.model as string) || 'openai/gpt-4o'
          const systemPrompt = (data.params.systemPrompt as string) || undefined
          const temperature = (data.params.temperature as number) || 0.7
          const maxTokens = (data.params.maxTokens as number) || 2048

          // Build final prompt with context
          const finalPrompt = contextText
            ? `Contexte:\n${contextText}\n\n---\n\n${promptText}`
            : promptText

          try {
            // Create temporary conversation
            const isGitHub = modelId.startsWith('github::')
            const actualModel = isGitHub ? modelId.slice(8) : modelId
            const conv = await llmApi.createConversation({
              model: actualModel,
              provider: isGitHub ? 'github' : 'openrouter',
              systemPrompt,
            })

            // Send message (non-streaming)
            const { message } = await llmApi.sendMessage(conv.id, {
              content: finalPrompt,
              model: actualModel,
              temperature,
              maxTokens,
            })

            const responseText = message.content
            results.set(nodeId, [responseText])

            const cost = message.cost ?? 0
            accCost += cost
            setTotalCost(accCost)

            updateNodeStatus(nodeId, 'success', {
              outputUrls: [responseText],
              cost,
              duration: (message.duration ?? 0) / 1000,
            })

            // Clean up temp conversation
            llmApi.deleteConversation(conv.id).catch(() => {})
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Erreur LLM inconnue'
            updateNodeStatus(nodeId, 'error', { error: errMsg })
          }
          continue
        }

        // ── AI nodes: call the API ──────────────────────────
        if (!data.model) {
          updateNodeStatus(nodeId, 'error', { error: 'Aucun modele selectionne' })
          continue
        }

        // Collect inputs from connected nodes
        const incomingEdges = currentState.edges.filter(e => e.target === nodeId)
        let promptText = ''
        const inputUrls: string[] = []

        for (const edge of incomingEdges) {
          const sourceNode = currentState.nodes.find(n => n.id === edge.source)
          const sourceOutput = results.get(edge.source)
          if (!sourceNode || !sourceOutput?.length) continue

          const targetHandle = edge.targetHandle
          if (targetHandle === 'prompt') {
            promptText = sourceOutput[0]
          } else {
            inputUrls.push(...sourceOutput)
          }
        }

        if (!promptText && data.params.prompt) {
          promptText = data.params.prompt as string
        }

        // Build payload
        const input: Record<string, unknown> = { ...data.params }
        delete input.prompt
        delete input.text
        delete input.fileUrl
        delete input.fileName
        delete input.file
        delete input.quantity

        const payload: RunModelPayload = {
          modelId: data.model.id,
          type: data.model.inputType,
          prompt: promptText || undefined,
          input,
          inputUrls: inputUrls.length > 0 ? inputUrls : undefined,
          provider: data.model.backend,
        }

        const result = await aiStudioApi.run(payload)

        if (result.generation.outputUrls?.length) {
          results.set(nodeId, result.generation.outputUrls)
          accCost += result.generation.cost ?? 0
          accDuration += result.generation.duration ?? 0
          setTotalCost(accCost)
          setTotalDuration(accDuration)

          updateNodeStatus(nodeId, 'success', {
            outputUrls: result.generation.outputUrls,
            cost: result.generation.cost,
            duration: result.generation.duration,
          })
        } else {
          updateNodeStatus(nodeId, 'error', { error: 'Pas de resultat' })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        updateNodeStatus(nodeId, 'error', { error: message })
      }
    }

    setExecuting(false)
  }, [getTopologicalOrder, setExecuting, updateNodeStatus])

  // ── Execute single node (triggered by CustomEvent from node Play buttons) ──

  const executeSingleNode = useCallback(
    async (nodeId: string) => {
      const state = useWorkflowStore.getState()
      const node = state.nodes.find(n => n.id === nodeId)
      if (!node) return

      const data = node.data
      if (data.nodeType === 'sticky-note' || data.nodeType === 'group') return

      updateNodeStatus(nodeId, 'running')

      // Gather results from upstream nodes
      const results = new Map<string, string[]>()
      for (const n of state.nodes) {
        if (n.data.outputUrls?.length) {
          results.set(n.id, n.data.outputUrls)
        }
        // For input-text source, use the text param
        if (n.data.nodeType === 'input-text') {
          results.set(n.id, [(n.data.params.text as string) ?? ''])
        }
      }

      try {
        // ── Source nodes ──
        if (data.nodeType.startsWith('input-')) {
          if (data.nodeType === 'input-text') {
            const text = (data.params.text as string) ?? ''
            updateNodeStatus(nodeId, 'success', { outputUrls: [text] })
          } else {
            const fileUrl = data.params.fileUrl as string | undefined
            if (fileUrl) {
              updateNodeStatus(nodeId, 'success', { outputUrls: [fileUrl] })
            } else {
              updateNodeStatus(nodeId, 'error', { error: 'Aucun fichier importe' })
            }
          }
          return
        }

        // ── Output node ──
        if (data.nodeType === 'output') {
          const incomingEdge = state.edges.find(e => e.target === nodeId)
          if (incomingEdge) {
            const sourceOutput = results.get(incomingEdge.source)
            if (sourceOutput) {
              updateNodeStatus(nodeId, 'success', { outputUrls: sourceOutput })
              return
            }
          }
          updateNodeStatus(nodeId, 'error', { error: 'Aucune entree connectee' })
          return
        }

        // ── Assistant LLM node ──
        if (data.nodeType === 'assistant') {
          const incomingEdges = state.edges.filter(e => e.target === nodeId)
          let promptText = ''
          let contextText = ''

          for (const edge of incomingEdges) {
            const sourceOutput = results.get(edge.source)
            if (!sourceOutput?.length) continue
            if (edge.targetHandle === 'prompt') promptText = sourceOutput[0]
            else if (edge.targetHandle === 'context') contextText = sourceOutput[0]
          }

          if (!promptText && data.params.prompt) promptText = data.params.prompt as string
          if (!promptText) {
            updateNodeStatus(nodeId, 'error', { error: 'Aucun prompt fourni' })
            return
          }

          const modelId = (data.params.model as string) || 'anthropic/claude-sonnet-4.5'
          const systemPrompt = (data.params.systemPrompt as string) || undefined
          const temperature = (data.params.temperature as number) || 0.7
          const maxTokens = (data.params.maxTokens as number) || 4096

          const finalPrompt = contextText
            ? `Contexte:\n${contextText}\n\n---\n\n${promptText}`
            : promptText

          const isGitHub = modelId.startsWith('github::')
          const actualModel = isGitHub ? modelId.slice(8) : modelId
          const conv = await llmApi.createConversation({
            model: actualModel,
            provider: isGitHub ? 'github' : 'openrouter',
            systemPrompt,
          })
          const { message } = await llmApi.sendMessage(conv.id, {
            content: finalPrompt,
            model: actualModel,
            temperature,
            maxTokens,
          })

          updateNodeStatus(nodeId, 'success', {
            outputUrls: [message.content],
            cost: message.cost ?? 0,
            duration: (message.duration ?? 0) / 1000,
          })

          llmApi.deleteConversation(conv.id).catch(() => {})
          return
        }

        // ── AI nodes (fal.ai / vectorizer / etc.) ──
        if (!data.model) {
          updateNodeStatus(nodeId, 'error', { error: 'Aucun modele selectionne' })
          return
        }

        const incomingEdges = state.edges.filter(e => e.target === nodeId)
        let promptText = ''
        const inputUrls: string[] = []

        for (const edge of incomingEdges) {
          const sourceOutput = results.get(edge.source)
          if (!sourceOutput?.length) continue
          if (edge.targetHandle === 'prompt') promptText = sourceOutput[0]
          else inputUrls.push(...sourceOutput)
        }

        if (!promptText && data.params.prompt) promptText = data.params.prompt as string

        const input: Record<string, unknown> = { ...data.params }
        delete input.prompt
        delete input.text
        delete input.fileUrl
        delete input.fileName
        delete input.file
        delete input.quantity

        const payload: RunModelPayload = {
          modelId: data.model.id,
          type: data.model.inputType,
          prompt: promptText || undefined,
          input,
          inputUrls: inputUrls.length > 0 ? inputUrls : undefined,
          provider: data.model.backend,
        }

        const result = await aiStudioApi.run(payload)

        if (result.generation.outputUrls?.length) {
          updateNodeStatus(nodeId, 'success', {
            outputUrls: result.generation.outputUrls,
            cost: result.generation.cost,
            duration: result.generation.duration,
          })
        } else {
          updateNodeStatus(nodeId, 'error', { error: 'Pas de resultat' })
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'
        updateNodeStatus(nodeId, 'error', { error: errMsg })
      }
    },
    [updateNodeStatus]
  )

  // ── Listen for per-node run events from node Play buttons ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { nodeId: string }
      if (detail?.nodeId) executeSingleNode(detail.nodeId)
    }
    document.addEventListener('workflow:run-node', handler)
    return () => document.removeEventListener('workflow:run-node', handler)
  }, [executeSingleNode])

  // ── Click on canvas background (deselect) ─────────────────

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      selectNode(null)
      setContextMenu(null)

      // Note mode: create sticky note at click position
      if (activeTool === 'note') {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        addStickyNote(position)
      }
    },
    [selectNode, activeTool, screenToFlowPosition, addStickyNote]
  )

  // ── Right-click context menu ──────────────────────────────

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setContextMenu({ x: event.clientX, y: event.clientY, flowPosition })
    },
    [screenToFlowPosition]
  )

  // ── Double click to add node ──────────────────────────────

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      openNodePicker(position)
    },
    [openNodePicker, screenToFlowPosition]
  )

  // ── Edge click handler (cut mode) ─────────────────────────

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      if (activeTool === 'cut') {
        removeEdge(edge.id)
      }
    },
    [activeTool, removeEdge]
  )

  // ── Welcome screen category click ─────────────────────────

  const handleCategoryClick = useCallback(
    (_categoryId: string, nodeType?: string) => {
      if (nodeType) {
        addNode(nodeType)
      } else {
        openNodePicker()
      }
    },
    [addNode, openNodePicker]
  )

  // ── Connection mode based on active tool ──────────────────

  const connectionMode = activeTool === 'connect'

  // ── Cursor class based on active tool ─────────────────────

  const cursorClass = useMemo(() => {
    switch (activeTool) {
      case 'hand':
        return 'cursor-grab'
      case 'select':
        return 'cursor-default'
      case 'cut':
        return 'cursor-crosshair'
      case 'note':
        return 'cursor-cell'
      default:
        return ''
    }
  }, [activeTool])

  return (
    <div className="relative w-full h-full" onContextMenu={onContextMenu}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onDoubleClick={onPaneDoubleClick}
        onEdgeClick={onEdgeClick}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={2}
        panOnDrag={panOnDrag}
        selectionOnDrag={selectionOnDrag}
        selectionMode={SelectionMode.Partial}
        connectOnClick={connectionMode}
        defaultEdgeOptions={{
          type: 'custom',
          animated: true,
          style: { stroke: 'rgba(52, 211, 153, 0.5)', strokeWidth: 2.5 },
        }}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{ stroke: 'rgba(52, 211, 153, 0.4)', strokeWidth: 2 }}
        edgesReconnectable={activeTool === 'hand' || activeTool === 'select'}
        proOptions={{ hideAttribution: true }}
        className={cn('!bg-transparent', cursorClass)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.03)"
        />

        <MiniMap
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            backgroundColor: '#0c0c14',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
          }}
          nodeColor={node => {
            if (node.type === 'sticky-note') return 'rgba(251, 191, 36, 0.4)'
            if (node.type === 'group') return 'rgba(139, 92, 246, 0.15)'
            return 'rgba(139, 92, 246, 0.4)'
          }}
        />
      </ReactFlow>

      {/* Drawing overlay (freehand annotations) */}
      <DrawingCanvas />

      {/* Welcome screen when empty */}
      {nodes.length === 0 && !isExecuting && (
        <WelcomeScreen onCategoryClick={handleCategoryClick} />
      )}

      {/* Node Picker overlay */}
      <NodePicker />

      {/* Left Vertical Toolbar */}
      <LeftToolbar nodeCount={nodes.length} />

      {/* Execute button (top-right) */}
      {nodes.length > 0 && (
        <ExecuteBar
          onRun={executePipeline}
          isExecuting={isExecuting}
          totalCost={totalCost}
          totalDuration={totalDuration}
          nodeCount={nodes.length}
        />
      )}

      {/* Right Properties Panel */}
      {selectedNodeId && (
        <div className="absolute right-0 top-0 bottom-0 w-72 border-l border-white/[0.06] bg-[#0c0c14]/95 backdrop-blur-xl z-30">
          <PropertiesPanel />
        </div>
      )}

      {/* Floating Selection Bar (bottom center) */}
      <SelectionBar />

      {/* Floating Draw Toolbar (bottom center, draw mode only) */}
      <DrawToolbar />

      {/* Right-click Context Menu */}
      {contextMenu && <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />}

      {/* Settings Panel (modal overlay) */}
      <SettingsPanel />
    </div>
  )
}

// ─── Main Export (wrapped in ReactFlowProvider) ─────────────────────────────

export function WorkflowEditor() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <WorkflowEditorInner />
      </ReactFlowProvider>
    </div>
  )
}
