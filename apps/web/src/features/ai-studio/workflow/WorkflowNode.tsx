/**
 * WORKFLOW NODE - Custom React Flow node (Freepik Spaces style)
 * Large cards with preview zone, floating toolbar, icon handles, bottom controls
 */

import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
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
  Repeat,
  PenTool,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Bot,
  MoreHorizontal,
  GitBranch,
  ChevronDown,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useWorkflowStore } from './store'
import type { WorkflowNode, WorkflowNodeData, PortType } from './types'

// ─── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof ImageIcon> = {
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
  Sparkles,
}

// ─── Port type to icon ──────────────────────────────────────────────────────

const PORT_TYPE_ICON: Record<PortType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  audio: Mic,
  text: Type,
  any: Box,
}

// ─── Port colors ────────────────────────────────────────────────────────────

const PORT_COLORS: Record<PortType, string> = {
  image: '#a78bfa', // violet-400
  video: '#60a5fa', // blue-400
  audio: '#f59e0b', // amber-500
  text: '#34d399', // emerald-400
  any: '#94a3b8', // slate-400
}

// ─── Category colors ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<
  string,
  { accent: string; accentBg: string; icon: string; label: string }
> = {
  sources: {
    accent: 'border-emerald-500/40',
    accentBg: 'bg-emerald-500/8',
    icon: 'text-emerald-400',
    label: 'text-emerald-300',
  },
  generation: {
    accent: 'border-violet-500/40',
    accentBg: 'bg-violet-500/8',
    icon: 'text-violet-400',
    label: 'text-violet-300',
  },
  transformation: {
    accent: 'border-blue-500/40',
    accentBg: 'bg-blue-500/8',
    icon: 'text-blue-400',
    label: 'text-blue-300',
  },
  tools: {
    accent: 'border-amber-500/40',
    accentBg: 'bg-amber-500/8',
    icon: 'text-amber-400',
    label: 'text-amber-300',
  },
  output: {
    accent: 'border-cyan-500/40',
    accentBg: 'bg-cyan-500/8',
    icon: 'text-cyan-400',
    label: 'text-cyan-300',
  },
  assistant: {
    accent: 'border-pink-500/40',
    accentBg: 'bg-pink-500/8',
    icon: 'text-pink-400',
    label: 'text-pink-300',
  },
}

// ─── Highlight color map (user-assigned color tag) ──────────────────────────

const HIGHLIGHT_BORDER: Record<string, string> = {
  red: 'ring-2 ring-red-500/50',
  orange: 'ring-2 ring-amber-500/50',
  yellow: 'ring-2 ring-yellow-400/50',
  green: 'ring-2 ring-emerald-500/50',
  blue: 'ring-2 ring-blue-500/50',
  purple: 'ring-2 ring-violet-500/50',
  pink: 'ring-2 ring-pink-500/50',
}

function getCategoryFromNodeType(nodeType: string): string {
  if (nodeType.startsWith('input-')) return 'sources'
  if (nodeType === 'output') return 'output'
  if (nodeType === 'assistant') return 'assistant'
  if (['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-3d'].includes(nodeType))
    return 'generation'
  if (['image-to-image', 'image-to-video', 'video-to-video'].includes(nodeType))
    return 'transformation'
  return 'tools'
}

function getTemplateIcon(nodeType: string): string {
  const map: Record<string, string> = {
    'input-image': 'Image',
    'input-video': 'Video',
    'input-audio': 'Mic',
    'input-text': 'Type',
    'text-to-image': 'ImagePlus',
    'text-to-video': 'Film',
    'text-to-audio': 'Music',
    'text-to-3d': 'Box',
    'image-to-image': 'Wand2',
    'image-to-video': 'Play',
    'video-to-video': 'Film',
    upscale: 'ArrowUpRight',
    'remove-bg': 'Eraser',
    'face-swap': 'Repeat',
    vectorize: 'PenTool',
    output: 'Download',
    assistant: 'Bot',
  }
  return map[nodeType] ?? 'Box'
}

// ─── Floating Action Toolbar (above node) ────────────────────────────────────

