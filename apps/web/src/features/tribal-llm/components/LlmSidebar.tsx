/**
 * TRIBAL LLM - Sidebar (historique conversations + projets)
 * Style ChatGPT : nouvelle conversation, recherche, projets CRUD, conversations groupees par date
 * Menu contextuel sur conversations : pin, rename, archive, delete, deplacer vers projet
 * Theme dark-only premium
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Pencil,
  Archive,
  Trash2,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  FolderInput,
  Settings2,
  X,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  useConversations,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
  useFolders,
  useLlmStats,
} from '../hooks/useTribalLlm'
import { getDefaultModel, findModelById } from '../models/registry'
import { LlmProjectModal } from './LlmProjectModal'

import type { LlmConversation, LlmFolder } from '../api/llmApi'

interface LlmSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

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

// ─── Menu contextuel dropdown ─────────────────────────────────────────────────

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
}

function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  // Ajuster la position pour ne pas depasser l'ecran
  const adjustedY = Math.min(y, window.innerHeight - 250)
  const adjustedX = Math.min(x, window.innerWidth - 200)

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] py-1.5 bg-tribal-gray rounded-xl shadow-xl border border-white/[0.08] animate-in fade-in-0 zoom-in-95"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {children}
    </div>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  active?: boolean
}

function MenuItem({ icon, label, onClick, danger, active }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : active
            ? 'text-tribal-accent bg-tribal-accent/10'
            : 'text-white/70 hover:bg-white/[0.06]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function MenuDivider() {
  return <div className="my-1 border-t border-white/[0.06]" />
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LlmSidebar({
  currentConversationId,
  onSelectConversation,
  isMobileOpen,
  onCloseMobile,
}: LlmSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  // Modal projet
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<LlmFolder | null>(null)

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    conv: LlmConversation
  } | null>(null)

  // Folder context menu
  const [folderContextMenu, setFolderContextMenu] = useState<{
    x: number
    y: number
    folder: LlmFolder
  } | null>(null)

  // Move to folder submenu
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  const { data: convData } = useConversations({
    search: searchQuery || undefined,
    isArchived: showArchived,
    folderId: selectedFolderId || undefined,
  })
  const { data: folders } = useFolders()
  const { data: stats } = useLlmStats()

  const createConversation = useCreateConversation()
  const updateConversation = useUpdateConversation()
  const deleteConversation = useDeleteConversation()

  const conversations = convData?.conversations || []
  const foldersList = (folders || []) as LlmFolder[]

  // Grouper par date
  const grouped = useMemo(() => {
    const groups: Record<string, LlmConversation[]> = {}
    const pinned = conversations.filter(c => c.isPinned)
    const unpinned = conversations.filter(c => !c.isPinned)

    if (pinned.length > 0) {
      groups['Epingles'] = pinned
    }

    for (const conv of unpinned) {
      const group = getTimeGroup(conv.updatedAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(conv)
    }

    return groups
  }, [conversations])

  const groupOrder = ['Epingles', ...TIME_GROUP_ORDER]

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleRename = (conv: LlmConversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title || '')
    setContextMenu(null)
  }

  const handleSaveRename = async () => {
    if (!editingId || !editTitle.trim()) {
      setEditingId(null)
      return
    }
    await updateConversation.mutateAsync({ id: editingId, title: editTitle.trim() })
    setEditingId(null)
  }

  const handlePin = async (conv: LlmConversation) => {
    await updateConversation.mutateAsync({ id: conv.id, isPinned: !conv.isPinned })
    setContextMenu(null)
  }

  const handleArchive = async (conv: LlmConversation) => {
    await updateConversation.mutateAsync({ id: conv.id, isArchived: !conv.isArchived })
    setContextMenu(null)
  }

  const handleDelete = async (conv: LlmConversation) => {
    await deleteConversation.mutateAsync(conv.id)
    setContextMenu(null)
  }

  const handleMoveToFolder = async (conv: LlmConversation, folderId: string | null) => {
    await updateConversation.mutateAsync({ id: conv.id, folderId })
    setContextMenu(null)
    setShowMoveMenu(false)
  }

  const handleConversationContextMenu = (e: React.MouseEvent, conv: LlmConversation) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMoveMenu(false)
    setFolderContextMenu(null)
    setContextMenu({ x: e.clientX, y: e.clientY, conv })
  }

  const handleFolderContextMenu = (e: React.MouseEvent, folder: LlmFolder) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu(null)
    setShowMoveMenu(false)
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folder })
  }

  const handleOpenProjectModal = (folder?: LlmFolder) => {
    setEditingFolder(folder || null)
    setProjectModalOpen(true)
    setFolderContextMenu(null)
  }

  const closeAllMenus = () => {
    setContextMenu(null)
    setFolderContextMenu(null)
    setShowMoveMenu(false)
  }

  // Quand on selectionne une conversation, fermer le sidebar mobile
  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id)
      onCloseMobile?.()
    },
    [onSelectConversation, onCloseMobile]
  )

  // Quand on cree une nouvelle conversation, fermer le sidebar mobile
  const handleNewConversationWrapped = async () => {
    try {
      const model = getDefaultModel()
      const conv = await createConversation.mutateAsync({
        model: model.id,
        provider: model.providerSlug || 'openrouter',
        folderId: selectedFolderId || undefined,
      })
      handleSelectConversation(conv.id)
    } catch {
      // error handled by React Query
    }
  }

  return (
    <>
      {/* Overlay backdrop mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar : cachee sur mobile sauf quand isMobileOpen */}
      <div
        className={cn(
          'h-full flex flex-col bg-tribal-dark border-r border-white/[0.06] transition-transform duration-300 ease-in-out',
          // Desktop : toujours visible, w-72
          'hidden lg:flex w-72',
          // Mobile : overlay par dessus
          isMobileOpen && 'fixed inset-y-0 left-0 z-50 !flex w-[85vw] max-w-[320px] shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversationWrapped}
              disabled={createConversation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-tribal-accent text-tribal-black font-semibold text-sm shadow-lg shadow-tribal-accent/20 hover:shadow-xl hover:shadow-tribal-accent/30 hover:brightness-105 transition-all active:scale-[0.97] disabled:opacity-60"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Nouvelle conversation
            </button>
            {/* Bouton fermer mobile */}
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/90 placeholder-white/25 focus:outline-none focus:border-tribal-accent/40 transition-all"
            />
          </div>
        </div>

        {/* Projets section - toujours visible */}
        <div className="px-2 pt-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
            >
              {foldersExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Projets
            </button>
            <button
              onClick={() => handleOpenProjectModal()}
              title="Nouveau projet"
              className="p-1 rounded-md text-white/30 hover:text-tribal-accent hover:bg-tribal-accent/10 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {foldersExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {/* Bouton "Toutes les conversations" */}
              <button
                onClick={() => setSelectedFolderId(null)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  !selectedFolderId
                    ? 'bg-tribal-accent/10 text-tribal-accent'
                    : 'text-white/50 hover:bg-white/[0.06]'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="truncate">Toutes</span>
              </button>

              {/* Liste des projets */}
              {foldersList.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  onContextMenu={e => handleFolderContextMenu(e, folder)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group/folder',
                    selectedFolderId === folder.id
                      ? 'bg-tribal-accent/10 text-tribal-accent'
                      : 'text-white/50 hover:bg-white/[0.06]'
                  )}
                >
                  {/* Icon : emoji ou FolderOpen avec couleur */}
                  {folder.icon ? (
                    <span className="text-sm flex-shrink-0">{folder.icon}</span>
                  ) : (
                    <FolderOpen
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: folder.color || undefined }}
                    />
                  )}
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                  {folder._count?.conversations != null && (
                    <span className="text-[10px] text-white/30 flex-shrink-0">
                      {folder._count.conversations}
                    </span>
                  )}
                  {/* Bouton settings au hover */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenProjectModal(folder)
                    }}
                    className="p-0.5 rounded opacity-100 lg:opacity-0 lg:group-hover/folder:opacity-100 text-white/30 hover:text-white/60 transition-all"
                    title="Modifier le projet"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                </button>
              ))}

              {/* Message si aucun projet */}
              {foldersList.length === 0 && (
                <p className="px-2.5 py-2 text-[10px] text-white/30 italic">
                  Aucun projet. Creez-en un pour organiser vos conversations.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Separateur */}
        <div className="mx-3 my-1 border-t border-white/[0.06]" />

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-studio">
          {conversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-xs text-white/30">
                {searchQuery ? 'Aucun resultat' : 'Aucune conversation'}
              </p>
            </div>
          )}

          {groupOrder.map(groupName => {
            const items = grouped[groupName]
            if (!items || items.length === 0) return null

            return (
              <div key={groupName}>
                <div className="px-2 py-1 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    {groupName}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {items.map(conv => {
                    const isActive = conv.id === currentConversationId
                    const isEditing = editingId === conv.id
                    const model = findModelById(conv.model)

                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                          isActive
                            ? 'bg-tribal-accent/10 border-l-[3px] border-l-tribal-accent border-y border-r border-y-tribal-accent/10 border-r-tribal-accent/10 shadow-sm'
                            : 'hover:bg-white/[0.04] border-l-[3px] border-l-transparent border-y border-r border-transparent'
                        )}
                        onClick={() => !isEditing && handleSelectConversation(conv.id)}
                        onContextMenu={e => handleConversationContextMenu(e, conv)}
                      >
                        {/* Dot couleur modele */}
                        {model && (
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0 ring-2',
                              isActive ? 'ring-tribal-accent/30' : 'ring-white/[0.06]'
                            )}
                            style={{ backgroundColor: model.iconColor }}
                          />
                        )}

                        {/* Titre */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename()
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              onBlur={handleSaveRename}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-1 py-0.5 text-xs rounded border border-tribal-accent/40 bg-white/[0.06] text-white focus:outline-none"
                            />
                          ) : (
                            <p
                              className={cn(
                                'text-xs truncate',
                                isActive ? 'font-semibold text-tribal-accent' : 'text-white/70'
                              )}
                            >
                              {conv.title || 'Nouvelle conversation'}
                            </p>
                          )}

                          {!isEditing && (
                            <p className="text-[10px] text-white/30 truncate mt-0.5">
                              {model?.name || conv.model}
                              {conv._count?.messages != null && ` · ${conv._count.messages} msg`}
                            </p>
                          )}
                        </div>

                        {/* Pin indicator */}
                        {conv.isPinned && (
                          <Pin className="w-3 h-3 text-tribal-accent flex-shrink-0 group-hover:hidden" />
                        )}

                        {/* Actions on hover : bouton "..." */}
                        {!isEditing && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setFolderContextMenu(null)
                              setShowMoveMenu(false)
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                conv,
                              })
                            }}
                            className="p-1 rounded opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all flex-shrink-0"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
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

        {/* Footer - Stats */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                'text-[10px] font-medium transition-colors',
                showArchived ? 'text-tribal-accent' : 'text-white/30 hover:text-white/60'
              )}
            >
              {showArchived ? 'Voir actives' : 'Voir archivees'}
            </button>

            {stats && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                <span>{stats.totalMessages} msg</span>
                <span className="text-white/10">·</span>
                <span className="font-medium text-tribal-accent">
                  ${(stats.totalCost || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Context menu conversation ─────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeAllMenus}>
          <MenuItem
            icon={<Pin className="w-3.5 h-3.5" />}
            label={contextMenu.conv.isPinned ? 'Desepingler' : 'Epingler'}
            onClick={() => handlePin(contextMenu.conv)}
            active={contextMenu.conv.isPinned}
          />
          <MenuItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Renommer"
            onClick={() => handleRename(contextMenu.conv)}
          />
          <MenuItem
            icon={<Archive className="w-3.5 h-3.5" />}
            label={contextMenu.conv.isArchived ? 'Desarchiver' : 'Archiver'}
            onClick={() => handleArchive(contextMenu.conv)}
          />
          <MenuDivider />

          {/* Deplacer vers un projet */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Deplacer vers...</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
            </button>

            {showMoveMenu && (
              <div className="absolute left-full top-0 ml-1 min-w-[160px] py-1.5 bg-tribal-gray rounded-xl shadow-xl border border-white/[0.08] animate-in fade-in-0 slide-in-from-left-2">
                {/* Retirer du projet */}
                {contextMenu.conv.folderId && (
                  <>
                    <MenuItem
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                      label="Retirer du projet"
                      onClick={() => handleMoveToFolder(contextMenu.conv, null)}
                    />
                    <MenuDivider />
                  </>
                )}

                {/* Liste des projets */}
                {foldersList.map(folder => (
                  <MenuItem
                    key={folder.id}
                    icon={
                      folder.icon ? (
                        <span className="text-xs">{folder.icon}</span>
                      ) : (
                        <FolderOpen
                          className="w-3.5 h-3.5"
                          style={{ color: folder.color || undefined }}
                        />
                      )
                    }
                    label={folder.name}
                    onClick={() => handleMoveToFolder(contextMenu.conv, folder.id)}
                    active={contextMenu.conv.folderId === folder.id}
                  />
                ))}

                {foldersList.length === 0 && (
                  <p className="px-3 py-2 text-[10px] text-white/30 italic">Aucun projet</p>
                )}
              </div>
            )}
          </div>

          <MenuDivider />
          <MenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Supprimer"
            onClick={() => handleDelete(contextMenu.conv)}
            danger
          />
        </ContextMenu>
      )}

      {/* ─── Context menu folder ───────────────────────────────────────────── */}
      {folderContextMenu && (
        <ContextMenu x={folderContextMenu.x} y={folderContextMenu.y} onClose={closeAllMenus}>
          <MenuItem
            icon={<Settings2 className="w-3.5 h-3.5" />}
            label="Modifier le projet"
            onClick={() => handleOpenProjectModal(folderContextMenu.folder)}
          />
        </ContextMenu>
      )}

      {/* ─── Modal projet ──────────────────────────────────────────────────── */}
      <LlmProjectModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false)
          setEditingFolder(null)
        }}
        folder={editingFolder}
      />
    </>
  )
}
