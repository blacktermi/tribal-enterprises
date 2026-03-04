import { useState, useMemo, useCallback } from 'react'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Mic,
  Box,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { useHistory } from '../hooks/useAiStudio'
import { getModelById } from '../models/registry'
import type { AiGenerationRecord } from '../api/aiStudioApi'

interface GenerationHistoryProps {
  compact?: boolean
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    color: string
    bgColor: string
    icon: typeof CheckCircle2
    pulse?: boolean
  }
> = {
  completed: {
    label: 'Termine',
    color: 'text-tribal-accent',
    bgColor: 'bg-tribal-accent/10',
    icon: CheckCircle2,
  },
  processing: {
    label: 'En cours',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    icon: Loader2,
    pulse: true,
  },
  failed: {
    label: 'Echoue',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    icon: XCircle,
  },
  pending: {
    label: 'En attente',
    color: 'text-white/40',
    bgColor: 'bg-white/[0.06]',
    icon: Clock,
  },
}

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'text-to-image', label: 'Texte → Image' },
  { value: 'image-to-image', label: 'Image → Image' },
  { value: 'text-to-video', label: 'Texte → Video' },
  { value: 'image-to-video', label: 'Image → Video' },
  { value: 'image-upscale', label: 'Upscale' },
  { value: 'image-remove-bg', label: 'Suppr. Fond' },
  { value: 'text-to-audio', label: 'Texte → Audio' },
  { value: 'image-to-3d', label: 'Image → 3D' },
]