function NodeToolbar({
  nodeId,
  status,
  selected,
}: {
  nodeId: string
  status: string
  selected: boolean
}) {
  const { removeNode, duplicateNode } = useWorkflowStore()

  return (
    <div
      className={cn(
        'absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-[#14141f]/90 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/40 transition-all duration-200 z-10',
        selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      )}
    >
      {/* Status / Play */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-white/[0.08]">
        {status === 'running' ? (
          <div className="p-1.5">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          </div>
        ) : status === 'success' ? (
          <div className="p-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : status === 'error' ? (
          <div className="p-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
        ) : (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              document.dispatchEvent(new CustomEvent('workflow:run-node', { detail: { nodeId } }))
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className="w-3 h-3 text-white/20" />
      </div>

      {/* Duplicate */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          duplicateNode(nodeId)
        }}
        className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        title="Dupliquer"
      >
        <GitBranch className="w-3.5 h-3.5" />
      </button>
      <ChevronDown className="w-2.5 h-2.5 text-white/15" />

      {/* Delete */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          removeNode(nodeId)
        }}
        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="Supprimer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* More */}
      <button
        type="button"
        className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Icon Handle (port as icon button on side) ──────────────────────────────

function IconHandle({
  port,
  type,
  position,
  index,
  total,
}: {
  port: { id: string; type: PortType; label: string }
  type: 'source' | 'target'
  position: Position
  index: number
  total: number
}) {
  const PortIcon = PORT_TYPE_ICON[port.type] ?? Box
  const color = PORT_COLORS[port.type]
  const offset = ((index + 1) / (total + 1)) * 100

  return (
    <>
      {/* The real Handle — positioned by ReactFlow at the correct offset */}
      <Handle
        type={type}
        position={position}
        id={port.id}
        className="!w-9 !h-9 !rounded-full !border-2 !bg-[#14141f] hover:!bg-[#1a1a2e] !transition-all !duration-200"
        style={{
          borderColor: color + '60',
          top: `${offset}%`,
        }}
      />
      {/* Visual icon overlay — purely decorative, not interactive */}
      <div
        className="absolute z-10 pointer-events-none flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          top: `${offset}%`,
          transform: 'translateY(-50%)',
          ...(position === Position.Left ? { left: -18 } : { right: -18 }),
        }}
      >
        <PortIcon className="w-3.5 h-3.5" style={{ color: color + 'cc' }} />
      </div>
    </>
  )
}

// ─── Preview Content (center zone) ──────────────────────────────────────────

function NodeContent({ data }: { data: WorkflowNodeData }) {
  const { nodeType, outputUrls, status, params } = data

  // Assistant node: show text content
  if (nodeType === 'assistant') {
    const responseText = outputUrls?.[0]
    return (
      <div className="flex-1 flex flex-col">
        {responseText ? (
          <div className="flex-1 p-3 text-xs text-white/60 leading-relaxed overflow-y-auto scrollbar-studio">
            {responseText}
          </div>
        ) : (
          <div className="flex-1 flex items-start p-3">
            <p className="text-xs text-white/25 leading-relaxed">
              L'Assistant est votre allie creatif, propulse par un puissant modele de langage. Vous
              pouvez saisir un prompt, ou meme ajouter des images pour donner du contexte. Il
              comprend ce que vous voulez dire, enrichit vos idees et vous aide a avancer plus
              rapidement.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Input text node
  if (nodeType === 'input-text') {
    const text = (params.text as string) ?? ''
    return (
      <div className="flex-1 p-3">
        <div className="w-full h-full min-h-[60px] rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-xs text-white/40 leading-relaxed">
            {text || 'Essayez \u00ab Chien heureux avec des lunettes de soleil et une bouee \u00bb'}
          </p>
        </div>
      </div>
    )
  }

  // Nodes with output preview
  if (outputUrls?.length) {
    const url = outputUrls[0]
    const isVideo = nodeType.includes('video') || url.match(/\.(mp4|webm|mov)/)
    const isAudio = nodeType.includes('audio') || url.match(/\.(mp3|wav|ogg)/)

    if (isAudio) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <audio src={url} controls className="w-full opacity-70" />
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="flex-1 p-2">
          <video
            src={url}
            className="w-full h-full rounded-lg object-cover bg-black/40"
            muted
            loop
            autoPlay
            playsInline
          />
        </div>
      )
    }

    return (
      <div className="flex-1 p-2">
        <img src={url} alt="" className="w-full h-full rounded-lg object-cover bg-black/40" />
      </div>
    )
  }

  // Running state
  if (status === 'running') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
      </div>
    )
  }

  // Generation nodes: prompt placeholder
  if (
    ['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-3d'].includes(nodeType) ||
    ['image-to-image', 'image-to-video', 'video-to-video'].includes(nodeType)
  ) {
    return (
      <div className="flex-1 flex flex-col justify-end p-3">
        <p className="text-xs text-white/20">Prompt (connecte)</p>
      </div>
    )
  }

  // Upscale / tools: empty zone
  if (['upscale', 'remove-bg', 'face-swap', 'vectorize'].includes(nodeType)) {
    return <div className="flex-1" />
  }

  // Output node
  if (nodeType === 'output') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Download className="w-8 h-8 text-white/10" />
      </div>
    )
  }

  // Default / source image/video/audio without output yet
  return <div className="flex-1" />
}

