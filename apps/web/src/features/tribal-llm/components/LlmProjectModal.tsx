/**
 * TRIBAL LLM - Modal creation/edition de projet (dossier)
 * Champs : nom, description, icon (emoji), couleur
 * Dark-only premium theme (tribal accent)
 */

import { useState, useEffect, useRef } from 'react'
import { X, FolderOpen, Trash2, Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useCreateFolder, useUpdateFolder, useDeleteFolder } from '../hooks/useTribalLlm'

import type { LlmFolder } from '../api/llmApi'

interface LlmProjectModalProps {
  isOpen: boolean
  onClose: () => void
  folder?: LlmFolder | null // null = creation, sinon edition
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#a855f7', // purple
]

const PRESET_ICONS = [
  '📁',
  '🚀',
  '💡',
  '🎨',
  '📊',
  '🔬',
  '📝',
  '🛠️',
  '🌐',
  '📱',
  '🤖',
  '💬',
  '🎯',
  '📚',
  '🔒',
  '⚡',
  '🎵',
  '📸',
  '🏢',
  '🧪',
  '💼',
  '🌟',
  '🔥',
  '🎮',
]

export function LlmProjectModal({ isOpen, onClose, folder }: LlmProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()

  const isEditing = !!folder
  const isSubmitting = createFolder.isPending || updateFolder.isPending
  const isDeleting = deleteFolder.isPending

  // Pre-remplir en mode edition
  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setDescription(folder.description || '')
      setIcon(folder.icon || '')
      setColor(folder.color || PRESET_COLORS[0])
    } else {
      setName('')
      setDescription('')
      setIcon('')
      setColor(PRESET_COLORS[0])
    }
    setShowDeleteConfirm(false)
  }, [folder, isOpen])

  // Focus auto
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name.trim()) return

    try {
      if (isEditing && folder) {
        await updateFolder.mutateAsync({
          id: folder.id,
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon || undefined,
          color,
        })
      } else {
        await createFolder.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon || undefined,
          color,
        })
      }
      onClose()
    } catch {
      // Erreur geree par React Query
    }
  }

  const handleDelete = async () => {
    if (!folder) return
    try {
      await deleteFolder.mutateAsync(folder.id)
      onClose()
    } catch {
      // Erreur geree par React Query
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && !e.shiftKey && e.target === nameRef.current) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md mx-4 bg-tribal-dark rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tribal-accent flex items-center justify-center text-white">
              <FolderOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">
              Nom du projet *
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Application Mobile, Marketing, API..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.04] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-tribal-accent/30 focus:border-tribal-accent/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Decrivez ce projet..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.04] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-tribal-accent/30 focus:border-tribal-accent/40 transition-colors resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">
              Icone (optionnel)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setIcon(icon === emoji ? '' : emoji)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all',
                    icon === emoji
                      ? 'bg-tribal-accent/10 ring-2 ring-tribal-accent scale-110'
                      : 'bg-white/[0.04] hover:bg-white/[0.08]'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-tribal-dark scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{
                    backgroundColor: c,
                    ...(color === c ? ({ '--tw-ring-color': c } as React.CSSProperties) : {}),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          {/* Zone gauche : bouton supprimer en mode edition */}
          <div>
            {isEditing && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
            {isEditing && showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 font-medium">Confirmer ?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Oui, supprimer'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/50 hover:bg-white/[0.06] transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

          {/* Zone droite : boutons annuler/sauver */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white/50 hover:bg-white/[0.06] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-tribal-accent text-white text-xs font-semibold shadow-md shadow-tribal-accent/20 hover:shadow-lg hover:shadow-tribal-accent/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                'Enregistrer'
              ) : (
                'Creer le projet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
