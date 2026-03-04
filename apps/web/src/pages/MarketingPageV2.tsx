/**
 * TRIBAL OPS - Marketing Page V2
 * Page Marketing complete avec Facebook Ads, Pixels, SEO et Analytics
 */

import React, { useState, useEffect } from 'react'
import {
  Megaphone,
  BarChart3,
  Target,
  Globe,
  Facebook,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  Settings,
} from 'lucide-react'
import { resolveApiBase } from '../utils/api'
import { FacebookAdsDashboard } from '../components/marketing/FacebookAdsDashboard'
import { GlobalFacebookDashboard } from '../components/marketing/GlobalFacebookDashboard'

// TYPES

interface PlatformSettings {
  platform: string
  metaPixelId: string
  googleAnalyticsId: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  ogImage: string
  twitterHandle: string
  updatedAt: string
}

interface AllSettings {
  [platform: string]: PlatformSettings
}

// CONSTANTS

// Taux approximatif FCFA/USD - à rendre configurable
const FCFA_TO_USD_RATE = 615

const PLATFORMS = [
  {
    id: 'global',
    label: 'Vue Globale',
    short: '🌐 Global',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'tribalprint',
    label: 'Tribal Print',
    short: '🖨️ Tribal',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'jerichoprint',
    label: 'Jericho Print',
    short: '✝️ Jericho',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'muslimprint',
    label: 'Muslim Print',
    short: '🕌 Muslim',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'tribalverra',
    label: 'Tribal Verra',
    short: '🪞 Verra',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'tribalagency',
    label: 'Tribal Agency',
    short: '🚀 Agency',
    color: 'from-rose-500 to-pink-500',
  },
]

// Plateformes sans la vue globale (pour les stats du header)
const PLATFORM_STATS = PLATFORMS.filter(p => p.id !== 'global')

// COMPOSANT PRINCIPAL

