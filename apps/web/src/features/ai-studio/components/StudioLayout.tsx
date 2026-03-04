/**
 * STUDIO LAYOUT - Layout premium dark avec sidebar collapsible + header sticky
 * Design: Studio de production IA professionnel (style Runway/Linear)
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Film,
  Mic,
  Music,
  Box,
  ArrowUpRight,
  Eraser,
  PenTool,
  Repeat,
  User,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
  Home,
  Wrench,
  FolderOpen,
  GitBranch,
  Palette,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { CreditsBadge } from './CreditsBadge'
import type { ModelCategory } from '../models/registry'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudioView =
  | 'home'
  | 'catalog'
  | 'workspace'
  | 'history'
  | 'library'
  | 'settings'
  | 'workflow'
  | 'design'

export interface StudioNavItem {
  id: string
  label: string
  icon: typeof ImageIcon
  view: StudioView
  category?: ModelCategory
  separator?: boolean
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS: StudioNavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, view: 'home' },
  { id: 'sep-create', label: 'CREER', icon: Home, view: 'home', separator: true },
  { id: 'images', label: 'Images', icon: ImageIcon, view: 'catalog', category: 'image-generation' },
  { id: 'videos', label: 'Videos', icon: Video, view: 'catalog', category: 'video-generation' },
  {
    id: 'edit-video',
    label: 'Edition Video',
    icon: Film,
    view: 'catalog',
    category: 'video-editing',
  },
  { id: 'audio', label: 'Audio & Voix', icon: Mic, view: 'catalog', category: 'audio' },
  { id: 'music', label: 'Musique / SFX', icon: Music, view: 'catalog', category: 'music' },
  { id: 'avatars', label: 'Avatars', icon: User, view: 'catalog', category: 'avatar' },
  { id: '3d', label: '3D', icon: Box, view: 'catalog', category: '3d' },
  { id: 'spaces', label: 'Spaces', icon: GitBranch, view: 'workflow' },
  { id: 'design', label: 'Creer Design', icon: Palette, view: 'design' },
  { id: 'sep-tools', label: 'OUTILS', icon: Home, view: 'home', separator: true },
  {
    id: 'vectorize',
    label: 'Vectorisation',
    icon: PenTool,
    view: 'catalog',
    category: 'vectorize',
  },
  { id: 'upscale', label: 'Upscale', icon: ArrowUpRight, view: 'catalog', category: 'upscale' },
  { id: 'remove-bg', label: 'Detourage', icon: Eraser, view: 'catalog', category: 'remove-bg' },
  { id: 'face-swap', label: 'Face Swap', icon: Repeat, view: 'catalog', category: 'face-swap' },
  {
    id: 'edit-image',
    label: 'Edition Image',
    icon: ImageIcon,
    view: 'catalog',
    category: 'image-editing',
  },
  { id: 'utility', label: 'Utilitaires', icon: Wrench, view: 'catalog', category: 'utility' },
  { id: 'sep-manage', label: 'GESTION', icon: Home, view: 'home', separator: true },
  { id: 'library', label: 'Bibliotheque', icon: FolderOpen, view: 'library' },
  { id: 'history', label: 'Historique', icon: Clock, view: 'history' },
  { id: 'settings', label: 'Providers', icon: Settings, view: 'settings' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudioLayoutProps {
  children: React.ReactNode
  currentView: StudioView
  currentModelName?: string
  activeCategory?: ModelCategory
  onNavigate: (view: StudioView, category?: ModelCategory) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioLayout({
  children,
  currentView,
  currentModelName,
  activeCategory,
  onNavigate,
}: StudioLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleNavClick = useCallback(
    (item: StudioNavItem) => {
      if (item.separator) return
      onNavigate(item.view, item.category)
    },
    [onNavigate]
  )

  const activeItemId = getActiveItemId(currentView, activeCategory)

  return (
    <div className="flex h-full bg-tribal-black overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="shrink-0 h-full flex flex-col border-r border-white/[0.06] bg-tribal-dark overflow-hidden"
      >
        {/* Logo header */}
        <div className="shrink-0 flex items-center gap-2.5 px-3 h-14 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-tribal-accent/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-bold text-white tracking-tight">Tribal Studio</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
          {NAV_ITEMS.map(item => {
            if (item.separator) {
              return (
                <div key={item.id} className="pt-4 pb-1.5 px-1">
                  {!collapsed && (
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      {item.label}
                    </span>
                  )}
                  {collapsed && <div className="h-px bg-white/[0.06] mx-1" />}
                </div>
              )
            }

            const isActive = activeItemId === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg transition-all duration-150',
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2',
                  isActive
                    ? 'bg-tribal-accent/10 text-tribal-accent'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                <Icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="shrink-0 border-t border-white/[0.06] p-2">
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">Reduire</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* ─── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <header className="shrink-0 h-14 flex items-center justify-between gap-4 px-5 border-b border-white/[0.06] bg-tribal-black/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            {currentView === 'workspace' && currentModelName ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="text-[11px] text-white/40 hover:text-white/70 transition-colors font-medium"
                >
                  Studio
                </button>
                <span className="text-white/20">/</span>
                <span className="text-sm font-semibold text-white truncate">
                  {currentModelName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/60">
                  {getViewTitle(currentView)}
                </span>
              </div>
            )}
          </div>

          {/* Right side: credits */}
          <div className="flex items-center gap-3 shrink-0">
            <CreditsBadge />
          </div>
        </header>

        {/* Content */}
        <main
          className={cn(
            'flex-1 overflow-hidden bg-tribal-black',
            currentView !== 'workflow' && currentView !== 'design' && 'overflow-y-auto scrollbar-studio'
          )}
        >
          {currentView === 'workflow' || currentView === 'design' ? children : <div className="p-5">{children}</div>}
        </main>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActiveItemId(view: StudioView, category?: ModelCategory): string {
  switch (view) {
    case 'home':
      return 'home'
    case 'library':
      return 'library'
    case 'history':
      return 'history'
    case 'settings':
      return 'settings'
    case 'workflow':
      return 'spaces'
    case 'design':
      return 'design'
    case 'catalog':
    case 'workspace': {
      if (category) {
        const item = NAV_ITEMS.find(n => !n.separator && n.category === category)
        if (item) return item.id
      }
      return ''
    }
    default:
      return ''
  }
}

function getViewTitle(view: StudioView): string {
  switch (view) {
    case 'home':
      return 'Accueil'
    case 'catalog':
      return 'Catalogue'
    case 'workspace':
      return 'Workspace'
    case 'history':
      return 'Historique'
    case 'library':
      return 'Bibliotheque'
    case 'settings':
      return 'Providers'
    case 'workflow':
      return 'Spaces'
    case 'design':
      return 'Creer Design'
    default:
      return ''
  }
}
