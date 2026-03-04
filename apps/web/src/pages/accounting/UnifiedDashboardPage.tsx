/**
 * Page du tableau de bord comptable unifié
 * Affiche les revenus consolidés de Print, Agency et Kaui
 */
import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
 RefreshCw,
 TrendingUp,
 DollarSign,
 Clock,
 CheckCircle2,
 AlertCircle,
 Download,
 Printer,
 Briefcase,
 Cloud,
 AlertTriangle,
} from 'lucide-react'
import { AccountingFiltersBar } from '../../components/accounting/AccountingFiltersBar'
import { RevenueBySourceChart } from '../../components/accounting/RevenueBySourceChart'
import { SaasMetricsCard } from '../../components/accounting/SaasMetricsCard'
import { UnifiedRevenueTable } from '../../components/accounting/UnifiedRevenueTable'
import { PaymentModal } from '../../components/accounting/PaymentModal'
import {
 useUnifiedRevenues,
 syncRevenues,
 type UnifiedRevenue,
} from '../../lib/hooks/useUnifiedRevenues'
import { useSaasMetrics } from '../../lib/hooks/useSaasMetrics'
import { useDateFilters } from '../../lib/hooks/useDateFilters'
import { useAccountingFilters, filterRevenuesByPlatform } from '../../store/accountingFilters'
import { KpiCard } from '../../components/KpiCard'

// Formater le montant (affichage complet sans abréviation)
function formatAmount(amount: number): string {
 return `${amount.toLocaleString('fr-FR')} XOF`
}

