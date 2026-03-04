import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 BookOpen,
 Download,
 Search,
 Calendar,
 ArrowUpRight,
 ArrowDownLeft,
 X,
 Eye,
 FileText,
 ShoppingCart,
 CreditCard,
 Wallet,
 RefreshCw,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import { useUnifiedRevenues, syncRevenues } from '../../lib/hooks/useUnifiedRevenues'
import {
 useAccountingFilters,
 filterRevenuesByPlatform,
 AVAILABLE_YEARS,
 PERIOD_OPTIONS,
 AVAILABLE_MONTHS,
 getYearLabel,
} from '../../store/accountingFilters'
import { cn } from '../../lib/utils'

// Types d'opérations
const OPERATION_TYPES = {
 vente: { label: 'Vente', color: 'emerald', icon: ShoppingCart },
 paiement: { label: 'Paiement', color: 'purple', icon: CreditCard },
 acompte: { label: 'Acompte', color: 'amber', icon: Wallet },
 depense: { label: 'Depense', color: 'rose', icon: Wallet },
}

// Formater la référence de manière lisible
function formatRef(type: 'vente' | 'paiement' | 'depense' | 'acompte', ref: string): string {
 const prefix =
 type === 'vente' ? 'VEN' : type === 'paiement' ? 'ENC' : type === 'acompte' ? 'ACO' : 'DEP'
 const shortId = ref
 .replace(/[^a-zA-Z0-9]/g, '')
 .slice(-4)
 .toUpperCase()
 return `${prefix}-${shortId}`
}

