/**
 * Graphique en donut affichant la répartition des revenus par source
 * Affiche les tenants Print (Tribal Print, Jericho, Muslim, Verra), Agency et Kaui
 */
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Printer, Briefcase, Cloud, TrendingUp, RefreshCw, Layers } from 'lucide-react'
import type { UnifiedRevenuesSummary, PrintTenantSlug } from '../../lib/hooks/useUnifiedRevenues'

interface RevenueBySourceChartProps {
  summary: UnifiedRevenuesSummary | null
  loading?: boolean
  onRefresh?: () => void
  className?: string
}

// Configuration des sources avec leurs couleurs et icônes
const SOURCE_DISPLAY_CONFIG: Record<
  string,
  {
    label: string
    color: string
    bgColor: string
    lightBg: string
    textColor: string
    icon: React.FC<{ className?: string }>
  }
> = {
  // Print tenants
  'tribal-print': {
    label: 'Tribal Print',
    color: '#3b82f6', // blue-500
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-950/30',
    textColor: 'text-blue-400',
    icon: Printer,
  },
  'jericho-print': {
    label: 'Jericho Print',
    color: '#06b6d4', // cyan-500
    bgColor: 'bg-cyan-500',
    lightBg: 'bg-cyan-950/30',
    textColor: 'text-cyan-400',
    icon: Printer,
  },
  'muslim-print': {
    label: 'Muslim Print',
    color: '#14b8a6', // teal-500
    bgColor: 'bg-teal-500',
    lightBg: 'bg-teal-950/30',
    textColor: 'text-teal-400',
    icon: Printer,
  },
  'tribal-verra': {
    label: 'Tribal Verra',
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-950/30',
    textColor: 'text-amber-400',
    icon: Layers,
  },
  unknown: {
    label: 'Non identifié',
    color: '#64748b', // slate-500
    bgColor: 'bg-slate-500',
    lightBg: 'bg-slate-950/30',
    textColor: 'text-slate-400',
    icon: Printer,
  },
  // Other sources
  AGENCY: {
    label: 'Agency',
    color: '#8b5cf6', // violet-500
    bgColor: 'bg-violet-500',
    lightBg: 'bg-violet-950/30',
    textColor: 'text-violet-400',
    icon: Briefcase,
  },
  KAUI: {
    label: 'Kaui (SaaS)',
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-950/30',
    textColor: 'text-emerald-400',
    icon: Cloud,
  },
  QUOTE: {
    label: 'Devis',
    color: '#ec4899', // pink-500
    bgColor: 'bg-pink-500',
    lightBg: 'bg-pink-950/30',
    textColor: 'text-pink-400',
    icon: Briefcase,
  },
}

// Ordre d'affichage des sources
const DISPLAY_ORDER: string[] = [
  'tribal-print',
  'jericho-print',
  'muslim-print',
  'tribal-verra',
  'QUOTE',
  'AGENCY',
  'KAUI',
]

// Composant Donut personnalisé avec animation
const AnimatedDonut: React.FC<{
  data: { value: number; color: string; label: string }[]
  size?: number
  strokeWidth?: number
}> = ({ data, size = 180, strokeWidth = 24 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1

  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Cercle de fond */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/[0.06]"
      />
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
        {data.map((d, i) => {
          const frac = Math.max(0, d.value) / total
          const length = frac * circumference
          const dasharray = `${length} ${circumference - length}`

          const circle = (
            <motion.circle
              key={i}
              r={radius}
              fill="transparent"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: dasharray }}
              transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
            >
              <title>{`${d.label}: ${d.value.toLocaleString('fr-FR')} XOF`}</title>
            </motion.circle>
          )
          offset += length
          return circle
        })}
      </g>
    </svg>
  )
}

// Formater le montant (affichage complet sans abréviation)
function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR')
}

