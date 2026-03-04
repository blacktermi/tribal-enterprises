/**
 * TRIBAL ANALYST - Sidebar (historique conversations)
 * Simplifie par rapport a LlmSidebar : pas de projets, pas de pin/archive
 */

import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, Trash2, Brain, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  useAnalystConversations,
  useCreateAnalystConversation,
  useDeleteAnalystConversation,
} from '../hooks/useTribalAnalyst'

import type { AnalystConversation } from '../api/analystApi'

function getTimeGroup(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays <= 7) return '7 derniers jours'
  if (diffDays <= 30) return '30 derniers jours'
  return 'Plus ancien'
}

const TIME_GROUP_ORDER = [
  "Aujourd'hui",
  'Hier',
  '7 derniers jours',
  '30 derniers jours',
  'Plus ancien',
]

interface AnalystSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string | null) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function AnalystSidebar({
  currentConversationId,
  onSelectConversation,
  isMobileOpen,
  onCloseMobile,
}: AnalystSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: convData } = useAnalystConversations({
    search: searchQuery || undefined,
  })

  const createConversation = useCreateAnalystConversation()
  const deleteConversation = useDeleteAnalystConversation()

  const conversations = convData?.conversations || []

  // Grouper par date
  const grouped = useMemo(() => {
    const groups: Record<string, AnalystConversation[]> = {}

    for (const conv of conversations) {
      const group = getTimeGroup(conv.updatedAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(conv)
    }

    return groups
  }, [conversations])

  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id)
      onCloseMobile?.()
    },
    [onSelectConversation, onCloseMobile]
  )

  const handleNewConversation = useCallback(() => {
    onSelectConversation(null)
    onCloseMobile?.()
  }, [onSelectConversation, onCloseMobile])

  const handleDelete = useCallback(
    async (convId: string) => {
      await deleteConversation.mutateAsync(convId)
      setDeletingId(null)
      if (currentConversationId === convId) {
        onSelectConversation(null)
      }
    },
    [deleteConversation, currentConversationId, onSelectConversation]
  )

  return (
    <>
      {/* Overlay backdrop mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <div
        className={cn(
          'h-full flex flex-col bg-tribal-black border-r border-white/[0.06] transition-transform duration-300 ease-in-out',
          'hidden lg:flex w-72',
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 !flex w-[85vw] max-w-[320px] shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="p-3 space-y-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              disabled={createConversation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm shadow-md shadow-tribal-accent/20 hover:bg-tribal-accent-light hover:shadow-lg hover:shadow-tribal-accent/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Nouvelle analyse
            </button>
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder-white/25 focus:outline-none focus:border-tribal-accent/40"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {conversations.length === 0 && (
            <div className="text-center py-8 px-4">
              <Brain className="w-8 h-8 mx-auto mb-2 text-white/30" />
              <p className="text-xs text-white/40">
                {searchQuery ? 'Aucun resultat' : 'Aucune analyse'}
              </p>
              <p className="text-[10px] text-white/30 mt-1">
                Posez une question pour commencer
              </p>
            </div>
          )}

          {TIME_GROUP_ORDER.map(groupName => {
            const items = grouped[groupName]
            if (!items || items.length === 0) return null

            return (
              <div key={groupName}>
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {groupName}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {items.map(conv => {
                    const isActive = conv.id === currentConversationId

                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          'group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all',
                          isActive
                            ? 'bg-tribal-accent/10 border border-tribal-accent/20'
                            : 'hover:bg-white/[0.04] border border-transparent'
                        )}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full flex-shrink-0',
                            isActive ? 'bg-tribal-accent' : 'bg-indigo-400'
                          )}
                        />

                        {/* Titre */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-xs truncate',
                              isActive
                                ? 'font-semibold text-tribal-accent'
                                : 'text-white/60'
                            )}
                          >
                            {conv.title || 'Nouvelle analyse'}
                          </p>
                          <p className="text-[10px] text-white/40 truncate mt-0.5">
                            {conv._count?.messages != null && `${conv._count.messages} msg`}
                          </p>
                        </div>

                        {/* Delete button */}
                        {deletingId === conv.id ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(conv.id)
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              Oui
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setDeletingId(null)
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-white/60 hover:bg-white/[0.12] transition-colors"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setDeletingId(conv.id)
                            }}
                            className="p-1 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all flex-shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Brain className="w-3 h-3" />
            <span>Tribal Analyst · Donnees business en temps reel</span>
          </div>
        </div>
      </div>
    </>
  )
}
