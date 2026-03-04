/**
 * Carte affichant les métriques SaaS (Kaui)
 * MRR, ARR, Churn Rate, ARPU, Abonnements actifs
 */
import React from 'react'
import { motion } from 'framer-motion'
import {
  Cloud,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react'
import type { SaasMetricsCurrent, SaasMetricsTrends } from '../../lib/hooks/useSaasMetrics'

interface SaasMetricsCardProps {
  current: SaasMetricsCurrent | null
  trends?: SaasMetricsTrends | null
  loading?: boolean
  onRefresh?: () => void
  className?: string
}

// Formater le montant (affichage complet sans abréviation)
function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR')
}

// Formater le pourcentage
function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

// Formater la croissance avec signe
function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Composant pour une métrique individuelle
const MetricItem: React.FC<{
  label: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  colorClass?: string
  delay?: number
}> = ({ label, value, subtitle, icon, trend, colorClass = 'text-white/60', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.3 }}
    className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
  >
    <div className={`p-2 rounded-lg bg-white/[0.04] shadow-sm ${colorClass}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-xl font-bold text-white">{value}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center text-xs font-medium ${
              trend >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-0.5" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-0.5" />
            )}
            {formatGrowth(trend)}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-white/50 mt-0.5">{subtitle}</div>
      )}
    </div>
  </motion.div>
)

export const SaasMetricsCard: React.FC<SaasMetricsCardProps> = ({
  current,
  trends,
  loading = false,
  onRefresh,
  className = '',
}) => {
  const hasData = current !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kaui SaaS</h3>
              <p className="text-sm text-white/70">Métriques d'abonnement</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* MRR & ARR en vedette */}
        {hasData && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70 font-medium">MRR</div>
              <div className="text-2xl font-black text-white mt-1">
                {formatAmount(current.mrr)} <span className="text-sm font-normal">XOF</span>
              </div>
              {trends && (
                <div
                  className={`flex items-center text-sm mt-1 ${
                    trends.mrrGrowth >= 0 ? 'text-emerald-200' : 'text-red-200'
                  }`}
                >
                  {trends.mrrGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {formatGrowth(trends.mrrGrowth)} ce mois
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-white/70 font-medium">ARR</div>
              <div className="text-2xl font-black text-white mt-1">
                {formatAmount(current.arr)} <span className="text-sm font-normal">XOF</span>
              </div>
              <div className="text-sm text-white/60 mt-1">Revenu annuel récurrent</div>
            </div>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <Cloud className="w-12 h-12 mx-auto text-white/30 mb-3" />
            <p className="text-white/40">Aucune donnée SaaS disponible</p>
            <p className="text-sm text-white/50 mt-1">
              Les abonnements Kaui s'afficheront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricItem
              label="Abonnés actifs"
              value={current.activeSubscriptions}
              subtitle="Utilisateurs payants"
              icon={<Users className="w-4 h-4" />}
              colorClass="text-blue-400"
              delay={0}
            />
            <MetricItem
              label="ARPU"
              value={`${formatAmount(current.arpu)} XOF`}
              subtitle="Revenu par utilisateur"
              icon={<DollarSign className="w-4 h-4" />}
              colorClass="text-emerald-400"
              delay={1}
            />
            <MetricItem
              label="Taux de churn"
              value={formatPercent(current.churnRate)}
              subtitle="Ce mois"
              icon={<Percent className="w-4 h-4" />}
              colorClass={current.churnRate > 5 ? 'text-red-600' : 'text-amber-600'}
              delay={2}
            />
            <MetricItem
              label="Cycle"
              value="Mensuel"
              subtitle="Mode de facturation"
              icon={<Calendar className="w-4 h-4" />}
              colorClass="text-violet-400"
              delay={3}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {hasData && current.activeSubscriptions === 0 && (
        <div className="px-5 pb-5">
          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800">
            <p className="text-sm text-amber-200">
              <strong>Conseil :</strong> Lancez des campagnes pour acquérir vos premiers abonnés
              Kaui et voir ces métriques évoluer.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default SaasMetricsCard
