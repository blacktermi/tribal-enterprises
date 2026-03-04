/**
 * TRIBAL OPS - Facebook Ads Dashboard Component
 * Dashboard complet pour visualiser les stats Facebook Ads et le ROI
 */

import React, { useState, useEffect } from 'react'
import {
  Facebook,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  RefreshCw,
  Link2,
  Unlink,
  AlertCircle,
  Target,
  Users,
  Zap,
  ChevronDown,
  ExternalLink,
  BarChart3,
  PieChart,
} from 'lucide-react'
import { resolveApiBase } from '../../utils/api'
import { cn } from '../../lib/utils'
import { useFacebookFilters, AVAILABLE_YEARS, MONTHS } from '../../store/facebookFilters'

// TYPES

interface FacebookAccount {
  id: string
  accountId: string
  accountName: string
  currency: string
  lastSyncAt: string | null
  isExpired?: boolean
}

interface DashboardStats {
  spend: number
  impressions: number
  clicks: number
  reach: number
  revenue: number
  orders: number
  cpc: number
  ctr: number
  roas: number
  conversionRate: number
}

interface Campaign {
  id: string
  name: string
  status: string
  effectiveStatus?: string
  isActive?: boolean
  spend: number
  impressions?: number
  clicks?: number
  revenue: number
  roas: number
}

interface DailyData {
  date: string
  spend: number
  revenue: number
  orders: number
  impressions: number
  clicks: number
}

interface DashboardData {
  connected: boolean
  account: FacebookAccount | null
  stats: DashboardStats | null
  dailyData: DailyData[]
  topCampaigns: Campaign[]
  needsMapping?: boolean
  availableAccounts?: { id: string; accountId: string; name: string; currency: string; status: number }[]
}

// Mapping pour les noms de plateformes
const platformLabels: Record<string, string> = {
  tribalprint: 'Tribal Print',
  jerichoprint: 'Jericho Print',
  muslimprint: 'Muslim Print',
  tribalverra: 'Tribal Verra'
}

// COMPOSANT PRINCIPAL

interface FacebookAdsDashboardProps {
  platform: string
}

export const FacebookAdsDashboard: React.FC<FacebookAdsDashboardProps> = ({ platform }) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [mapping, setMapping] = useState(false)
  const [showUSD, setShowUSD] = useState(false)

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

  const USD_RATE = 615

  useEffect(() => {
    loadDashboard()
  }, [platform, selectedYear, selectedMonth, quickFilter])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiBase = resolveApiBase()
      const { start, end } = getDateRange()
      const response = await fetch(`${apiBase}/facebook/dashboard?platform=${platform}&startDate=${start}&endDate=${end}`)
      const json = await response.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      console.error('Error loading Facebook dashboard:', err)
      setError('Impossible de charger le dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/facebook/auth-url?platform=${platform}`)
      const json = await response.json()
      if (json.success && json.data.authUrl) {
        window.location.href = json.data.authUrl
      } else {
        setError('Impossible de generer l\'URL de connexion')
      }
    } catch (err) {
      setError('Erreur lors de la connexion')
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/facebook/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
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

  const handleDisconnect = async () => {
    if (!confirm('Deconnecter Facebook Ads ?')) return
    try {
      const apiBase = resolveApiBase()
      await fetch(`${apiBase}/facebook/disconnect`, { method: 'POST' })
      await loadDashboard()
    } catch (err) {
      setError('Erreur lors de la deconnexion')
    }
  }

  const handleMapAccount = async () => {
    if (!selectedAccount) return
    try {
      setMapping(true)
      setError(null)
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/facebook/map-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, accountId: selectedAccount }),
      })
      const json = await response.json()
      if (json.success) {
        await loadDashboard()
      } else {
        setError(json.error || 'Erreur lors du mapping')
      }
    } catch (err) {
      setError('Erreur lors du mapping du compte')
    } finally {
      setMapping(false)
    }
  }

  const formatCurrency = (value: number, forceUSD = false) => {
    const USD_RATE = 615
    if (showUSD || forceUSD) {
      const usdValue = value / USD_RATE
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(usdValue)
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString('fr-FR')
  }

  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-tribal-accent animate-spin" />
      </div>
    )
  }

  // Not connected state
  if (!data?.connected) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 text-center max-w-md mx-auto">
            <div className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <Facebook className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Connectez Facebook Ads</h2>
            <p className="text-blue-100 mb-6">Synchronisez vos campagnes publicitaires et analysez votre ROI en temps reel avec vos ventes reelles.</p>
            <button onClick={handleConnect} className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-blue-600 font-semibold shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95">
              <Link2 className="h-5 w-5" />
              Connecter mon compte
            </button>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: BarChart3, label: 'Stats campagnes' },
                { icon: DollarSign, label: 'ROI reel' },
                { icon: Target, label: 'Attribution' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-white/80 mx-auto mb-1" />
                  <p className="text-xs text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, title: 'ROAS Temps Reel', description: 'Calculez votre retour sur investissement avec vos vraies ventes', color: 'from-emerald-500 to-teal-500' },
            { icon: ShoppingCart, title: 'Attribution des ventes', description: 'Liez chaque commande a sa campagne Facebook source', color: 'from-purple-500 to-indigo-500' },
            { icon: PieChart, title: 'Analyse par campagne', description: 'Identifiez vos campagnes les plus rentables', color: 'from-orange-500 to-red-500' },
          ].map((feature, i) => (
            <div key={i} className="p-5 rounded-2xl glass">
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${feature.color} mb-3`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/40">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Needs mapping state
  if (data?.needsMapping && data?.availableAccounts) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Facebook className="h-8 w-8 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white">✓ Facebook connecte</span>
                <h2 className="text-xl md:text-2xl font-bold text-white mt-1">Associer un Ad Account a {platformLabels[platform] || platform}</h2>
              </div>
            </div>
            <p className="text-white/90 mb-6">Selectionnez le compte publicitaire Facebook a utiliser pour cette plateforme. Vous avez {data.availableAccounts.length} compte(s) disponible(s).</p>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 text-white mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="space-y-3 mb-6">
              {data.availableAccounts.map((acc) => (
                <button key={acc.id} onClick={() => setSelectedAccount(acc.id)} className={cn(
                  'w-full text-left p-4 rounded-xl transition-all',
                  selectedAccount === acc.id ? 'bg-white text-tribal-black shadow-xl scale-[1.02]' : 'bg-white/10 hover:bg-white/20 text-white'
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{acc.name}</p>
                      <p className={cn('text-sm', selectedAccount === acc.id ? 'text-white/50' : 'text-white/70')}>ID: {acc.accountId} · {acc.currency}</p>
                    </div>
                    {selectedAccount === acc.id && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><span className="text-white text-sm">✓</span></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleMapAccount} disabled={!selectedAccount || mapping} className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all',
                selectedAccount ? 'bg-white text-teal-600 hover:shadow-xl active:scale-95' : 'bg-white/20 text-white/50 cursor-not-allowed'
              )}>
                {mapping ? (<><RefreshCw className="h-5 w-5 animate-spin" />Association...</>) : (<><Link2 className="h-5 w-5" />Associer ce compte</>)}
              </button>
              <button onClick={handleDisconnect} className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Deconnecter Facebook">
                <Unlink className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Connected state with dashboard
  if (!data.stats || !data.account) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-tribal-accent animate-spin" />
        <span className="ml-3 text-white/50">Chargement des donnees...</span>
      </div>
    )
  }

  const stats = data.stats
  const account = data.account
  const isPositiveRoas = stats.roas >= 1

  return (
    <div className="space-y-4">
      {/* Header avec compte connecte */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-900/30">
            <Facebook className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{account.accountName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/30 text-emerald-400">Connecte</span>
            </div>
            <p className="text-xs text-white/40">Derniere sync: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString('fr-FR') : 'Jamais'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowUSD(!showUSD)} className={cn(
            'px-3 py-2 rounded-xl text-xs font-bold transition-all',
            showUSD ? 'bg-green-900/30 text-green-400' : 'bg-white/[0.04] text-white/60'
          )}>
            {showUSD ? '$ USD' : 'FCFA'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1">
              {(['7d', '30d', '90d'] as const).map(p => (
                <button key={p} onClick={() => selectQuickFilter(p)} className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  quickFilter === p ? 'bg-white/[0.08] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                )}>
                  {p === '7d' ? '7J' : p === '30d' ? '30J' : '90J'}
                </button>
              ))}
            </div>

            <select value={selectedYear} onChange={(e) => selectYear(Number(e.target.value))} className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
              !quickFilter ? 'bg-blue-900/30 text-blue-400' : 'bg-white/[0.04] text-white/60'
            )}>
              {AVAILABLE_YEARS.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>

            <select value={selectedMonth ?? ''} onChange={(e) => selectMonth(e.target.value === '' ? null : Number(e.target.value))} className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
              selectedMonth !== null && !quickFilter ? 'bg-purple-900/30 text-purple-400' : 'bg-white/[0.04] text-white/60'
            )}>
              <option value="">Toute l'annee</option>
              {MONTHS.map((month, idx) => (<option key={idx} value={idx}>{month}</option>))}
            </select>

            <span className="text-xs text-white/40 bg-white/[0.04] px-2 py-1 rounded-lg">📅 {getFilterLabel()}</span>
          </div>

          <button onClick={handleSync} disabled={syncing} className="p-2.5 rounded-xl bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-colors active:scale-95">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={handleDisconnect} className="p-2.5 rounded-xl text-red-500 hover:bg-red-900/30 transition-colors active:scale-95">
            <Unlink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Depenses" value={formatCurrency(stats.spend)} subtitle={`≈ ${formatCurrency(stats.spend, true)}`} color="from-red-500 to-orange-500" />
        <StatCard icon={ShoppingCart} label="Revenus FB" value={formatCurrency(stats.revenue)} subtitle={`${stats.orders} cmd · ≈ ${formatCurrency(stats.revenue, true)}`} color="from-emerald-500 to-teal-500" />
        <StatCard icon={isPositiveRoas ? TrendingUp : TrendingDown} label="ROAS" value={`${stats.roas.toFixed(2)}x`} subtitle={isPositiveRoas ? 'Rentable' : 'A optimiser'} color={isPositiveRoas ? 'from-emerald-500 to-green-500' : 'from-red-500 to-pink-500'} highlight={!isPositiveRoas} />
        <StatCard icon={Zap} label="Profit Net" value={formatCurrency(stats.revenue - stats.spend)} subtitle={`≈ ${formatCurrency(stats.revenue - stats.spend, true)}`} color={stats.revenue > stats.spend ? 'from-blue-500 to-indigo-500' : 'from-slate-500 to-slate-600'} />
      </div>

      {/* Metriques de performance */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStatCard icon={Eye} label="Impressions" value={formatNumber(stats.impressions)} />
        <MiniStatCard icon={MousePointer} label="Clics" value={formatNumber(stats.clicks)} />
        <MiniStatCard icon={Target} label="CTR" value={formatPercent(stats.ctr)} />
        <MiniStatCard icon={DollarSign} label="CPC" value={formatCurrency(stats.cpc)} />
        <MiniStatCard icon={Users} label="Conv. Rate" value={formatPercent(stats.conversionRate)} />
      </div>

      {/* Graphique & Campagnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Performance Publicitaire
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/30">
              <p className="text-xs text-red-400 font-medium mb-1">Total Depense</p>
              <p className="text-lg font-bold text-red-300">{formatCurrency(stats.spend)}</p>
              {showUSD && <p className="text-xs text-red-500/70">{formatCurrency(stats.spend, true)}</p>}
            </div>
            <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/30">
              <p className="text-xs text-emerald-400 font-medium mb-1">Total Revenus</p>
              <p className="text-lg font-bold text-emerald-300">{formatCurrency(stats.revenue)}</p>
              {showUSD && <p className="text-xs text-emerald-500/70">{formatCurrency(stats.revenue, true)}</p>}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/50">Ratio Revenus/Depenses</span>
              <span className={cn('font-bold', stats.roas >= 1 ? 'text-emerald-400' : 'text-red-400')}>{stats.roas.toFixed(2)}x</span>
            </div>
            <div className="h-4 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full flex">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all" style={{ width: `${Math.min(50, (1 / (stats.roas + 1)) * 100)}%` }} />
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${Math.min(100, (stats.roas / (stats.roas + 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className={cn('p-4 rounded-xl text-center', (stats.revenue - stats.spend) >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-gradient-to-br from-red-500 to-pink-500 text-white')}>
            <p className="text-xs opacity-80 mb-1">Profit Net</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.revenue - stats.spend)}</p>
            {showUSD && <p className="text-sm opacity-70">{formatCurrency(stats.revenue - stats.spend, true)}</p>}
          </div>
          {data.dailyData && data.dailyData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/50 mb-2">Evolution des depenses (7 derniers jours)</p>
              <div className="flex items-end gap-1 h-12">
                {data.dailyData.slice(-7).map((day, i) => {
                  const maxSpend = Math.max(...data.dailyData.slice(-7).map(d => d.spend))
                  const height = maxSpend > 0 ? (day.spend / maxSpend) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t" style={{ height: `${Math.max(4, height)}%` }} title={`${new Date(day.date).toLocaleDateString('fr-FR')}: ${formatCurrency(day.spend)}`} />
                      <span className="text-[9px] text-white/40 mt-1">{new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric' })}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top Campagnes */}
        <div className="p-5 rounded-2xl glass">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Campagnes
            <span className="ml-auto text-xs font-normal text-white/50">{(data.topCampaigns || []).filter(c => c.isActive).length} actives</span>
          </h3>
          {data.topCampaigns && data.topCampaigns.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {data.topCampaigns.filter(c => c.spend > 0 || c.isActive).slice(0, 10).map((campaign, i) => (
                <div key={campaign.id} className={cn(
                  'flex items-center justify-between p-3 rounded-xl',
                  campaign.isActive ? 'bg-emerald-900/20 border border-emerald-800/50' : 'bg-white/[0.03]'
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', campaign.isActive ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-white/[0.08]')}>{i + 1}</span>
                      {campaign.isActive && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-tribal-black animate-pulse" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm truncate">{campaign.name}</p>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', campaign.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-white/[0.04] text-white/40')}>
                          {campaign.isActive ? 'Active' : 'Pause'}
                        </span>
                      </div>
                      <p className="text-xs text-white/40">{formatCurrency(campaign.spend)} · {formatNumber(campaign.impressions || 0)} imp · {formatNumber(campaign.clicks || 0)} clics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-bold text-sm', campaign.roas >= 1 ? 'text-emerald-400' : 'text-white/40')}>{campaign.roas > 0 ? `${campaign.roas.toFixed(2)}x` : '-'}</p>
                    <p className="text-xs text-white/40">{campaign.revenue > 0 ? formatCurrency(campaign.revenue) : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune campagne</p>
              <p className="text-xs mt-1">Synchronisez pour voir vos campagnes</p>
            </div>
          )}
        </div>
      </div>

      {/* Lien vers Facebook Ads Manager */}
      <a
        href="https://business.facebook.com/adsmanager"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors text-sm font-medium"
      >
        <ExternalLink className="h-4 w-4" />
        Ouvrir Facebook Ads Manager
      </a>
    </div>
  )
}

// SOUS-COMPOSANTS

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle?: string
  color: string
  highlight?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subtitle, color, highlight }) => (
  <div className={cn(
    'relative overflow-hidden rounded-2xl p-4 md:p-5 glass',
    highlight && 'ring-2 ring-red-500/50'
  )}>
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

interface MiniStatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const MiniStatCard: React.FC<MiniStatCardProps> = ({ icon: Icon, label, value }) => (
  <div className="p-3 rounded-xl glass">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-3.5 w-3.5 text-white/40" />
      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
)

export default FacebookAdsDashboard
