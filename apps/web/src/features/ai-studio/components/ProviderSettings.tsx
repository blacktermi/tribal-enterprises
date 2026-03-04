/**
 * AI STUDIO - Provider Settings Panel
 * Gestion des cles API et configuration des providers (fal.ai, OpenRouter, etc.)
 */

import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Server,
  Shield,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../../lib/utils'
import { useProviders, useSaveProviderConfig, useDeleteProviderConfig } from '../hooks/useAiStudio'
import type { ProviderInfo } from '../api/aiStudioApi'

interface ProviderSettingsProps {
  onBack?: () => void
}

// ─── Provider Icons & Colors ─────────────────────────────────────────────────

const PROVIDER_META: Record<
  string,
  { icon: string; color: string; gradient: string; description: string }
> = {
  fal: {
    icon: 'F',
    color: 'text-tribal-accent',
    gradient: 'from-tribal-accent to-tribal-accent-dark',
    description: 'Images, videos, audio, 3D, upscale, remove-bg. 26+ modeles.',
  },
  openrouter: {
    icon: 'OR',
    color: 'text-tribal-accent',
    gradient: 'from-tribal-accent to-tribal-accent-dark',
    description: 'GPT Image 1, DALL-E 3, Gemini, Llama 4 et plus via OpenRouter.',
  },
}

export function ProviderSettings({ onBack }: ProviderSettingsProps) {
  const { data: providers, isLoading } = useProviders()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 p-2 rounded-lg text-white/40 hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">Providers IA</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Gerez les cles API et la configuration des providers
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tribal-accent/10 border border-tribal-accent/20">
          <Shield className="w-3.5 h-3.5 text-tribal-accent" />
          <span className="text-xs font-medium text-tribal-accent">Admin only</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-tribal-accent/5 border border-tribal-accent/20">
        <Key className="w-5 h-5 text-tribal-accent shrink-0 mt-0.5" />
        <div className="text-xs text-white/40 space-y-1">
          <p className="font-medium text-white/70">Configuration des providers</p>
          <p>
            Les cles API peuvent etre configurees ici ou via les variables d'environnement du
            serveur. Les cles configurees ici ont priorite sur les variables d'environnement.
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-tribal-accent animate-spin" />
        </div>
      )}

      {/* Provider list */}
      {providers && (
        <div className="space-y-4">
          {providers.map((provider, idx) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ProviderCard provider={provider} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Provider Card ───────────────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: ProviderInfo }) {
  const meta = PROVIDER_META[provider.name] || {
    icon: '?',
    color: 'text-white/50',
    gradient: 'from-gray-500 to-gray-600',
    description: 'Provider non reconnu',
  }

  const [isEditing, setIsEditing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const saveMutation = useSaveProviderConfig()
  const deleteMutation = useDeleteProviderConfig()

  const handleSave = async () => {
    if (!apiKey.trim()) return

    try {
      await saveMutation.mutateAsync({
        name: provider.name,
        payload: {
          apiKey: apiKey.trim(),
          enabled: true,
        },
      })
      setApiKey('')
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      // Error shown via mutation state
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Supprimer la configuration de ${provider.displayName} ? Le provider utilisera la variable d'environnement si disponible.`
      )
    ) {
      return
    }

    try {
      await deleteMutation.mutateAsync(provider.name)
    } catch {
      // Error shown via mutation state
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        provider.configured
          ? 'bg-white/[0.03] border-white/[0.06]'
          : 'bg-white/[0.02] border-white/[0.04]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Provider icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-md',
            meta.gradient
          )}
        >
          {meta.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">{provider.displayName}</h3>

            {/* Status badges */}
            {provider.configured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tribal-accent/10 text-tribal-accent">
                <ShieldCheck className="w-3 h-3" />
                Configure
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/30 text-amber-400">
                Non configure
              </span>
            )}

            {provider.hasEnvKey && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-white/40">
                <Server className="w-2.5 h-2.5" />
                ENV
              </span>
            )}

            {provider.hasDbKey && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-tribal-accent/10 text-tribal-accent">
                <Key className="w-2.5 h-2.5" />
                DB
              </span>
            )}

            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tribal-accent/10 text-tribal-accent"
              >
                <Check className="w-3 h-3" />
                Sauvegarde !
              </motion.span>
            )}
          </div>

          <p className="text-xs text-white/40 mt-0.5">{meta.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {provider.hasDbKey && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-2 rounded-lg text-red-500 hover:bg-red-900/20 transition-colors disabled:opacity-50"
              title="Supprimer la cle DB"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing)
              setApiKey('')
              setShowKey(false)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
              isEditing
                ? 'bg-white/[0.08] text-white/70'
                : 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20 hover:shadow-tribal-accent/30'
            )}
          >
            <Key className="w-3.5 h-3.5" />
            {isEditing ? 'Annuler' : provider.hasDbKey ? 'Modifier cle' : 'Ajouter cle'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/[0.06] px-4 py-4"
        >
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">
              Cle API {provider.displayName}
            </label>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={`Entrez votre cle API ${provider.displayName}...`}
                className={cn(
                  'w-full rounded-lg border text-sm pr-10 px-3.5 py-2.5 transition-all duration-200',
                  'bg-white/[0.04] border-white/[0.08]',
                  'text-white placeholder-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-tribal-accent/40 focus:border-tribal-accent/50'
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            {saveMutation.isError && (
              <p className="text-xs text-red-400">
                {saveMutation.error?.message || 'Erreur lors de la sauvegarde'}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim() || saveMutation.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                  apiKey.trim() && !saveMutation.isPending
                    ? 'bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black shadow-lg shadow-tribal-accent/20'
                    : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                )}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Sauvegarder
              </button>

              <span className="text-[10px] text-white/40">
                La cle sera stockee en base de donnees (chiffree)
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete error */}
      {deleteMutation.isError && (
        <div className="border-t border-white/[0.06] px-4 py-2">
          <p className="text-xs text-red-400">
            {deleteMutation.error?.message || 'Erreur lors de la suppression'}
          </p>
        </div>
      )}
    </div>
  )
}