export const UnifiedDashboardPage: React.FC = () => {
 // Filtres de date globaux
 const { startDate, endDate } = useDateFilters()

 // Filtre de plateforme global
 const { selectedPlatform } = useAccountingFilters()

 // Hooks de données avec filtres de date
 const {
 data: rawRevenues,
 pagination,
 summary,
 loading: revenuesLoading,
 error: revenuesError,
 refresh: refreshRevenues,
 setFilters,
 } = useUnifiedRevenues({
 filters: {
 startDate,
 endDate,
 },
 })

 // Appliquer le filtre de plateforme côté client
 const revenues = useMemo(
 () => filterRevenuesByPlatform(rawRevenues, selectedPlatform),
 [rawRevenues, selectedPlatform]
 )

 const {
 current: saasMetrics,
 trends: saasTrends,
 loading: saasLoading,
 refresh: refreshSaas,
 } = useSaasMetrics()

 // État local
 const [isSyncing, setIsSyncing] = useState(false)
 const [syncMessage, setSyncMessage] = useState<{
 type: 'success' | 'error'
 text: string
 } | null>(null)
 const [paymentModalRevenue, setPaymentModalRevenue] = useState<UnifiedRevenue | null>(null)

 // Synchroniser les données
 const handleSync = useCallback(async () => {
 setIsSyncing(true)
 setSyncMessage(null)
 try {
 const result = await syncRevenues(['PRINT', 'AGENCY', 'KAUI', 'QUOTE'])
 setSyncMessage({
 type: 'success',
 text: `Synchronisation réussie : ${result.total} revenus mis à jour`,
 })
 refreshRevenues()
 refreshSaas()
 } catch (err) {
 setSyncMessage({
 type: 'error',
 text: (err as Error).message || 'Erreur de synchronisation',
 })
 } finally {
 setIsSyncing(false)
 // Effacer le message après 5 secondes
 setTimeout(() => setSyncMessage(null), 5000)
 }
 }, [refreshRevenues, refreshSaas])

 // Gérer la pagination
 const handlePageChange = useCallback(
 (page: number) => {
 setFilters({ page })
 },
 [setFilters]
 )

 // Ouvrir le modal de paiement
 const handleRecordPayment = useCallback((revenue: UnifiedRevenue) => {
 setPaymentModalRevenue(revenue)
 }, [])

 // Fermer le modal
 const handleClosePaymentModal = useCallback(() => {
 setPaymentModalRevenue(null)
 }, [])

 // Après un paiement réussi
 const handlePaymentSuccess = useCallback(() => {
 refreshRevenues()
 }, [refreshRevenues])

 // Combiné loading
 const isLoading = revenuesLoading || saasLoading

 return (
 <div>
 {/* Header avec filtres */}
 <AccountingFiltersBar title="Revenus Unifiés" subtitle="Print, Agency & Kaui consolidés" />

 <div className="p-6 space-y-6">
 {/* Barre d'actions */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold font-display text-white">
 Tableau de Bord Comptable
 </h1>
 <p className="text-white/50">
 Vue consolidée des revenus de toutes les plateformes
 </p>
 </div>

 <div className="flex items-center gap-3">
 {/* Message de sync */}
 {syncMessage && (
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0 }}
 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
 syncMessage.type === 'success'
 ? ' text-emerald-400'
 : ' text-red-400'
 }`}
 >
 {syncMessage.type === 'success' ? (
 <CheckCircle2 className="w-4 h-4" />
 ) : (
 <AlertCircle className="w-4 h-4" />
 )}
 {syncMessage.text}
 </motion.div>
 )}

 {/* Bouton de sync */}
 <button
 onClick={handleSync}
 disabled={isSyncing}
 className="flex items-center gap-2 px-4 py-2 bg-tribal-accent text-tribal-black hover:bg-tribal-accent-light text-white rounded-lg font-medium transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
 {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
 </button>

 {/* Export CSV */}
 <button
 onClick={() => {
 if (revenues.length === 0) return
 const header = ['Ref', 'Source', 'Client', 'Date', 'Montant', 'Paye', 'Solde', 'Statut']
 const rows = revenues.map(r => [
 r.sourceRef || '',
 r.source || '',
 r.clientName || '',
 (r.invoiceDate || r.createdAt || '').slice(0, 10),
 r.amount,
 r.paidAmount,
 r.balance,
 r.isPaid ? 'Paye' : 'Impaye',
 ])
 const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `revenus-unifies-${new Date().toISOString().slice(0, 10)}.csv`
 a.click()
 URL.revokeObjectURL(url)
 }}
 disabled={revenues.length === 0}
 className="flex items-center gap-2 px-4 py-2 border border-white/[0.06] bg-white/[0.03] text-white/80 rounded-lg font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Download className="w-4 h-4" />
 Exporter
 </button>
 </div>
 </div>

 {/* Erreur */}
 {revenuesError && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-4 rounded-xl bg-red-950/30 border border-white/[0.06] flex items-center gap-3"
 >
 <AlertCircle className="w-5 h-5 text-red-400" />
 <div>
 <p className="font-medium text-red-300">Erreur de chargement</p>
 <p className="text-sm text-red-400">{revenuesError}</p>
 </div>
 <button
 onClick={refreshRevenues}
 className="ml-auto px-3 py-1.5 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40"
 >
 Réessayer
 </button>
 </motion.div>
 )}

 {/* KPIs principaux */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <KpiCard
 title="Revenu Total"
 value={formatAmount(summary?.totals.revenue ?? 0)}
 subtitle={`${summary?.totals.count ?? 0} entrées`}
 icon={<TrendingUp className="w-5 h-5 text-white" />}
 containerClassName="from-indigo-900/20 to-indigo-800/10"
 titleClassName="text-tribal-accent"
 valueClassName="text-tribal-accent"
 iconBgClassName="from-indigo-500 to-indigo-600"
 animated
 format="currency"
 />
 <KpiCard
 title="Montant Payé"
 value={formatAmount(summary?.totals.paid ?? 0)}
 subtitle="Encaissé"
 icon={<CheckCircle2 className="w-5 h-5 text-white" />}
 containerClassName="from-emerald-900/20 to-emerald-800/10"
 titleClassName="text-emerald-400"
 valueClassName="text-emerald-300"
 iconBgClassName="from-emerald-500 to-emerald-600"
 />
 <KpiCard
 title="En Attente"
 value={formatAmount(summary?.totals.pending ?? 0)}
 subtitle="À encaisser"
 icon={<Clock className="w-5 h-5 text-white" />}
 containerClassName="from-amber-900/20 to-amber-800/10"
 titleClassName="text-amber-400"
 valueClassName="text-amber-300"
 iconBgClassName="from-amber-500 to-amber-600"
 />
 <KpiCard
 title="MRR (Kaui)"
 value={formatAmount(summary?.mrr ?? 0)}
 subtitle={`ARR: ${formatAmount((summary?.mrr ?? 0) * 12)}`}
 icon={<DollarSign className="w-5 h-5 text-white" />}
 containerClassName="from-teal-900/20 to-teal-800/10"
 titleClassName="text-teal-400"
 valueClassName="text-teal-300"
 iconBgClassName="from-teal-500 to-teal-600"
 />
 </div>

 {/* KPIs par source */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-white/[0.06]"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
 <Printer className="w-5 h-5 text-white" />
 </div>
 <div>
 <div className="text-sm font-medium text-blue-400">Print</div>
 <div className="text-xl font-bold text-blue-300">
 {formatAmount(summary?.bySource.PRINT?.revenue ?? 0)}
 </div>
 <div className="text-xs text-blue-400">
 {summary?.bySource.PRINT?.count ?? 0} commandes
 </div>
 </div>
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="p-4 rounded-xl bg-gradient-to-br from-violet-900/20 to-violet-800/10 border border-white/[0.06]"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
 <Briefcase className="w-5 h-5 text-white" />
 </div>
 <div>
 <div className="text-sm font-medium text-violet-400">
 Agency
 </div>
 <div className="text-xl font-bold text-violet-300">
 {formatAmount(summary?.bySource.AGENCY?.revenue ?? 0)}
 </div>
 <div className="text-xs text-violet-400">
 {summary?.bySource.AGENCY?.count ?? 0} projets
 </div>
 </div>
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-white/[0.06]"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
 <Cloud className="w-5 h-5 text-white" />
 </div>
 <div>
 <div className="text-sm font-medium text-emerald-400">
 Kaui (SaaS)
 </div>
 <div className="text-xl font-bold text-emerald-300">
 {formatAmount(summary?.bySource.KAUI?.revenue ?? 0)}
 </div>
 <div className="text-xs text-emerald-400">
 {summary?.bySource.KAUI?.count ?? 0} abonnements
 </div>
 </div>
 </div>
 </motion.div>
 </div>

 {/* Alerte Soldes impayés */}
 {revenues.filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0).length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-4 rounded-xl bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-white/[0.06]"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
 <AlertTriangle className="w-6 h-6 text-white" />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-bold text-amber-300">
 Soldes impayés à recouvrer
 </h3>
 <p className="text-sm text-amber-400 mt-1">
 {revenues.filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0).length}{' '}
 commandes avec acompte ont un solde restant à payer pour un total de{' '}
 <span className="font-bold">
 {formatAmount(
 revenues
 .filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0)
 .reduce((sum, r) => sum + r.balance, 0)
 )}
 </span>
 </p>
 <div className="mt-3 flex flex-wrap gap-2">
 {revenues
 .filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0)
 .slice(0, 5)
 .map(r => (
 <button
 key={r.id}
 onClick={() => handleRecordPayment(r)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/[0.03] border border-white/[0.08] rounded-lg text-amber-300 hover:bg-amber-900/20 transition-colors"
 >
 <span className="font-semibold">{r.sourceRef}</span>
 <span className="text-amber-400">
 {formatAmount(r.balance)}
 </span>
 </button>
 ))}
 {revenues.filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0).length >
 5 && (
 <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-400">
 +
 {revenues.filter(r => !r.isPaid && r.balance > 0 && r.paidAmount > 0).length -
 5}{' '}
 autres
 </span>
 )}
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {/* Graphiques et métriques SaaS */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Graphique camembert */}
 <RevenueBySourceChart summary={summary} loading={isLoading} onRefresh={refreshRevenues} />

 {/* Métriques SaaS */}
 <SaasMetricsCard
 current={saasMetrics}
 trends={saasTrends}
 loading={saasLoading}
 onRefresh={refreshSaas}
 />
 </div>

 {/* Tableau des revenus */}
 <UnifiedRevenueTable
 data={revenues}
 pagination={pagination}
 loading={revenuesLoading}
 onPageChange={handlePageChange}
 onRecordPayment={handleRecordPayment}
 onRefresh={refreshRevenues}
 />

 {/* Modal de paiement */}
 <PaymentModal
 isOpen={!!paymentModalRevenue}
 onClose={handleClosePaymentModal}
 revenue={paymentModalRevenue}
 onSuccess={handlePaymentSuccess}
 />
 </div>
 </div>
 )
}

export default UnifiedDashboardPage