// Calculer le pourcentage
function calcPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export const RevenueBySourceChart: React.FC<RevenueBySourceChartProps> = ({
  summary,
  loading = false,
  onRefresh,
  className = '',
}) => {
  // Préparer les données combinées (tenants PRINT + AGENCY + KAUI)
  const combinedData = useMemo(() => {
    if (!summary) return []

    const data: { key: string; revenue: number; count: number }[] = []

    // Ajouter les tenants PRINT depuis byPrintTenant
    if (summary.byPrintTenant) {
      const tenantKeys: PrintTenantSlug[] = [
        'tribal-print',
        'jericho-print',
        'muslim-print',
        'tribal-verra',
      ]
      for (const key of tenantKeys) {
        const tenant = summary.byPrintTenant[key]
        // Toujours ajouter, même si count = 0
        data.push({
          key,
          revenue: tenant?.revenue ?? 0,
          count: tenant?.count ?? 0,
        })
      }
    } else {
      // Fallback si byPrintTenant n'existe pas: afficher PRINT global
      const print = summary.bySource.PRINT
      if (print) {
        data.push({
          key: 'PRINT',
          revenue: print.revenue,
          count: print.count,
        })
      }
    }

    // Toujours ajouter AGENCY
    const agency = summary.bySource.AGENCY
    data.push({
      key: 'AGENCY',
      revenue: agency?.revenue ?? 0,
      count: agency?.count ?? 0,
    })

    // Toujours ajouter QUOTE (Devis)
    const quote = summary.bySource.QUOTE
    data.push({
      key: 'QUOTE',
      revenue: quote?.revenue ?? 0,
      count: quote?.count ?? 0,
    })

    // Toujours ajouter KAUI
    const kaui = summary.bySource.KAUI
    data.push({
      key: 'KAUI',
      revenue: kaui?.revenue ?? 0,
      count: kaui?.count ?? 0,
    })

    // Trier par ordre d'affichage
    return data.sort((a, b) => DISPLAY_ORDER.indexOf(a.key) - DISPLAY_ORDER.indexOf(b.key))
  }, [summary])

  // Données pour le graphique donut
  const chartData = useMemo(() => {
    return combinedData.map(item => ({
      value: item.revenue,
      color: SOURCE_DISPLAY_CONFIG[item.key]?.color ?? '#64748b',
      label: SOURCE_DISPLAY_CONFIG[item.key]?.label ?? item.key,
    }))
  }, [combinedData])

  const totalRevenue = summary?.totals.revenue ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Revenus par source</h3>
            <p className="text-sm text-white/40">Répartition des revenus</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !summary ? (
        <div className="flex items-center justify-center h-48 text-white/40">
          Aucune donnée disponible
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <AnimatedDonut data={chartData} size={180} strokeWidth={24} />
            {/* Centre du donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {formatAmount(totalRevenue)}
              </span>
              <span className="text-xs text-white/40">XOF Total</span>
            </div>
          </div>

          {/* Légende */}
          <div className="flex-1 space-y-2 w-full max-h-64 overflow-y-auto">
            {combinedData.map((item, index) => {
              const config = SOURCE_DISPLAY_CONFIG[item.key]
              if (!config) return null
              const Icon = config.icon
              const percent = calcPercent(item.revenue, totalRevenue)

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl ${config.lightBg} transition-all hover:scale-[1.02]`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">
                        {config.label}
                      </span>
                      <span className={`font-bold text-sm ${config.textColor}`}>{percent}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">
                        {item.count} {item.count > 1 ? 'entrées' : 'entrée'}
                      </span>
                      <span className="font-medium text-white/60">
                        {formatAmount(item.revenue)} XOF
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer stats */}
      {summary && (
        <div className="mt-6 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-400">
              {formatAmount(summary.totals.paid)}
            </div>
            <div className="text-xs text-white/40">Payé</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">
              {formatAmount(summary.totals.pending)}
            </div>
            <div className="text-xs text-white/40">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white/60">
              {summary.totals.count}
            </div>
            <div className="text-xs text-white/40">Total entrées</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default RevenueBySourceChart
