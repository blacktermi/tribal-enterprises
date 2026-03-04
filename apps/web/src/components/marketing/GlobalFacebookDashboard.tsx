/**
 * TRIBAL OPS - Global Facebook Ads Dashboard
 * Vue agregee de toutes les plateformes avec leurs stats Facebook Ads
 */

import React, { useState, useEffect } from 'react'
import {
  Facebook,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  CheckCircle,
  XCircle,
  ArrowRight,
  Globe,
} from 'lucide-react'
import { resolveApiBase } from '../../utils/api'
import { cn } from '../../lib/utils'
import { useFacebookFilters, AVAILABLE_YEARS, MONTHS } from '../../store/facebookFilters'

// TYPES

interface PlatformStats {
  spend: number
  revenue: number
  orders: number
  impressions: number
  clicks: number
  roas: number
}

interface PlatformData {
  platform: string
  platformLabel: string
  connected: boolean
  accountName: string | null
  lastSyncAt: string | null
  stats: PlatformStats | null
}

interface GlobalStats {
  spend: number
  revenue: number
  profit: number
  orders: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  roas: number
  conversionRate: number
}

interface Campaign {
  id: string
  name: string
  platform: string
  status: string
  spend: number
  revenue: number
  roas: number
}

interface DailyData {
  date: string
  spend: number
  revenue: number
  orders: number
}

interface GlobalDashboardData {
  connectedPlatforms: number
  totalPlatforms: number
  globalStats: GlobalStats
  platforms: PlatformData[]
  dailyData: DailyData[]
  topCampaigns: Campaign[]
}

// CONSTANTS - Rule 15: keep platform colors as-is

const PLATFORM_COLORS: Record<string, string> = {
  tribalprint: 'from-blue-500 to-cyan-500',
  jerichoprint: 'from-amber-500 to-orange-500',
  muslimprint: 'from-emerald-500 to-teal-500',
  tribalverra: 'from-violet-500 to-purple-500',
}

const PLATFORM_ICONS: Record<string, string> = {
  tribalprint: '🖨️',
  jerichoprint: '✝️',
  muslimprint: '🕌',
  tribalverra: '🪞',
}

// COMPOSANT PRINCIPAL

interface GlobalFacebookDashboardProps {
  onSelectPlatform?: (platform: string) => void
}

