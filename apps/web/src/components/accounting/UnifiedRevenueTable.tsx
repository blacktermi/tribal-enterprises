/**
 * Tableau des revenus unifiés avec filtres et pagination
 * Affiche les revenus de Print, Agency et Kaui
 */
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Printer,
  Briefcase,
  Cloud,
  CheckCircle2,
  Clock,
  CreditCard,
  MoreVertical,
  Eye,
  RefreshCw,
  Download,
  FileText,
} from 'lucide-react'
import type {
  UnifiedRevenue,
  UnifiedRevenuesPagination,
  RevenueSource,
  RevenueType,
} from '../../lib/hooks/useUnifiedRevenues'

interface UnifiedRevenueTableProps {
  data: UnifiedRevenue[]
  pagination: UnifiedRevenuesPagination | null
  loading?: boolean
  onPageChange?: (page: number) => void
  onRecordPayment?: (revenue: UnifiedRevenue) => void
  onViewDetails?: (revenue: UnifiedRevenue) => void
  onRefresh?: () => void
  className?: string
}

// Configuration des sources
const SOURCE_CONFIG: Record<
  RevenueSource,
  { label: string; color: string; bgColor: string; icon: React.FC<{ className?: string }> }
> = {
  PRINT: {
    label: 'Print',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    icon: Printer,
  },
  AGENCY: {
    label: 'Agency',
    color: 'text-violet-400',
    bgColor: 'bg-violet-900/30',
    icon: Briefcase,
  },
  KAUI: {
    label: 'Kaui',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    icon: Cloud,
  },
  QUOTE: {
    label: 'Devis',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    icon: FileText,
  },
}

// Configuration des tenants PRINT pour le badge
const PRINT_TENANT_CONFIG: Record<
  string,
  { label: string; shortLabel: string; color: string; bgColor: string }
> = {
  'tribal-print': {
    label: 'Tribal Print',
    shortLabel: 'Tribal',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
  },
  'jericho-print': {
    label: 'Jericho Print',
    shortLabel: 'Jericho',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/30',
  },
  'muslim-print': {
    label: 'Muslim Print',
    shortLabel: 'Muslim',
    color: 'text-teal-400',
    bgColor: 'bg-teal-900/30',
  },
  'tribal-verra': {
    label: 'Tribal Verra',
    shortLabel: 'Verra',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
  },
}

// Configuration des types
const TYPE_LABELS: Record<RevenueType, string> = {
  SUBSCRIPTION: 'Abonnement',
  PROJECT: 'Projet',
  PRODUCT: 'Produit',
}

// Formater le montant
function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' XOF'
}

// Formater la date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Badge source - affiche le tenant pour PRINT
const SourceBadge: React.FC<{ source: RevenueSource; metadata?: Record<string, unknown> }> = ({
  source,
  metadata,
}) => {
  const baseConfig = SOURCE_CONFIG[source]
  const Icon = baseConfig.icon

  // Pour les sources PRINT, utiliser le tenant si disponible
  if (source === 'PRINT' && metadata?.tenantSlug) {
    const tenantSlug = metadata.tenantSlug as string
    const tenantConfig = PRINT_TENANT_CONFIG[tenantSlug]
    if (tenantConfig) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${tenantConfig.bgColor} ${tenantConfig.color}`}
          title={tenantConfig.label}
        >
          <Icon className="w-3 h-3" />
          {tenantConfig.shortLabel}
        </span>
      )
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${baseConfig.bgColor} ${baseConfig.color}`}
    >
      <Icon className="w-3 h-3" />
      {baseConfig.label}
    </span>
  )
}

// Badge statut
const StatusBadge: React.FC<{ isPaid: boolean; balance: number }> = ({ isPaid, balance }) => {
  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        Payé
      </span>
    )
  }
  if (balance > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400">
        <Clock className="w-3 h-3" />
        Partiel
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
      <Clock className="w-3 h-3" />
      En attente
    </span>
  )
}

