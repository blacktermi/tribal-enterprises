/**
 * STUDIO LIBRARY - Galerie visuelle de toutes les creations IA
 * Design: Grille masonry avec lightbox, filtrage par type, infos au hover
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Image as ImageIcon,
  Video,
  Mic,
  Filter,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  ExternalLink,
  Search,
  Grid3X3,
  LayoutGrid,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { useHistory } from '../hooks/useAiStudio'
import { getModelById } from '../models/registry'
import type { AiGenerationRecord } from '../api/aiStudioApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryItem {
  url: string
  type: 'image' | 'video' | 'audio'
  generation: AiGenerationRecord
  index: number // index within generation's outputUrls
}

type MediaFilter = 'all' | 'image' | 'video' | 'audio'
type GridSize = 'small' | 'medium' | 'large'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyUrl(url: string, generationType: string): 'image' | 'video' | 'audio' {
  if (generationType.includes('video') || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return 'video'
  if (generationType.includes('audio') || /\.(mp3|wav|ogg|flac)(\?|$)/i.test(url)) return 'audio'
  return 'image'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `${diffMin}min`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioLibrary() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [gridSize, setGridSize] = useState<GridSize>('medium')
  const [searchQuery, setSearchQuery] = useState('')
  const [lightbox, setLightbox] = useState<{ item: LibraryItem; items: LibraryItem[] } | null>(null)

  // Fetch all completed generations with large limit
  const { data, isLoading } = useHistory({ page, limit: 50, status: 'completed' })

  // Flatten all outputs into individual library items
  const allItems = useMemo<LibraryItem[]>(() => {
    if (!data?.generations) return []
    const items: LibraryItem[] = []
    for (const gen of data.generations) {
      if (!gen.outputUrls?.length) continue
      gen.outputUrls.forEach((url, idx) => {
        const type = classifyUrl(url, gen.type)
        items.push({ url, type, generation: gen, index: idx })
      })
    }
    return items
  }, [data])

  // Apply filters
  const filteredItems = useMemo(() => {
    let items = allItems
    if (filter !== 'all') {
      items = items.filter(item => item.type === filter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(item => {
        const model = getModelById(item.generation.modelId)
        return (
          item.generation.prompt?.toLowerCase().includes(q) ||
          model?.name.toLowerCase().includes(q) ||
          item.generation.modelId.toLowerCase().includes(q)
        )
      })
    }
    return items
  }, [allItems, filter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const images = allItems.filter(i => i.type === 'image').length
    const videos = allItems.filter(i => i.type === 'video').length
    const audios = allItems.filter(i => i.type === 'audio').length
    return { total: allItems.length, images, videos, audios }
  }, [allItems])

  const totalPages = data?.pagination?.totalPages ?? 1

  const openLightbox = useCallback(
    (item: LibraryItem) => {
      setLightbox({ item, items: filteredItems })
    },
    [filteredItems]
  )

  const closeLightbox = useCallback(() => setLightbox(null), [])

  const navigateLightbox = useCallback(
    (direction: 1 | -1) => {
      if (!lightbox) return
      const { items, item } = lightbox
      const currentIdx = items.findIndex(i => i.url === item.url)
      const nextIdx = (currentIdx + direction + items.length) % items.length
      setLightbox({ item: items[nextIdx], items })
    },
    [lightbox]
  )

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') navigateLightbox(1)
      if (e.key === 'ArrowLeft') navigateLightbox(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, closeLightbox, navigateLightbox])

  const gridCols = {
    small: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8',
    medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }

  return (
    <div className="space-y-4">
      {/* ─── Header & Filters ──────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Stats bar */}
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold text-white/60">{stats.total}</span> creations
          </span>
          {stats.images > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> {stats.images}
            </span>
          )}
          {stats.videos > 0 && (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" /> {stats.videos}
            </span>
          )}
          {stats.audios > 0 && (
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3" /> {stats.audios}
            </span>
          )}
        </div>

        {/* Search + filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher par prompt, modele..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-tribal-accent/40 focus:border-tribal-accent/50"
            />
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-1">
            {(
              [
                { key: 'all', label: 'Tout', icon: Filter },
                { key: 'image', label: 'Images', icon: ImageIcon },
                { key: 'video', label: 'Videos', icon: Video },
                { key: 'audio', label: 'Audio', icon: Mic },
              ] as const
            ).map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  filter === f.key
                    ? 'bg-tribal-accent/20 text-tribal-accent ring-1 ring-tribal-accent/30'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                )}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid size toggle */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onClick={() => setGridSize('small')}
              title="Petite grille"
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                gridSize === 'small'
                  ? 'bg-white/[0.08] text-white/70'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setGridSize('medium')}
              title="Grille moyenne"
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                gridSize === 'medium'
                  ? 'bg-white/[0.08] text-white/70'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setGridSize('large')}
              title="Grande grille"
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                gridSize === 'large'
                  ? 'bg-white/[0.08] text-white/70'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Loading State ─────────────────────────────────── */}
      {isLoading && (
        <div className={cn('grid gap-2', gridCols[gridSize])}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ─── Empty State ───────────────────────────────────── */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
            <ImageIcon className="w-7 h-7 text-white/30" />
          </div>
          <p className="text-sm font-semibold text-white/60">
            {searchQuery || filter !== 'all'
              ? 'Aucun resultat pour ces filtres'
              : 'Votre bibliotheque est vide'}
          </p>
          <p className="text-xs text-white/30 mt-1.5 max-w-xs">
            {searchQuery || filter !== 'all'
              ? 'Essayez de modifier votre recherche ou vos filtres.'
              : 'Vos creations apparaitront ici une fois generees.'}
          </p>
        </div>
      )}

      {/* ─── Gallery Grid ──────────────────────────────────── */}
      {!isLoading && filteredItems.length > 0 && (
        <div className={cn('grid gap-2', gridCols[gridSize])}>
          {filteredItems.map(item => (
            <GalleryCard
              key={`${item.generation.id}-${item.index}`}
              item={item}
              onClick={() => openLightbox(item)}
              size={gridSize}
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ────────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <p className="text-xs text-white/40">
            Page {page} sur {totalPages}
            {data?.pagination && (
              <span className="ml-1">({data.pagination.total} generations)</span>
            )}
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
                    'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
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

      {/* ─── Lightbox ──────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            item={lightbox.item}
            items={lightbox.items}
            onClose={closeLightbox}
            onNavigate={navigateLightbox}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onClick,
  size,
}: {
  item: LibraryItem
  onClick: () => void
  size: GridSize
}) {
  const model = useMemo(() => getModelById(item.generation.modelId), [item.generation.modelId])
  const [loaded, setLoaded] = useState(false)

  if (item.type === 'audio') {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-tribal-accent/10 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-tribal-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/80 truncate">
              {model?.name ?? item.generation.modelId}
            </p>
            <p className="text-[10px] text-white/40">
              {formatRelativeTime(item.generation.createdAt)}
            </p>
          </div>
        </div>
        <audio src={item.url} controls className="w-full h-8" preload="metadata" />
        {item.generation.prompt && (
          <p className="text-[10px] text-white/30 truncate">{item.generation.prompt}</p>
        )}
      </div>
    )
  }

  if (item.type === 'video') {
    return (
      <div
        className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-black cursor-pointer"
        onClick={onClick}
      >
        <video
          src={item.url}
          className="w-full object-contain"
          preload="metadata"
          muted
          onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
          onMouseLeave={e => {
            const v = e.target as HTMLVideoElement
            v.pause()
            v.currentTime = 0
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-[11px] font-semibold text-white truncate">
              {model?.name ?? item.generation.modelId}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-white/50 flex items-center gap-1">
                <Video className="w-3 h-3" /> Video
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                ${item.generation.cost.toFixed(3)}
              </span>
              <span className="text-[10px] text-white/40">
                {formatRelativeTime(item.generation.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Image
  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] cursor-pointer"
      onClick={onClick}
    >
      {!loaded && <div className="aspect-square bg-white/[0.03] animate-pulse" />}
      <img
        src={item.url}
        alt={item.generation.prompt || ''}
        className={cn(
          'w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]',
          !loaded && 'absolute opacity-0'
        )}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-[11px] font-semibold text-white truncate">
            {model?.name ?? item.generation.modelId}
          </p>
          {item.generation.prompt && size !== 'small' && (
            <p className="text-[10px] text-white/50 truncate mt-0.5">{item.generation.prompt}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-white/50 font-mono">
              ${item.generation.cost.toFixed(3)}
            </span>
            <span className="text-[10px] text-white/40">
              {formatRelativeTime(item.generation.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  item,
  items,
  onClose,
  onNavigate,
}: {
  item: LibraryItem
  items: LibraryItem[]
  onClose: () => void
  onNavigate: (direction: 1 | -1) => void
}) {
  const model = useMemo(() => getModelById(item.generation.modelId), [item.generation.modelId])
  const currentIdx = items.findIndex(i => i.url === item.url)
  const backdropRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(item.url)
      const blob = await response.blob()
      const ext = item.type === 'video' ? 'mp4' : item.type === 'audio' ? 'mp3' : 'png'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `tribal-studio-${item.generation.id}-${item.index}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(item.url, '_blank')
    }
  }, [item])

  return (
    <motion.div
      ref={backdropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={e => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="flex flex-col items-center max-w-[85vw] max-h-[85vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.url}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="max-w-[85vw] max-h-[70vh] rounded-xl"
              />
            ) : item.type === 'audio' ? (
              <div className="bg-white/[0.06] rounded-xl p-8 min-w-[400px]">
                <audio src={item.url} controls autoPlay className="w-full" />
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.generation.prompt || ''}
                className="max-w-[85vw] max-h-[70vh] object-contain rounded-xl"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Info bar below */}
        <div className="mt-4 flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.06] backdrop-blur-sm max-w-full">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {model?.name ?? item.generation.modelId}
            </p>
            {item.generation.prompt && (
              <p className="text-xs text-white/40 truncate mt-0.5 max-w-lg">
                {item.generation.prompt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-white/40">
            <span className="font-mono">${item.generation.cost.toFixed(3)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.generation.createdAt)}
            </span>
            {items.length > 1 && (
              <span className="text-white/30">
                {currentIdx + 1}/{items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/70 hover:text-white transition-colors"
              title="Telecharger"
            >
              <Download className="w-4 h-4" />
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/70 hover:text-white transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