export const GlobalFacebookDashboard: React.FC<GlobalFacebookDashboardProps> = ({ onSelectPlatform }) => {
  const [data, setData] = useState<GlobalDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    selectedYear,
    selectedMonth,
    quickFilter,
    selectQuickFilter,
    selectYear,
    selectMonth,
    getDateRange,
    getFilterLabel,
  } = useFacebookFilters()

  useEffect(() => {
    loadDashboard()
  }, [selectedYear, selectedMonth, quickFilter])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiBase = resolveApiBase()
      const { start, end } = getDateRange()
      const response = await fetch(`${apiBase}/facebook/global-dashboard?startDate=${start}&endDate=${end}`)
      const json = await response.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      console.error('Error loading global dashboard:', err)
      setError('Impossible de charger le dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      setError(null)
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/facebook/sync-all`, { method: 'POST' })
      const json = await response.json()
      if (json.success) {
        await loadDashboard()
      } else {
        setError(json.error || 'Erreur lors de la synchronisation')
      }
    } catch (err) {
      setError('Erreur lors de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  const USD_RATE = 615

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value)
  }

  const formatCurrencyUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / USD_RATE)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-tribal-accent animate-spin" />
      </div>
    )
  }

  if (!data || data.connectedPlatforms === 0) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-tribal-dark p-6 md:p-8 text-center">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-tribal-accent/[0.06] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-tribal-accent/[0.04] rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="inline-flex p-4 rounded-2xl bg-white/[0.06] backdrop-blur-sm mb-6">
              <Globe className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-3">Dashboard Global</h2>
            <p className="text-white/40 mb-6">Connectez au moins une plateforme a Facebook Ads pour voir les statistiques globales.</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
                <button
                  key={platform}
                  onClick={() => onSelectPlatform?.(platform)}
                  className={cn('p-4 rounded-xl bg-gradient-to-br text-white font-medium hover:scale-[1.02] transition-transform active:scale-[0.98]', PLATFORM_COLORS[platform])}
                >
                  <span className="text-2xl mr-2">{icon}</span>
                  {platform.replace('print', ' Print').replace('verra', ' Verra')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data.globalStats) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-tribal-accent animate-spin" />
        <span className="ml-3 text-white/50">Chargement des statistiques...</span>
      </div>
    )
  }

  const stats = data.globalStats
  const isPositiveRoas = stats.roas >= 1
  const isPositiveProfit = stats.profit > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Vue Globale</h2>
              <p className="text-sm text-white/70">{data.connectedPlatforms}/{data.totalPlatforms} plateformes connectees</p>
            </div>
          </div>
          <button onClick={handleSyncAll} disabled={syncing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors active:scale-95">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync All
          </button>
        </div>

        {/* Filtres de periode */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white/20 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => selectQuickFilter(p)} className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                quickFilter === p ? 'bg-white text-purple-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'
              )}>
                {p === '7d' ? '7J' : p === '30d' ? '30J' : '90J'}
              </button>
            ))}
          </div>
          <select value={selectedYear} onChange={(e) => selectYear(Number(e.target.value))} className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border-0',
            !quickFilter ? 'bg-white text-purple-600' : 'bg-white/20 text-white'
          )}>
            {AVAILABLE_YEARS.map(year => (<option key={year} value={year} className="text-tribal-black">{year}</option>))}
          </select>
          <select value={selectedMonth ?? ''} onChange={(e) => selectMonth(e.target.value === '' ? null : Number(e.target.value))} className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border-0',
            selectedMonth !== null && !quickFilter ? 'bg-white text-purple-600' : 'bg-white/20 text-white'
          )}>
            <option value="" className="text-tribal-black">Toute l'annee</option>
            {MONTHS.map((month, idx) => (<option key={idx} value={idx} className="text-tribal-black">{month}</option>))}
          </select>
          <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-lg">📅 {getFilterLabel()}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* KPIs Globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlobalStatCard icon={DollarSign} label="Depenses Totales" value={formatCurrency(stats.spend)} subtitle={`≈ ${formatCurrencyUSD(stats.spend)}`} color="from-red-500 to-orange-500" />
        <GlobalStatCard icon={ShoppingCart} label="Revenus Totaux" value={formatCurrency(stats.revenue)} subtitle={`${stats.orders} cmd · ≈ ${formatCurrencyUSD(stats.revenue)}`} color="from-emerald-500 to-teal-500" />
        <GlobalStatCard icon={isPositiveRoas ? TrendingUp : TrendingDown} label="ROAS Global" value={`${stats.roas.toFixed(2)}x`} subtitle={isPositiveRoas ? 'Rentable' : 'A optimiser'} color={isPositiveRoas ? 'from-emerald-500 to-green-500' : 'from-red-500 to-pink-500'} />
        <GlobalStatCard icon={Zap} label="Profit Net" value={formatCurrency(stats.profit)} subtitle={`≈ ${formatCurrencyUSD(stats.profit)}`} color={isPositiveProfit ? 'from-blue-500 to-indigo-500' : 'from-slate-500 to-slate-600'} />
      </div>

      {/* Stats par plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.platforms || []).map((platform) => (
          <div
            key={platform.platform}
            onClick={() => onSelectPlatform?.(platform.platform)}
            className={cn(
              'relative overflow-hidden rounded-2xl p-4 cursor-pointer glass',
              'hover:shadow-lg hover:-translate-y-0.5 transition-all'
            )}
          >
            <div className={cn('absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl bg-gradient-to-br', PLATFORM_COLORS[platform.platform])} />
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white text-xl', PLATFORM_COLORS[platform.platform])}>
                  {PLATFORM_ICONS[platform.platform]}
                </div>
                <div>
                  <h3 className="font-bold text-white">{platform.platformLabel}</h3>
                  {platform.connected ? (
                    <p className="text-xs text-white/40">{platform.accountName}</p>
                  ) : (
                    <p className="text-xs text-amber-400">Non connecte</p>
                  )}
                </div>
              </div>
              {platform.connected ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-white/40" />}
            </div>
            {platform.connected && platform.stats ? (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-xs text-white/40">Depenses</p>
                  <p className="font-bold text-white text-sm">{formatCurrency(platform.stats.spend)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-xs text-white/40">Revenus</p>
                  <p className="font-bold text-emerald-400 text-sm">{formatCurrency(platform.stats.revenue)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-xs text-white/40">ROAS</p>
                  <p className={cn('font-bold text-sm', platform.stats.roas >= 1 ? 'text-emerald-400' : 'text-red-400')}>{platform.stats.roas.toFixed(2)}x</p>
                </div>
              </div>
            ) : (
              <button className={cn('w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r text-white text-sm font-medium', PLATFORM_COLORS[platform.platform])}>
                <Facebook className="h-4 w-4" />
                Connecter Facebook Ads
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Graphique & Top Campagnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            Depenses vs Revenus (Global)
          </h3>
          {data.dailyData && data.dailyData.length > 0 ? (
            <div className="space-y-2">
              {data.dailyData.slice(-7).map((day, i) => {
                const maxValue = Math.max(...data.dailyData.map(d => Math.max(d.spend, d.revenue)))
                const spendPercent = maxValue > 0 ? (day.spend / maxValue) * 100 : 0
                const revenuePercent = maxValue > 0 ? (day.revenue / maxValue) * 100 : 0
                const profit = day.revenue - day.spend
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
                      <span className={profit >= 0 ? 'text-emerald-400' : 'text-red-500'}>{profit >= 0 ? '+' : ''}{formatCurrency(profit)}</span>
                    </div>
                    <div className="flex gap-1 h-3">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400" style={{ width: `${spendPercent}%` }} />
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${revenuePercent}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-orange-400" />Depenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />Revenus</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pas encore de donnees</p>
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl glass">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Top Campagnes (Toutes plateformes)
          </h3>
          {data.topCampaigns && data.topCampaigns.length > 0 ? (
            <div className="space-y-3">
              {data.topCampaigns.map((campaign, i) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                      i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                      i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                      'bg-white/[0.08]'
                    )}>{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{campaign.name}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <span>{PLATFORM_ICONS[campaign.platform]}</span>
                        {formatCurrency(campaign.spend)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-bold text-sm', campaign.roas >= 1 ? 'text-emerald-400' : 'text-red-400')}>{campaign.roas.toFixed(2)}x</p>
                    <p className="text-xs text-white/40">{formatCurrency(campaign.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune campagne</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// SOUS-COMPOSANTS

interface GlobalStatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle?: string
  color: string
}

const GlobalStatCard: React.FC<GlobalStatCardProps> = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="relative overflow-hidden rounded-2xl p-4 md:p-5 glass">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-10 blur-2xl`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-white/40 mb-1">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </div>
  </div>
)

export default GlobalFacebookDashboard