function getTypeIcon(type: string) {
  if (type.includes('video')) return Video
  if (type.includes('audio')) return Mic
  if (type.includes('3d')) return Box
  return ImageIcon
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "A l'instant"
  if (diffMin < 60) return `Il y a ${diffMin}min`
  if (diffHour < 24) return `Il y a ${diffHour}h`
  if (diffDay < 7) return `Il y a ${diffDay}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
        config.bgColor,
        config.color
      )}
    >
      <Icon className={cn('w-3 h-3', config.pulse && 'animate-spin')} />
      {config.label}
    </span>
  )
}

export function GenerationHistory({ compact = false }: GenerationHistoryProps) {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const limit = compact ? 5 : 10

  const { data, isLoading, isError } = useHistory({
    page,
    limit,
    type: typeFilter || undefined,
  })

  const generations = data?.generations ?? []
  const pagination = data?.pagination

  const totalPages = pagination?.totalPages ?? 1

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {!compact && <FilterBar typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />}
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
          >
            {!compact && <div className="w-12 h-12 rounded-lg bg-white/[0.08] shrink-0" />}
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-white/[0.08]" />
              <div className="h-3 w-48 rounded bg-white/[0.08]" />
            </div>
            <div className="h-5 w-16 rounded-full bg-white/[0.08]" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-red-900/20 border border-red-800/50">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-sm font-semibold text-red-400">Erreur de chargement</p>
        <p className="text-xs text-red-400/80 mt-1">
          Impossible de charger l&apos;historique des generations.
        </p>
      </div>
    )
  }

  // Empty state
  if (generations.length === 0) {
    return (
      <div className="space-y-3">
        {!compact && <FilterBar typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-sm font-semibold text-white/70">Aucune generation pour le moment</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs">
            Vos generations apparaitront ici une fois que vous aurez utilise un modele.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!compact && <FilterBar typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />}

      {/* Generation list */}
      <div className="space-y-2">
        {generations.map(gen => (
          <GenerationItem
            key={gen.id}
            generation={gen}
            compact={compact}
            isExpanded={expandedId === gen.id}
            onToggle={() => toggleExpand(gen.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {!compact && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/40">
            Page {page} sur {totalPages}
            {pagination && <span className="ml-1">({pagination.total} resultats)</span>}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                page <= 1
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/50 hover:bg-white/[0.06]'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200',
                    page === pageNum
                      ? 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20'
                      : 'text-white/50 hover:bg-white/[0.06]'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                page >= totalPages
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/50 hover:bg-white/[0.06]'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  typeFilter: string
  onTypeFilterChange: (value: string) => void
}

function FilterBar({ typeFilter, onTypeFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-white/40" />
      <select
        value={typeFilter}
        onChange={e => onTypeFilterChange(e.target.value)}
        className={cn(
          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
          'bg-white/[0.04] border-white/[0.08]',
          'text-white/70',
          'focus:outline-none focus:ring-2 focus:ring-tribal-accent/40 focus:border-tribal-accent/50',
          'appearance-none pr-8 bg-no-repeat bg-right'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.4rem center',
          backgroundSize: '1.2em 1.2em',
        }}
      >
        {TYPE_FILTER_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Generation Item ──────────────────────────────────────────────────────────

interface GenerationItemProps {
  generation: AiGenerationRecord
  compact: boolean
  isExpanded: boolean
  onToggle: () => void
}

function GenerationItem({ generation, compact, isExpanded, onToggle }: GenerationItemProps) {
  const model = useMemo(() => getModelById(generation.modelId), [generation.modelId])
  const TypeIcon = getTypeIcon(generation.type)
  const thumbnailUrl = generation.outputUrls?.[0] ?? null
  const hasMultipleOutputs = (generation.outputUrls?.length ?? 0) > 1
  const isImage =
    !generation.type.includes('video') &&
    !generation.type.includes('audio') &&
    !generation.type.includes('3d')

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        'bg-white/[0.03] border-white/[0.06]',
        isExpanded && 'ring-1 ring-tribal-accent/30 border-tribal-accent/30'
      )}
    >
      {/* Main row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Thumbnail - only in non-compact mode */}
        {!compact && (
          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white/[0.06] flex items-center justify-center">
            {thumbnailUrl && isImage ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <TypeIcon className="w-5 h-5 text-white/40" />
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold text-white truncate">
              {model?.name ?? generation.modelId}
            </span>
            {hasMultipleOutputs && (
              <span className="shrink-0 text-[10px] font-semibold text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded">
                x{generation.outputUrls?.length}
              </span>
            )}
          </div>
          {generation.prompt && (
            <p className="text-[11px] text-white/40 truncate max-w-xs">{generation.prompt}</p>
          )}
        </div>

        {/* Right side info */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <StatusBadge status={generation.status} />
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span className="font-mono">${generation.cost.toFixed(3)}</span>
            <span>{formatRelativeTime(generation.createdAt)}</span>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="shrink-0 ml-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-white/[0.06] space-y-3">
              {/* Full prompt */}
              {generation.prompt && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">
                    Prompt
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed bg-white/[0.04] rounded-lg p-2.5">
                    {generation.prompt}
                  </p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <DetailCell label="Modele" value={model?.name ?? generation.modelId} />
                <DetailCell label="Type" value={generation.type} />
                <DetailCell label="Cout" value={`$${generation.cost.toFixed(4)}`} />
                <DetailCell
                  label="Duree"
                  value={generation.duration ? `${(generation.duration / 1000).toFixed(1)}s` : '-'}
                />
              </div>

              {/* Error message */}
              {generation.error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-900/20 border border-red-800/50">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{generation.error}</p>
                </div>
              )}

              {/* All outputs */}
              {generation.outputUrls && generation.outputUrls.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Resultats ({generation.outputUrls.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {generation.outputUrls.map((url, idx) => {
                      const isVideoOutput =
                        generation.type.includes('video') || url.match(/\.(mp4|webm|mov)(\?|$)/i)
                      const isAudioOutput =
                        generation.type.includes('audio') || url.match(/\.(mp3|wav|ogg)(\?|$)/i)

                      if (isVideoOutput) {
                        return (
                          <div
                            key={url}
                            className="rounded-lg overflow-hidden border border-white/[0.06] bg-black"
                          >
                            <video src={url} controls className="w-full" preload="metadata" />
                          </div>
                        )
                      }

                      if (isAudioOutput) {
                        return (
                          <div
                            key={url}
                            className="col-span-full rounded-lg border border-white/[0.06] p-2 bg-white/[0.03]"
                          >
                            <audio src={url} controls className="w-full" preload="metadata" />
                          </div>
                        )
                      }

                      return (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-white/[0.06] hover:ring-2 hover:ring-tribal-accent/50 transition-all"
                        >
                          <img
                            src={url}
                            alt={`Output ${idx + 1}`}
                            className="w-full object-contain"
                            loading="lazy"
                          />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Input images */}
              {generation.inputUrls && generation.inputUrls.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Images source ({generation.inputUrls.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {generation.inputUrls.map(url => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 rounded-lg overflow-hidden border border-white/[0.06] hover:ring-2 hover:ring-tribal-accent/50 transition-all"
                      >
                        <img
                          src={url}
                          alt="Input"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Detail Cell ──────────────────────────────────────────────────────────────

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-white/[0.04]">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs font-medium text-white/70 truncate" title={value}>
        {value}
      </p>
    </div>
  )
}