// ─── Bottom Controls Bar ────────────────────────────────────────────────────

function BottomControls({ data, nodeId }: { data: WorkflowNodeData; nodeId: string }) {
  const { nodeType } = data
  const { updateNodeData, selectNode } = useWorkflowStore()

  const quantity = (data.params.quantity as number) ?? 1

  // Open properties panel = select the node
  const openSettings = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectNode(nodeId)
  }

  // Copy output text to clipboard
  const exportText = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.outputUrls?.[0]) {
      navigator.clipboard.writeText(data.outputUrls[0])
    }
  }

  // Assistant: model selector + export
  if (nodeType === 'assistant') {
    const model = (data.params.model as string) ?? 'anthropic/claude-sonnet-4.5'
    const modelLabel = model.split('/').pop()?.replace(/-/g, ' ') ?? model
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-[10px] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-colors capitalize"
        >
          {modelLabel}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportText}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-[10px] transition-colors',
            data.outputUrls?.[0]
              ? 'text-white/50 hover:bg-white/[0.1] hover:text-white/70'
              : 'text-white/20 cursor-not-allowed'
          )}
          disabled={!data.outputUrls?.[0]}
        >
          Exporter comme texte
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            document.dispatchEvent(new CustomEvent('workflow:run-node', { detail: { nodeId } }))
          }}
          disabled={data.status === 'running'}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            data.status === 'running'
              ? 'bg-violet-500/20 text-violet-400'
              : 'bg-white/[0.08] text-white/50 hover:bg-white/[0.15] hover:text-white'
          )}
        >
          {data.status === 'running' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>
    )
  }

  // Generation nodes: quantity + size + model + settings + play
  if (
    ['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-3d'].includes(nodeType) ||
    ['image-to-image', 'image-to-video', 'video-to-video'].includes(nodeType)
  ) {
    const modelName = data.model?.name?.split(' ').slice(0, 2).join(' ') ?? 'Auto'

    // Image size from params
    const imageSize = (data.params.image_size as string) ?? 'Auto'
    const sizeLabel =
      imageSize === 'landscape_16_9'
        ? '16:9'
        : imageSize === 'portrait_9_16'
          ? '9:16'
          : imageSize === 'square'
            ? '1:1'
            : imageSize === 'square_hd'
              ? '1:1 HD'
              : imageSize === 'landscape_4_3'
                ? '4:3'
                : imageSize === 'portrait_3_4'
                  ? '3:4'
                  : 'Auto'

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/[0.04] flex-wrap">
        {/* Quantity */}
        <div className="flex items-center rounded-full bg-white/[0.06] overflow-hidden">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              if (quantity > 1)
                updateNodeData(nodeId, {
                  params: { ...data.params, quantity: quantity - 1 },
                })
            }}
            className="px-1.5 py-1 text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            &minus;
          </button>
          <span className="text-[10px] font-medium text-white/60 px-1">x{quantity}</span>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              if (quantity < 8)
                updateNodeData(nodeId, {
                  params: { ...data.params, quantity: quantity + 1 },
                })
            }}
            className="px-1.5 py-1 text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            +
          </button>
        </div>

        {/* Model (opens properties panel) */}
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-[10px] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-colors"
        >
          {modelName}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        {/* Size (for image/video) */}
        {(nodeType.includes('image') || nodeType.includes('video')) && (
          <button
            type="button"
            onClick={openSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-[10px] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-colors"
          >
            {sizeLabel}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        )}

        {/* Settings */}
        <button
          type="button"
          onClick={openSettings}
          className="p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>

        <div className="flex-1" />

        {/* Play */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            document.dispatchEvent(new CustomEvent('workflow:run-node', { detail: { nodeId } }))
          }}
          disabled={data.status === 'running'}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            data.status === 'running'
              ? 'bg-violet-500/20 text-violet-400'
              : 'bg-white/[0.08] text-white/50 hover:bg-white/[0.15] hover:text-white'
          )}
        >
          {data.status === 'running' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>
    )
  }

  // Upscale / tools
  if (['upscale', 'remove-bg', 'face-swap', 'vectorize'].includes(nodeType)) {
    const modelName = data.model?.name?.split(' ').slice(0, 3).join(' ') ?? 'Auto'
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/[0.04] flex-wrap">
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] text-[10px] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-colors"
        >
          {modelName}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            document.dispatchEvent(new CustomEvent('workflow:run-node', { detail: { nodeId } }))
          }}
          disabled={data.status === 'running'}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            data.status === 'running'
              ? 'bg-violet-500/20 text-violet-400'
              : 'bg-white/[0.08] text-white/50 hover:bg-white/[0.15] hover:text-white'
          )}
        >
          {data.status === 'running' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>
    )
  }

  // No controls for source/output
  return null
}