export const JournalPage: React.FC = () => {
 // Filtre global de période (persistant)
 const {
 selectedYear,
 selectedPeriod,
 selectedMonth,
 selectedPlatform,
 setSelectedYear,
 setSelectedPeriod,
 setSelectedMonth,
 } = useAccountingFilters()

 // Calculer les dates de filtre
 const dateFilters = useMemo(() => {
 // Si"Toutes les années" (null), on prend toutes les données depuis 2023
 if (selectedYear === null) {
 return {
 startDate: '2023-01-01',
 endDate: new Date().toISOString().slice(0, 10),
 }
 }
 const year = selectedYear
 let startDate: string
 let endDate: string

 if (selectedPeriod === 'year') {
 startDate = `${year}-01-01`
 endDate = `${year}-12-31`
 } else if (selectedPeriod === 'month' && selectedMonth !== null) {
 const month = String(selectedMonth + 1).padStart(2, '0')
 const lastDay = new Date(year, selectedMonth + 1, 0).getDate()
 startDate = `${year}-${month}-01`
 endDate = `${year}-${month}-${lastDay}`
 } else if (selectedPeriod === 'quarter') {
 const currentMonth = new Date().getMonth()
 const quarterStart = Math.floor(currentMonth / 3) * 3
 const quarterEnd = quarterStart + 2
 startDate = `${year}-${String(quarterStart + 1).padStart(2, '0')}-01`
 const lastDay = new Date(year, quarterEnd + 1, 0).getDate()
 endDate = `${year}-${String(quarterEnd + 1).padStart(2, '0')}-${lastDay}`
 } else {
 // all
 startDate = `${year}-01-01`
 endDate = `${year}-12-31`
 }

 return { startDate, endDate }
 }, [selectedYear, selectedPeriod, selectedMonth])

 // Récupérer les revenus unifiés
 const {
 data: rawRevenues,
 loading,
 refresh,
 } = useUnifiedRevenues({
 filters: {
 startDate: dateFilters.startDate,
 endDate: dateFilters.endDate,
 limit: 500,
 },
 includeSummary: false,
 })

 // Appliquer le filtre de plateforme
 const revenues = useMemo(
 () => filterRevenuesByPlatform(rawRevenues, selectedPlatform),
 [rawRevenues, selectedPlatform]
 )

 // Données store (pour les dépenses manuelles)
 const storeInvoices = useAccountingStore(s => s.invoices)

 const [search, setSearch] = useState('')
 const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')
 const [viewMode, setViewMode] = useState<'simple' | 'comptable'>('simple')
 const [typeFilter, setTypeFilter] = useState<
 'all' | 'vente' | 'paiement' | 'acompte' | 'depense'
 >('all')
 const [showHT, setShowHT] = useState(false)
 const [syncing, setSyncing] = useState(false)

 // Construire les opérations depuis les revenus unifiés
 const operations = useMemo(() => {
 const ops: Array<{
 id: string
 date: string
 type: 'vente' | 'paiement' | 'acompte' | 'depense'
 ref: string
 description: string
 amountHT: number
 amountTTC: number
 customerName?: string
 isPaid: boolean
 expenseCategory?: string
 source?: string
 }> = []

 // 1. Ajouter les ventes depuis les revenus unifiés
 for (const rev of revenues) {
 // Exclure les frais de livraison du montant comptable
 const deliveryFee = ((rev.metadata as Record<string, unknown>)?.deliveryFee as number) || 0
 const amountProduits = rev.amount - deliveryFee // Montant produits uniquement (sans livraison)

 // Opération de vente
 ops.push({
 id: `VEN-${rev.id}`,
 date: rev.invoiceDate,
 type: 'vente',
 ref: rev.sourceRef || rev.sourceId,
 description: `Vente ${rev.description || rev.type}`,
 amountHT: amountProduits,
 amountTTC: amountProduits,
 customerName: rev.clientName,
 isPaid: rev.isPaid,
 source: rev.source,
 })

 // Calculer le ratio pour exclure proportionnellement les frais de livraison des paiements
 const paidRatio = rev.amount > 0 ? amountProduits / rev.amount : 1

 // Si des paiements ont été enregistrés
 if (rev.payments && rev.payments.length > 0) {
 for (const payment of rev.payments) {
 const isDeposit = payment.type === 'DEPOSIT'
 const adjustedPaymentAmount = Math.round(payment.amount * paidRatio)
 ops.push({
 id: `PAY-${payment.id}`,
 date: payment.receivedAt,
 type: isDeposit ? 'acompte' : 'paiement',
 ref: payment.reference || rev.sourceRef || rev.sourceId,
 description: `${isDeposit ? 'Acompte' : 'Encaissement'} ${rev.clientName}${payment.method ? ` (${payment.method})` : ''}`,
 amountHT: adjustedPaymentAmount,
 amountTTC: adjustedPaymentAmount,
 customerName: rev.clientName,
 isPaid: true,
 source: rev.source,
 })
 }
 } else if (rev.isPaid && rev.paidAmount > 0) {
 // Paiement complet sans détails de paiement
 // Utiliser invoiceDate car paidAt est souvent la date de sync
 const paymentMethod =
 ((rev.metadata as Record<string, unknown>)?.paymentMethod as string) || ''
 // Le montant payé est affiché tel quel (c'est un montant réel versé)
 ops.push({
 id: `PAY-${rev.id}`,
 date: rev.invoiceDate, // Date de commande (plus fiable que paidAt)
 type: 'paiement',
 ref: rev.sourceRef || rev.sourceId,
 description: `Encaissement ${rev.clientName}${paymentMethod ? ` (${paymentMethod.toUpperCase()})` : ''}`,
 amountHT: rev.paidAmount,
 amountTTC: rev.paidAmount,
 customerName: rev.clientName,
 isPaid: true,
 source: rev.source,
 })
 } else if (!rev.isPaid && rev.paidAmount > 0) {
 // Acompte partiel - montant réel versé par le client
 ops.push({
 id: `ACOMPTE-${rev.id}`,
 date: rev.invoiceDate,
 type: 'acompte',
 ref: rev.sourceRef || rev.sourceId,
 description: `Acompte ${rev.clientName} (${Math.round((rev.paidAmount / rev.amount) * 100)}%)`,
 amountHT: rev.paidAmount,
 amountTTC: rev.paidAmount,
 customerName: rev.clientName,
 isPaid: false,
 source: rev.source,
 })
 }
 }

 // 2. Ajouter les dépenses depuis le store
 for (const inv of storeInvoices) {
 if (inv.type === 'expense' || inv.type === 'purchase') {
 ops.push({
 id: `DEP-${inv.id}`,
 date: inv.date,
 type: 'depense',
 ref: inv.id,
 description: inv.partnerName || inv.expenseCategory || 'Depense',
 amountHT: inv.totals?.ht || 0,
 amountTTC: inv.totals?.ttc || 0,
 isPaid: inv.paid || false,
 expenseCategory: inv.expenseCategory,
 })
 }
 }

 return ops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
 }, [revenues, storeInvoices])

 // Filtrage
 const filteredOperations = useMemo(() => {
 let result = [...operations]

 // Filtre par type
 if (typeFilter !== 'all') {
 result = result.filter(op => op.type === typeFilter)
 }

 // Filtre par recherche
 if (search) {
 const q = search.toLowerCase()
 result = result.filter(
 op =>
 op.ref?.toLowerCase().includes(q) ||
 op.description?.toLowerCase().includes(q) ||
 op.customerName?.toLowerCase().includes(q)
 )
 }

 // Filtre par date
 const now = new Date()
 if (dateFilter === 'week') {
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
 result = result.filter(op => new Date(op.date) >= weekAgo)
 } else if (dateFilter === 'month') {
 const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
 result = result.filter(op => new Date(op.date) >= monthAgo)
 } else if (dateFilter === 'year') {
 const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
 result = result.filter(op => new Date(op.date) >= yearAgo)
 }

 return result
 }, [operations, search, dateFilter, typeFilter])

 // Totaux
 const totals = useMemo(() => {
 const ventes = filteredOperations.filter(op => op.type === 'vente')
 const paiements = filteredOperations.filter(op => op.type === 'paiement')
 const acomptes = filteredOperations.filter(op => op.type === 'acompte')
 const depenses = filteredOperations.filter(op => op.type === 'depense')

 return {
 count: filteredOperations.length,
 ventesHT: ventes.reduce((s, op) => s + op.amountHT, 0),
 ventesTTC: ventes.reduce((s, op) => s + op.amountTTC, 0),
 paiementsHT: paiements.reduce((s, op) => s + op.amountHT, 0),
 paiementsTTC: paiements.reduce((s, op) => s + op.amountTTC, 0),
 acomptesHT: acomptes.reduce((s, op) => s + op.amountHT, 0),
 acomptesTTC: acomptes.reduce((s, op) => s + op.amountTTC, 0),
 depensesHT: depenses.reduce((s, op) => s + op.amountHT, 0),
 depensesTTC: depenses.reduce((s, op) => s + op.amountTTC, 0),
 nbVentes: ventes.length,
 nbPaiements: paiements.length,
 nbAcomptes: acomptes.length,
 nbDepenses: depenses.length,
 }
 }, [filteredOperations])

 const exportCSV = () => {
 const rows = [
 ['date', 'type', 'ref', 'description', 'client', 'montant_ht', 'montant_ttc', 'paye'],
 ...filteredOperations.map(op => [
 new Date(op.date).toISOString().slice(0, 10),
 op.type,
 op.ref,
 op.description,
 op.customerName || '',
 op.amountHT.toString(),
 op.amountTTC.toString(),
 op.isPaid ? 'Oui' : 'Non',
 ]),
 ]
 const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `journal-${new Date().toISOString().slice(0, 10)}.csv`
 a.click()
 URL.revokeObjectURL(url)
 }

 const handleSync = async () => {
 setSyncing(true)
 try {
 await syncRevenues(['PRINT', 'AGENCY', 'KAUI', 'QUOTE'])
 refresh()
 } catch (err) {
 console.error('Erreur sync:', err)
 } finally {
 setSyncing(false)
 }
 }

 const formatCurrency = (val: number) => val.toLocaleString('fr-FR') + ' F'

 return (
 <div className="space-y-4 md:space-y-6">
 {/* Filtre global de période */}
 <div className="flex flex-wrap items-center gap-3 px-1">
 <span className="text-sm text-white/50">Annee :</span>
 <select
 value={selectedYear ?? 'all'}
 onChange={e => setSelectedYear(e.target.value === 'all' ? null : Number(e.target.value))}
 className="px-3 py-1.5 text-sm rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/80"
 >
 {AVAILABLE_YEARS.map(year => (
 <option key={year ?? 'all'} value={year ?? 'all'}>
 {getYearLabel(year)}
 </option>
 ))}
 </select>
 <div className="flex items-center gap-1 bg-tribal-black rounded-lg p-1">
 {PERIOD_OPTIONS.map(({ key, label }) => (
 <button
 key={key}
 onClick={() => setSelectedPeriod(key)}
 className={cn(
 'px-3 py-1 text-xs font-medium rounded-md transition-all',
 selectedPeriod === key
 ? 'bg-white/[0.03] text-white shadow-sm'
 : 'text-white/60 hover:text-white'
 )}
 >
 {label}
 </button>
 ))}
 </div>

 {/* Sélecteur de mois */}
 {selectedPeriod === 'month' && (
 <select
 value={selectedMonth ?? new Date().getMonth()}
 onChange={e => setSelectedMonth(Number(e.target.value))}
 className="px-3 py-1.5 text-sm rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/80"
 >
 {AVAILABLE_MONTHS.map(({ value, label }) => (
 <option key={value} value={value}>
 {label}
 </option>
 ))}
 </select>
 )}
 </div>

 {/* Header glassmorphism */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl glass p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <BookOpen className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Journal des Operations</h1>
 <p className="text-white/70 text-sm">
 Registre chronologique de toutes vos transactions : ventes, encaissements et
 depenses
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 self-start md:self-auto">
 {/* Indicateur de chargement */}
 {loading && (
 <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] rounded-xl">
 <RefreshCw className="w-4 h-4 animate-spin" />
 <span className="text-sm">Chargement...</span>
 </div>
 )}

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleSync}
 disabled={syncing}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50"
 >
 <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
 <span className="text-sm font-medium hidden sm:inline">Synchroniser</span>
 </motion.button>

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={exportCSV}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors"
 >
 <Download className="w-4 h-4" />
 <span className="text-sm font-medium hidden sm:inline">Exporter</span>
 </motion.button>
 </div>
 </div>

 {/* Stats rapides */}
 <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/20">
 <div className="text-center">
 <div className="text-2xl md:text-3xl font-bold">{totals.count}</div>
 <div className="text-xs text-white/70">Operations</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-emerald-300">{totals.nbVentes}</div>
 <div className="text-xs text-white/70">Ventes</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-purple-300">{totals.nbPaiements}</div>
 <div className="text-xs text-white/70">Encaissements</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-amber-300">{totals.nbAcomptes}</div>
 <div className="text-xs text-white/70">Acomptes</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-rose-300">{totals.nbDepenses}</div>
 <div className="text-xs text-white/70">Depenses</div>
 </div>
 </div>

 {/* Totaux montants */}
 <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-white/10">
 <div className="text-center">
 <div className="text-lg font-bold text-emerald-300">
 {formatCurrency(totals.ventesHT)}
 </div>
 <div className="text-xs text-white/70">CA Ventes</div>
 </div>
 <div className="text-center">
 <div className="text-lg font-bold text-purple-300">
 {formatCurrency(totals.paiementsHT)}
 </div>
 <div className="text-xs text-white/70">Encaisses</div>
 </div>
 <div className="text-center">
 <div className="text-lg font-bold text-amber-300">
 {formatCurrency(totals.acomptesHT)}
 </div>
 <div className="text-xs text-white/70">Acomptes recus</div>
 </div>
 <div className="text-center">
 <div className="text-lg font-bold text-rose-300">
 {formatCurrency(totals.depensesHT)}
 </div>
 <div className="text-xs text-white/70">Depenses</div>
 </div>
 <div className="text-center">
 <div className="text-lg font-bold text-cyan-300">
 {formatCurrency(totals.paiementsHT + totals.acomptesHT - totals.depensesHT)}
 </div>
 <div className="text-xs text-white/70">Solde net</div>
 </div>
 </div>
 </motion.div>

 {/* Filtres */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="flex flex-col sm:flex-row gap-3"
 >
 {/* Filtre par type */}
 <div className="flex gap-1 p-1 bg-tribal-black rounded-xl overflow-x-auto">
 {[
 { key: 'all', label: 'Tout', count: operations.length },
 { key: 'vente', label: 'Ventes', count: totals.nbVentes },
 { key: 'paiement', label: 'Encaissements', count: totals.nbPaiements },
 { key: 'acompte', label: 'Acomptes', count: totals.nbAcomptes },
 { key: 'depense', label: 'Depenses', count: totals.nbDepenses },
 ].map(({ key, label, count }) => (
 <button
 key={key}
 onClick={() => setTypeFilter(key as typeof typeFilter)}
 className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 typeFilter === key
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 {label} ({count})
 </button>
 ))}
 </div>

 {/* Recherche */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher par reference, description, client..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-tribal-accent/40 focus:border-transparent transition-all"
 />
 {search && (
 <button
 onClick={() => setSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/60"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 {/* Filtre période */}
 <div className="flex gap-1 p-1 bg-tribal-black rounded-xl">
 {[
 { key: 'all', label: 'Tout' },
 { key: 'week', label: '7j' },
 { key: 'month', label: '30j' },
 { key: 'year', label: '1an' },
 ].map(({ key, label }) => (
 <button
 key={key}
 onClick={() => setDateFilter(key as typeof dateFilter)}
 className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 dateFilter === key
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 {label}
 </button>
 ))}
 </div>

 {/* Toggle Vue Simple / Comptable */}
 <div className="flex gap-1 p-1 bg-tribal-black rounded-xl">
 <button
 onClick={() => setViewMode('simple')}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 viewMode === 'simple'
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 <Eye className="w-3.5 h-3.5" />
 Simple
 </button>
 <button
 onClick={() => setViewMode('comptable')}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 viewMode === 'comptable'
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 <FileText className="w-3.5 h-3.5" />
 Comptable
 </button>
 </div>

 {/* Toggle HT / TTC (visible en mode comptable) */}
 {viewMode === 'comptable' && (
 <div className="flex gap-1 p-1 bg-tribal-black rounded-xl">
 <button
 onClick={() => setShowHT(false)}
 className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 !showHT
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 TTC
 </button>
 <button
 onClick={() => setShowHT(true)}
 className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
 showHT
 ? 'bg-white/[0.03] text-tribal-accent shadow-sm'
 : 'text-white/60 hover:text-white'
 }`}
 >
 HT
 </button>
 </div>
 )}
 </motion.div>

 {/* Table Desktop */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="hidden md:block rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden shadow-sm"
 >
 {viewMode === 'simple' ? (
 /* Mode Simple */
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-tribal-black text-white/60 text-left">
 <th className="px-4 py-3 font-semibold">Date</th>
 <th className="px-4 py-3 font-semibold">Type</th>
 <th className="px-4 py-3 font-semibold">Description</th>
 <th className="px-4 py-3 font-semibold">Client</th>
 <th className="px-4 py-3 font-semibold text-right">Montant HT</th>
 <th className="px-4 py-3 font-semibold text-right">Montant TTC</th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence mode="popLayout">
 {filteredOperations.map((op, idx) => {
 const opConfig = OPERATION_TYPES[op.type]
 const IconComponent = opConfig.icon
 const isIncome = op.type === 'vente' || op.type === 'paiement'

 return (
 <motion.tr
 key={op.id}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 transition={{ delay: idx * 0.02 }}
 className="border-t border-white/[0.04] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-4 py-3 text-white/60">
 {new Date(op.date).toLocaleDateString('fr-FR', {
 day: '2-digit',
 month: 'short',
 })}
 </td>
 <td className="px-4 py-3">
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
 op.type === 'vente'
 ? ' text-emerald-400'
 : op.type === 'paiement'
 ? ' text-purple-400'
 : op.type === 'acompte'
 ? ' text-amber-400'
 : ' text-rose-400'
 }`}
 >
 <IconComponent className="w-3.5 h-3.5" />
 {opConfig.label}
 </span>
 </td>
 <td className="px-4 py-3 font-medium text-white">
 {op.description}
 </td>
 <td className="px-4 py-3 text-white/60">
 {op.customerName || '-'}
 </td>
 <td className="px-4 py-3 text-right">
 <span
 className={`font-medium ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {isIncome ? '+' : '-'}
 {formatCurrency(op.amountHT)}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <span
 className={`font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {isIncome ? '+' : '-'}
 {formatCurrency(op.amountTTC)}
 </span>
 </td>
 </motion.tr>
 )
 })}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 ) : (
 /* Mode Comptable - Partie double : Débit = Crédit pour chaque opération */
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 {/* Totaux en haut - Débit = Crédit (partie double) */}
 <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
 <td colSpan={3} className="px-4 py-3 font-semibold">
 Totaux {showHT ? 'HT' : 'TTC'} (Partie Double)
 </td>
 <td className="px-4 py-3 text-right font-bold text-lg">
 <span className="text-emerald-300">
 {formatCurrency(
 showHT
 ? totals.ventesHT + totals.paiementsHT + totals.depensesHT
 : totals.ventesTTC + totals.paiementsTTC + totals.depensesTTC
 )}
 </span>
 </td>
 <td className="px-4 py-3 text-right font-bold text-lg">
 <span className="text-amber-300">
 {formatCurrency(
 showHT
 ? totals.ventesHT + totals.paiementsHT + totals.depensesHT
 : totals.ventesTTC + totals.paiementsTTC + totals.depensesTTC
 )}
 </span>
 </td>
 </tr>
 <tr className="bg-tribal-black text-white/60 text-left">
 <th className="px-4 py-3 font-semibold">Date</th>
 <th className="px-4 py-3 font-semibold">Reference</th>
 <th className="px-4 py-3 font-semibold">Libelle</th>
 <th className="px-4 py-3 font-semibold text-right">
 Debit {showHT ? 'HT' : 'TTC'}
 </th>
 <th className="px-4 py-3 font-semibold text-right">
 Credit {showHT ? 'HT' : 'TTC'}
 </th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence mode="popLayout">
 {filteredOperations.map((op, idx) => {
 const amount = showHT ? op.amountHT : op.amountTTC
 const compteDebit =
 op.type === 'vente' ? '411' : op.type === 'paiement' ? '521' : '65'
 const compteCredit =
 op.type === 'vente' ? '701' : op.type === 'paiement' ? '411' : '521'

 return (
 <motion.tr
 key={op.id}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 transition={{ delay: idx * 0.02 }}
 className="border-t border-white/[0.04] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-4 py-3 text-white/60">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 {new Date(op.date).toLocaleDateString('fr-FR')}
 </div>
 </td>
 <td className="px-4 py-3">
 <span
 className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
 op.type === 'vente'
 ? ' text-emerald-400'
 : op.type === 'paiement'
 ? ' text-purple-400'
 : op.type === 'acompte'
 ? ' text-amber-400'
 : ' text-rose-400'
 }`}
 >
 {formatRef(op.type, op.ref)}
 </span>
 </td>
 <td className="px-4 py-3 font-medium text-white">
 <div>{op.description}</div>
 <div className="text-xs text-white/50 mt-0.5">
 D: {compteDebit} - C: {compteCredit}
 </div>
 </td>
 <td className="px-4 py-3 text-right">
 <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
 <ArrowUpRight className="w-3 h-3" />
 {formatCurrency(amount)}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
 <ArrowDownLeft className="w-3 h-3" />
 {formatCurrency(amount)}
 </span>
 </td>
 </motion.tr>
 )
 })}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 )}
 </motion.div>

 {/* Mobile Cards */}
 <div className="md:hidden space-y-3">
 <AnimatePresence mode="popLayout">
 {filteredOperations.map((op, idx) => {
 const opConfig = OPERATION_TYPES[op.type]
 const IconComponent = opConfig.icon
 const isIncome = op.type === 'vente' || op.type === 'paiement'

 return (
 <motion.div
 key={op.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ delay: idx * 0.03 }}
 className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3 shadow-sm"
 >
 <div className="flex items-center justify-between">
 {viewMode === 'simple' ? (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
 op.type === 'vente'
 ? ' text-emerald-400'
 : op.type === 'paiement'
 ? ' text-purple-400'
 : op.type === 'acompte'
 ? ' text-amber-400'
 : ' text-rose-400'
 }`}
 >
 <IconComponent className="w-3.5 h-3.5" />
 {opConfig.label}
 </span>
 ) : (
 <span
 className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
 op.type === 'vente'
 ? ' text-emerald-400'
 : op.type === 'paiement'
 ? ' text-purple-400'
 : op.type === 'acompte'
 ? ' text-amber-400'
 : ' text-rose-400'
 }`}
 >
 {formatRef(op.type, op.ref)}
 </span>
 )}
 <span className="text-xs text-white/50 flex items-center gap-1">
 <Calendar className="w-3 h-3" />
 {new Date(op.date).toLocaleDateString('fr-FR', {
 day: '2-digit',
 month: 'short',
 })}
 </span>
 </div>

 <div className="font-medium text-white">{op.description}</div>

 {op.customerName && (
 <div className="text-sm text-white/50">{op.customerName}</div>
 )}

 <div className="flex justify-between pt-2 border-t border-white/[0.04]">
 {viewMode === 'simple' ? (
 <>
 <span className="text-sm text-white/50">
 HT: {formatCurrency(op.amountHT)}
 </span>
 <span
 className={`font-bold text-lg ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {isIncome ? '+' : '-'}
 {formatCurrency(op.amountTTC)}
 </span>
 </>
 ) : (
 <>
 {isIncome ? (
 <div className="flex items-center gap-1 text-emerald-400">
 <ArrowUpRight className="w-4 h-4" />
 <span className="font-semibold">
 Debit: {formatCurrency(op.amountTTC)}
 </span>
 </div>
 ) : (
 <div className="flex items-center gap-1 text-rose-400 ml-auto">
 <ArrowDownLeft className="w-4 h-4" />
 <span className="font-semibold">
 Credit: {formatCurrency(op.amountTTC)}
 </span>
 </div>
 )}
 </>
 )}
 </div>
 </motion.div>
 )
 })}
 </AnimatePresence>
 </div>

 {/* Empty state */}
 {filteredOperations.length === 0 && !loading && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-12 text-white/50"
 >
 <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p className="font-medium">Aucune operation trouvee</p>
 <p className="text-sm">Modifiez vos filtres ou verifiez vos commandes</p>
 </motion.div>
 )}
 </div>
 )
}