export const UnifiedRevenueTable: React.FC<UnifiedRevenueTableProps> = ({
  data,
  pagination,
  loading = false,
  onPageChange,
  onRecordPayment,
  onViewDetails,
  onRefresh,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<RevenueSource | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'balance'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Filtrer les données localement
  const filteredData = useMemo(() => {
    return data.filter(revenue => {
      // Filtre de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesClient = revenue.clientName?.toLowerCase().includes(term)
        const matchesRef = revenue.sourceRef?.toLowerCase().includes(term)
        const matchesDescription = revenue.description?.toLowerCase().includes(term)
        if (!matchesClient && !matchesRef && !matchesDescription) return false
      }

      // Filtre source
      if (sourceFilter !== 'all' && revenue.source !== sourceFilter) return false

      // Filtre statut
      if (statusFilter === 'paid' && !revenue.isPaid) return false
      if (statusFilter === 'pending' && revenue.isPaid) return false
      if (
        statusFilter === 'balance' &&
        (revenue.isPaid || revenue.balance <= 0 || revenue.paidAmount <= 0)
      )
        return false

      return true
    })
  }, [data, searchTerm, sourceFilter, statusFilter])

  // Gérer le menu contextuel
  const handleMenuToggle = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header avec filtres */}
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher client, référence..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
            />
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/40" />

            {/* Filtre source */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as RevenueSource | 'all')}
              className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40"
            >
              <option value="all" className="text-gray-900">Toutes sources</option>
              <option value="PRINT" className="text-gray-900">Print</option>
              <option value="AGENCY" className="text-gray-900">Agency</option>
              <option value="KAUI" className="text-gray-900">Kaui</option>
            </select>

            {/* Filtre statut */}
            <select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'all' | 'paid' | 'pending' | 'balance')
              }
              className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40"
            >
              <option value="all" className="text-gray-900">Tous statuts</option>
              <option value="paid" className="text-gray-900">Payé</option>
              <option value="pending" className="text-gray-900">En attente</option>
              <option value="balance" className="text-gray-900">Soldes impayés</option>
            </select>

            {/* Bouton refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/40">
            <Download className="w-12 h-12 mb-3 opacity-30" />
            <p>Aucun revenu trouvé</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-tribal-accent hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Client / Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Payé
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Solde
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <AnimatePresence mode="popLayout">
                {filteredData.map((revenue, index) => {
                  // Exclure les frais de livraison des montants affichés
                  const metadata = revenue.metadata as Record<string, unknown> | null
                  const deliveryFee = (metadata?.deliveryFee as number) || 0
                  const amountProduits = revenue.amount - deliveryFee
                  // Plafonner le montant payé au montant produit (le client a pu payer livraison incluse)
                  const adjustedPaid = Math.min(revenue.paidAmount, amountProduits)
                  const adjustedBalance = Math.max(0, amountProduits - adjustedPaid)

                  return (
                    <motion.tr
                      key={revenue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <SourceBadge source={revenue.source} metadata={revenue.metadata} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {revenue.clientName || 'Client inconnu'}
                        </div>
                        {revenue.sourceRef && (
                          <div className="text-xs text-white/40">
                            #{revenue.sourceRef}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/60">
                          {TYPE_LABELS[revenue.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-white">
                          {formatAmount(amountProduits)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            adjustedPaid > 0
                              ? 'text-emerald-400'
                              : 'text-white/40'
                          }`}
                        >
                          {formatAmount(adjustedPaid)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            adjustedBalance > 0
                              ? 'text-amber-400'
                              : 'text-white/40'
                          }`}
                        >
                          {adjustedBalance > 0 ? formatAmount(adjustedBalance) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge isPaid={revenue.isPaid} balance={adjustedBalance} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/60">
                          {formatDate(revenue.invoiceDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex items-center justify-center gap-1">
                          {/* Bouton direct Payer solde si balance > 0 */}
                          {!revenue.isPaid && adjustedBalance > 0 && onRecordPayment && (
                            <button
                              onClick={() => onRecordPayment(revenue)}
                              className="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-900/30 rounded hover:bg-emerald-900/50 transition-colors"
                            >
                              Payer solde
                            </button>
                          )}
                          <button
                            onClick={() => handleMenuToggle(revenue.id)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-white/50" />
                          </button>

                          {/* Menu déroulant */}
                          <AnimatePresence>
                            {openMenuId === revenue.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-tribal-gray rounded-lg shadow-lg border border-white/[0.06] py-1 z-50"
                                onClick={() => setOpenMenuId(null)}
                              >
                                {onViewDetails && (
                                  <button
                                    onClick={() => onViewDetails(revenue)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Voir détails
                                  </button>
                                )}
                                {onRecordPayment && !revenue.isPaid && (
                                  <button
                                    onClick={() => onRecordPayment(revenue)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/[0.06]"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    Enregistrer paiement
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="text-sm text-white/40">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default UnifiedRevenueTable