// ─── Main Node Component ────────────────────────────────────────────────────

function WorkflowNodeComponent({ id, data, selected }: NodeProps<WorkflowNode>) {
  const nodeData = data as WorkflowNodeData
  const { selectNode } = useWorkflowStore()

  const category = useMemo(() => getCategoryFromNodeType(nodeData.nodeType), [nodeData.nodeType])
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.tools
  const highlightColor = (nodeData as WorkflowNodeData & { highlightColor?: string }).highlightColor
  const iconName = useMemo(() => getTemplateIcon(nodeData.nodeType), [nodeData.nodeType])
  const Icon = ICON_MAP[iconName] ?? Box

  // Node width depends on type
  const isLargeNode =
    nodeData.nodeType === 'assistant' ||
    ['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-3d'].includes(nodeData.nodeType) ||
    ['image-to-image', 'image-to-video', 'video-to-video'].includes(nodeData.nodeType) ||
    ['upscale', 'remove-bg', 'face-swap', 'vectorize'].includes(nodeData.nodeType)

  return (
    <div
      className={cn('relative', isLargeNode ? 'w-[380px]' : 'w-[280px]')}
      onClick={() => selectNode(id)}
    >
      {/* Floating toolbar (above node) */}
      <NodeToolbar nodeId={id} status={nodeData.status} selected={!!selected} />

      {/* Node title (above card) */}
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
        <span className={cn('text-[11px] font-medium', colors.label)}>{nodeData.label}</span>
        {nodeData.status === 'success' && nodeData.cost != null && (
          <span className="text-[9px] text-emerald-400/50 font-mono ml-auto">
            ${nodeData.cost.toFixed(3)}
          </span>
        )}
      </div>

      {/* Main card */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border-2 transition-all duration-200',
          'bg-[#0e0e18]',
          selected ? 'border-blue-500/60 shadow-lg shadow-blue-500/10' : 'border-white/[0.06]',
          nodeData.status === 'running' && 'border-violet-500/40',
          nodeData.status === 'error' && 'border-red-500/40',
          highlightColor && HIGHLIGHT_BORDER[highlightColor]
        )}
      >
        {/* Content zone */}
        <div className={cn('flex flex-col', isLargeNode ? 'min-h-[220px]' : 'min-h-[120px]')}>
          <NodeContent data={nodeData} />
        </div>

        {/* Error message */}
        {nodeData.status === 'error' && nodeData.error && (
          <div className="px-3 py-2 bg-red-500/5 border-t border-red-500/10">
            <span className="text-[10px] text-red-400/70 line-clamp-2">{nodeData.error}</span>
          </div>
        )}

        {/* Bottom controls */}
        <BottomControls data={nodeData} nodeId={id} />
      </div>

      {/* Input Handles (left side, icon style) */}
      {nodeData.inputs.map((port, i) => (
        <IconHandle
          key={port.id}
          port={port}
          type="target"
          position={Position.Left}
          index={i}
          total={nodeData.inputs.length}
        />
      ))}

      {/* Output Handles (right side, icon style) */}
      {nodeData.outputs.map((port, i) => (
        <IconHandle
          key={port.id}
          port={port}
          type="source"
          position={Position.Right}
          index={i}
          total={nodeData.outputs.length}
        />
      ))}
    </div>
  )
}

export default memo(WorkflowNodeComponent)