export const MarketingPage: React.FC = () => {
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('global')
  const [configPlatform, setConfigPlatform] = useState<string>('tribalprint') // Plateforme pour la configuration
  const [settings, setSettings] = useState<AllSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stats de dépenses publicitaires pour le header (lifetime)
  const [adSpendStats, setAdSpendStats] = useState<{
    total: number
    totalUSD: number
    byPlatform: Record<string, number>
  }>({ total: 0, totalUSD: 0, byPlatform: {} })

  // Form states for Pixels & SEO
  const [metaPixelId, setMetaPixelId] = useState('')
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')

  // Charger les stats de dépenses publicitaires LIFETIME (depuis le début, indépendant des filtres)
  const loadAdSpendStats = async () => {
    try {
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/facebook/lifetime-spend`, { credentials: 'include' })
      if (response.ok) {
        const json = await response.json()
        if (json.success && json.data) {
          setAdSpendStats({
            total: json.data.totalSpend || 0,
            totalUSD: json.data.totalSpendUSD || 0,
            byPlatform: json.data.byPlatform || {},
          })
        }
      }
    } catch (err) {
      console.error('Erreur chargement stats pub:', err)
    }
  }

  // Check URL params for success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const urlError = urlParams.get('error')

    if (success === 'facebook_connected') {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 5000)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (urlError) {
      setError(`Erreur Facebook: ${urlError}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    loadAdSpendStats()
  }, [])

  // Charger les settings de la plateforme sélectionnée dans le modal de config
  useEffect(() => {
    const platformSettings = settings[configPlatform]
    if (platformSettings) {
      setMetaPixelId(platformSettings.metaPixelId || '')
      setGoogleAnalyticsId(platformSettings.googleAnalyticsId || '')
      setSeoTitle(platformSettings.seoTitle || '')
      setSeoDescription(platformSettings.seoDescription || '')
      setSeoKeywords(platformSettings.seoKeywords || '')
      setOgImage(platformSettings.ogImage || '')
      setTwitterHandle(platformSettings.twitterHandle || '')
    } else {
      setMetaPixelId('')
      setGoogleAnalyticsId('')
      setSeoTitle('')
      setSeoDescription('')
      setSeoKeywords('')
      setOgImage('')
      setTwitterHandle('')
    }
  }, [configPlatform, settings])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/marketing/settings`, { credentials: 'include' })
      if (response.ok) {
        const json = await response.json()
        setSettings(json.data || {})
      } else {
        setSettings({})
      }
    } catch (err) {
      console.error('Erreur chargement settings marketing:', err)
      setError('Impossible de charger les parametres')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/marketing/settings/${configPlatform}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaPixelId: metaPixelId || null,
          googleAnalyticsId: googleAnalyticsId || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          seoKeywords: seoKeywords || null,
          ogImage: ogImage || null,
          twitterHandle: twitterHandle || null,
        }),
      })
      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        await loadSettings()
      } else {
        const err = await response.json()
        setError(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setError('Impossible de sauvegarder les parametres')
    } finally {
      setSaving(false)
    }
  }

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform)

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      {/* Header - Rule 12 */}
      <div className="relative overflow-hidden rounded-2xl bg-tribal-dark p-4 md:p-8">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-tribal-accent/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-tribal-accent/[0.04] rounded-full blur-3xl" />

        <div className="relative">
          {/* Titre + Stats de depenses */}
          <div className="flex flex-col gap-4 mb-4">
            {/* Ligne 1: Titre + Refresh */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                  <Megaphone className="h-5 w-5 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-3xl font-display font-bold text-white">Marketing</h1>
                  <p className="text-[11px] md:text-sm text-white/40 hidden md:block">
                    Facebook Ads & Analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white transition-colors active:scale-95"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline text-sm font-medium">Configuration</span>
                </button>
                <button
                  onClick={() => {
                    loadSettings()
                    loadAdSpendStats()
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white transition-colors active:scale-95"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Ligne 2: Stats de depenses publicitaires (LIFETIME) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {/* Total */}
              <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl px-3 py-2">
                <p className="text-[10px] text-red-300/70 uppercase tracking-wide mb-1">
                  💰 Total Lifetime
                </p>
                <p className="text-sm md:text-lg font-bold text-white mb-0.5">
                  ${adSpendStats.totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                </p>
                <p className="text-xs md:text-sm font-semibold text-white/60">
                  {adSpendStats.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Franc
                  CFA
                </p>
              </div>

              {/* Par plateforme */}
              {PLATFORM_STATS.map(p => {
                const spend = adSpendStats.byPlatform[p.id] || 0
                const spendUSD = spend / FCFA_TO_USD_RATE
                return (
                  <div
                    key={p.id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2"
                  >
                    <p className="text-[10px] text-white/40 mb-1">{p.short}</p>
                    <p className="text-xs md:text-sm font-bold text-white mb-0.5">
                      ${spendUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                    </p>
                    <p className="text-[10px] md:text-xs font-semibold text-white/40">
                      {spend.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Franc CFA
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selecteur de plateforme - Scroll horizontal */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all active:scale-95 ${
                  selectedPlatform === platform.id
                    ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                    : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                }`}
              >
                <span className="md:hidden">{platform.short}</span>
                <span className="hidden md:inline">
                  {platform.short.split(' ')[0]} {platform.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 rounded-lg hover:bg-red-500/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Sauvegarde avec succes !</span>
        </div>
      )}

      {/* Content - Dashboard Facebook */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      ) : selectedPlatform === 'global' ? (
        <GlobalFacebookDashboard onSelectPlatform={p => setSelectedPlatform(p)} />
      ) : (
        <FacebookAdsDashboard platform={selectedPlatform} />
      )}

      {/* MODAL: CONFIGURATION (Pixels + SEO) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-tribal-gray rounded-2xl shadow-2xl border border-white/[0.06]">
            {/* Header */}
            <div className="sticky top-0 z-10 p-4 md:p-6 border-b border-white/[0.06] bg-tribal-gray">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Configuration Marketing
                    </h2>
                    <p className="text-xs text-white/40">
                      Pixels & SEO par plateforme
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <X className="h-5 w-5 text-white/50" />
                </button>
              </div>

              {/* Selecteur de plateforme */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {PLATFORM_STATS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => setConfigPlatform(platform.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      configPlatform === platform.id
                        ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                        : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    {platform.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 space-y-6">
              {/* Section Pixels */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                  <Target className="h-4 w-4 text-purple-500" />
                  Pixels de tracking
                </h3>

                <div className="space-y-4">
                  {/* Meta Pixel */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Facebook className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-white/60">
                        Meta Pixel
                      </span>
                      {metaPixelId && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/30 text-emerald-400">
                          ✓ Configure
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={metaPixelId}
                      onChange={e => setMetaPixelId(e.target.value)}
                      placeholder="Ex: 123456789012345"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                    />
                  </div>

                  {/* Google Analytics */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-white/60">
                        Google Analytics 4
                      </span>
                      {googleAnalyticsId && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/30 text-emerald-400">
                          ✓ Configure
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={googleAnalyticsId}
                      onChange={e => setGoogleAnalyticsId(e.target.value)}
                      placeholder="Ex: G-XXXXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section SEO */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  SEO & Reseaux sociaux —{' '}
                  <span className="text-purple-500">
                    {PLATFORM_STATS.find(p => p.id === configPlatform)?.label}
                  </span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">
                      Titre du site
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      placeholder="Ex: Tribal Print - Impression Photo Premium"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      {seoTitle.length}/60 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      rows={3}
                      placeholder="Description qui apparait dans les resultats Google..."
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none resize-none"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      {seoDescription.length}/160 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">
                      Mots-cles
                    </label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={e => setSeoKeywords(e.target.value)}
                      placeholder="impression photo, tableaux, cadres, personnalise..."
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-1.5">
                        Image OG (URL)
                      </label>
                      <input
                        type="text"
                        value={ogImage}
                        onChange={e => setOgImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-1.5">
                        Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={twitterHandle}
                        onChange={e => setTwitterHandle(e.target.value)}
                        placeholder="@tribalprint"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 focus:border-tribal-accent/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 md:p-6 border-t border-white/[0.06] bg-tribal-gray">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await saveSettings()
                  setShowConfigModal(false)
                }}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black text-sm font-semibold shadow-lg shadow-tribal-accent/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketingPage
