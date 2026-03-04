/**
 * TRIBAL ANALYST - Panel Insights Business
 * Affiche les insights automatiques et KPIs cles
 */

import {
  X,
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Info,
  ShoppingCart,
  DollarSign,
  Users,
  Loader2,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useBusinessInsights, useRefreshAnalystCache } from '../hooks/useTribalAnalyst'

interface AnalystInsightsPanelProps {
  onClose: () => void
  isFullPage?: boolean
}

export function AnalystInsightsPanel({ onClose, isFullPage }: AnalystInsightsPanelProps) {
  const { data, isLoading, refetch } = useBusinessInsights()
  const refreshCache = useRefreshAnalystCache()

  const handleRefresh = async () => {
    await refreshCache.mutateAsync()
    refetch()
  }

  const snapshot = data?.snapshot
  const insights = data?.insights || []

  const isRefreshing = refreshCache.isPending

  return (
    <div
      className={cn(
        'flex flex-col h-full overflow-hidden',
        isFullPage
          ? 'w-full bg-tribal-black'
          : 'w-80 lg:w-96 border-l border-white/[0.06] bg-white/[0.03]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-tribal-accent/5 to-indigo-500/5">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-tribal-accent" />
          <h2 className="font-semibold text-white text-sm">Insights Business</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/40 transition-colors disabled:opacity-50"
            title="Rafraichir les donnees"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </button>
          {!isFullPage && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 overflow-y-auto p-4',
          isFullPage ? 'max-w-4xl mx-auto w-full space-y-6' : 'space-y-4'
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-tribal-accent animate-spin" />
              <p className="text-sm text-white/40">Chargement des donnees...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {snapshot && <KpiCards snapshot={snapshot} />}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Alertes & Insights
                </h3>
                {insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            )}

            {insights.length === 0 && snapshot && (
              <div className="rounded-lg bg-blue-900/20 border border-blue-800/40 p-3">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-300">
                    Tout semble en ordre ! Aucune alerte pour le moment.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────

function KpiCards({
  snapshot,
}: {
  snapshot: NonNullable<ReturnType<typeof useBusinessInsights>['data']>['snapshot']
}) {
  const { orders, accounting, customers, products } = snapshot

  const revenueChange =
    accounting.previousMonth.revenue > 0
      ? ((accounting.currentMonth.revenue - accounting.previousMonth.revenue) /
          accounting.previousMonth.revenue) *
        100
      : 0

  const ordersChange =
    orders.previousMonth.count > 0
      ? ((orders.currentMonth.count - orders.previousMonth.count) / orders.previousMonth.count) *
        100
      : 0

  const customersChange =
    customers.newPreviousMonth > 0
      ? ((customers.newThisMonth - customers.newPreviousMonth) / customers.newPreviousMonth) * 100
      : 0

  const kpis = [
    {
      label: 'CA ce mois',
      value: formatCurrency(accounting.currentMonth.revenue),
      change: revenueChange,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-900/20',
    },
    {
      label: 'Commandes',
      value: String(orders.currentMonth.count),
      change: ordersChange,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bg: 'bg-blue-900/20',
    },
    {
      label: 'Nouveaux clients',
      value: String(customers.newThisMonth),
      change: customersChange,
      icon: Users,
      color: 'text-violet-500',
      bg: 'bg-violet-900/20',
    },
    {
      label: 'Benefice',
      value: formatCurrency(accounting.currentMonth.profit),
      icon: TrendingUp,
      color: accounting.currentMonth.profit >= 0 ? 'text-emerald-500' : 'text-red-500',
      bg:
        accounting.currentMonth.profit >= 0
          ? 'bg-emerald-900/20'
          : 'bg-red-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {kpis.map(kpi => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/[0.06] p-3"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', kpi.bg)}>
                <Icon className={cn('w-3.5 h-3.5', kpi.color)} />
              </div>
              <span className="text-[10px] text-white/40 font-medium truncate">
                {kpi.label}
              </span>
            </div>
            <div className="text-sm font-bold text-white">{kpi.value}</div>
            {kpi.change !== undefined && kpi.change !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-[10px] font-medium mt-0.5',
                  kpi.change > 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {kpi.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {kpi.change > 0 ? '+' : ''}
                  {kpi.change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* Extra KPIs row */}
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <MiniKpi label="Panier moyen" value={formatCurrency(orders.averageOrderValue)} />
        <MiniKpi
          label="Stock bas"
          value={String(products.lowStock)}
          alert={products.lowStock > 0}
        />
        <MiniKpi
          label="Rupture"
          value={String(products.outOfStock)}
          alert={products.outOfStock > 0}
        />
      </div>
    </div>
  )
}

function MiniKpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg p-2 text-center border',
        alert
          ? 'border-amber-800/40 bg-amber-900/20'
          : 'border-white/[0.06] bg-white/[0.03]'
      )}
    >
      <div
        className={cn(
          'text-xs font-bold',
          alert ? 'text-amber-400' : 'text-white'
        )}
      >
        {value}
      </div>
      <div className="text-[9px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}

// ─── Insight Card ────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: {
    type: string
    severity: string
    title: string
    description: string
    value?: string | number
    change?: number
  }
}

function InsightCard({ insight }: InsightCardProps) {
  const config = {
    alert: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-900/20',
      border: 'border-red-800/40',
    },
    opportunity: {
      icon: Lightbulb,
      color: 'text-amber-500',
      bg: 'bg-amber-900/20',
      border: 'border-amber-800/40',
    },
    trend: {
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-900/20',
      border: 'border-blue-800/40',
    },
    info: {
      icon: Info,
      color: 'text-white/50',
      bg: 'bg-white/[0.03]',
      border: 'border-white/[0.06]',
    },
  }

  const c = config[insight.type as keyof typeof config] || config.info
  const Icon = c.icon

  return (
    <div className={cn('rounded-lg border p-3', c.border, c.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', c.color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white/80">
              {insight.title}
            </span>
            {insight.severity === 'high' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-medium shrink-0">
                Urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
            {insight.description}
          </p>
          {insight.value !== undefined && (
            <div className="mt-1 text-xs font-medium text-white/80">
              {insight.value}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M F`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k F`
  return `${amount.toFixed(0)} F`
}
