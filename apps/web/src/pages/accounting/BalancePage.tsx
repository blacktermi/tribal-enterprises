import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 Scale,
 Download,
 Search,
 ArrowUpRight,
 ArrowDownLeft,
 TrendingUp,
 TrendingDown,
 X,
 CheckCircle2,
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

export const BalancePage: React.FC = () => {
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
 limit: 1000,
 },
 includeSummary: false,
 })

 // Filtrer par plateforme
 const revenues = useMemo(
 () => filterRevenuesByPlatform(rawRevenues, selectedPlatform),
 [rawRevenues, selectedPlatform]
 )

 // Données store (pour les dépenses manuelles et settings)
 const storeInvoices = useAccountingStore(s => s.invoices)
 const settings = useAccountingStore(s => s.settings)
 const [search, setSearch] = useState('')
 const [showBalanced, setShowBalanced] = useState(true)
 const [syncing, setSyncing] = useState(false)

 // Handler de synchronisation
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

 const formatCurrency = (val: number) =>
 val.toLocaleString('fr-FR', { style: 'currency', currency: settings.currency })

 // Générer les écritures comptables depuis l'API + store
 const rows = useMemo(() => {
 const map = new Map<string, { debit: number; credit: number }>()

 // 1. Écritures depuis les revenus unifiés
 for (const rev of revenues) {
 // Exclure les frais de livraison du montant comptable
 const deliveryFee = ((rev.metadata as Record<string, unknown>)?.deliveryFee as number) || 0
 const amountHT = rev.amount - deliveryFee // Montant produits uniquement (sans livraison)
 const amountTTC = amountHT // TVA = 0, donc TTC = HT
 const tva = 0 // TVA désactivée
 const isPaid = rev.isPaid
 // Le montant payé est affiché tel quel (c'est un montant réel versé)
 const paidAmount = rev.paidAmount
 const totalAmount = amountHT

 // Vente : Débit 411 (Clients), Crédit 701 (Ventes), Crédit 4457 (TVA collectée)
 const clients = map.get('411 - Clients') || { debit: 0, credit: 0 }
 clients.debit += amountTTC
 map.set('411 - Clients', clients)

 const ventes = map.get('701 - Ventes') || { debit: 0, credit: 0 }
 ventes.credit += amountHT
 map.set('701 - Ventes', ventes)

 if (tva > 0) {
 const tvaCollectee = map.get('4457 - TVA collectée') || { debit: 0, credit: 0 }
 tvaCollectee.credit += tva
 map.set('4457 - TVA collectée', tvaCollectee)
 }

 // Si acompte reçu (paiement partiel) : Débit 512 (Banque), Crédit 4191 (Clients - Avances reçues)
 if (paidAmount > 0 && !isPaid) {
 const banque = map.get('512 - Banque') || { debit: 0, credit: 0 }
 banque.debit += paidAmount
 map.set('512 - Banque', banque)

 const acomptes = map.get('4191 - Clients (Acomptes)') || { debit: 0, credit: 0 }
 acomptes.credit += paidAmount
 map.set('4191 - Clients (Acomptes)', acomptes)
 }

 // Si payée entièrement : régulariser l'acompte si présent, puis encaisser le reste
 if (isPaid) {
 if (paidAmount > 0 && paidAmount < totalAmount) {
 // Régulariser l'acompte : Débit 4191, Crédit 411
 const acomptes = map.get('4191 - Clients (Acomptes)') || { debit: 0, credit: 0 }
 acomptes.debit += paidAmount
 map.set('4191 - Clients (Acomptes)', acomptes)

 const clientsCredit = map.get('411 - Clients') || { debit: 0, credit: 0 }
 clientsCredit.credit += paidAmount
 map.set('411 - Clients', clientsCredit)

 // Encaisser le solde
 const solde = amountTTC - paidAmount
 if (solde > 0) {
 const banque = map.get('512 - Banque') || { debit: 0, credit: 0 }
 banque.debit += solde
 map.set('512 - Banque', banque)

 const clientsSolde = map.get('411 - Clients') || { debit: 0, credit: 0 }
 clientsSolde.credit += solde
 map.set('411 - Clients', clientsSolde)
 }
 } else {
 // Pas d'acompte : encaissement complet
 const banque = map.get('512 - Banque') || { debit: 0, credit: 0 }
 banque.debit += amountTTC
 map.set('512 - Banque', banque)

 const clientsCredit = map.get('411 - Clients') || { debit: 0, credit: 0 }
 clientsCredit.credit += amountTTC
 map.set('411 - Clients', clientsCredit)
 }
 }
 }

 // 2. Écritures depuis les dépenses du store (FILTRÉES par période)
 const startDateObj = new Date(dateFilters.startDate)
 const endDateObj = new Date(dateFilters.endDate)
 endDateObj.setHours(23, 59, 59, 999) // Inclure toute la journée de fin

 for (const invoice of storeInvoices) {
 if (invoice.type === 'expense' || invoice.type === 'purchase') {
 // Filtrer par date
 const invoiceDate = new Date(invoice.date)
 if (invoiceDate < startDateObj || invoiceDate > endDateObj) {
 continue // Ignorer les dépenses hors période
 }

 const ht = invoice.totals?.ht || 0
 const tvaAmount = invoice.totals?.tva || 0
 const ttc = invoice.totals?.ttc || ht + tvaAmount

 const achats = map.get('601 - Achats') || { debit: 0, credit: 0 }
 achats.debit += ht
 map.set('601 - Achats', achats)

 if (tvaAmount > 0) {
 const tvaDeductible = map.get('4456 - TVA déductible') || { debit: 0, credit: 0 }
 tvaDeductible.debit += tvaAmount
 map.set('4456 - TVA déductible', tvaDeductible)
 }

 const fournisseurs = map.get('401 - Fournisseurs') || { debit: 0, credit: 0 }
 fournisseurs.credit += ttc
 map.set('401 - Fournisseurs', fournisseurs)
 }
 }

 return Array.from(map.entries())
 .map(([account, v]) => ({
 account,
 debit: v.debit,
 credit: v.credit,
 solde: v.debit - v.credit,
 }))
 .sort((a, b) => a.account.localeCompare(b.account))
 }, [revenues, storeInvoices, dateFilters.startDate, dateFilters.endDate])

 const filteredRows = useMemo(() => {
 let result = rows

 // Filtre par recherche
 if (search) {
 const q = search.toLowerCase()
 result = result.filter(r => r.account.toLowerCase().includes(q))
 }

 // Filtre comptes non équilibrés
 if (!showBalanced) {
 result = result.filter(r => r.solde !== 0)
 }

 return result
 }, [rows, search, showBalanced])

 const exportCSV = () => {
 const header = ['account', 'debit', 'credit', 'solde']
 const data = filteredRows.map(r => [r.account, r.debit, r.credit, r.solde])
 const csv = [header, ...data].map(r => r.join(',')).join('\n')
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `balance-${new Date().toISOString().slice(0, 10)}.csv`
 a.click()
 URL.revokeObjectURL(url)
 }

 const totals = rows.reduce(
 (acc, r) => ({
 debit: acc.debit + r.debit,
 credit: acc.credit + r.credit,
 solde: acc.solde + r.solde,
 }),
 { debit: 0, credit: 0, solde: 0 }
 )

 const isBalanced = totals.debit === totals.credit

 return (
 <div className="space-y-4 md:space-y-6">
 {/* Filtre global de période */}
 <div className="flex flex-wrap items-center gap-3 px-1">
 <span className="text-sm text-white/50">Année :</span>
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

 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl glass p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Scale className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Balance Comptable</h1>
 <p className="text-white/70 text-sm">
 Synthèse des débits et crédits par compte pour vérifier l’équilibre de votre
 comptabilité
 </p>
 </div>
 </div>

 <div className="flex gap-2 self-start md:self-auto">
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleSync}
 disabled={syncing || loading}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50"
 >
 <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
 <span className="text-sm font-medium">{syncing ? 'Sync...' : 'Synchroniser'}</span>
 </motion.button>
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={exportCSV}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors"
 >
 <Download className="w-4 h-4" />
 <span className="text-sm font-medium">Exporter CSV</span>
 </motion.button>
 </div>
 </div>

 {/* Stats */}
 <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
 <div className="text-center">
 <div className="text-2xl md:text-3xl font-bold">{rows.length}</div>
 <div className="text-xs text-white/70">Comptes</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-emerald-300">
 {formatCurrency(totals.debit)}
 </div>
 <div className="text-xs text-white/70">Total Débits</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-rose-300">
 {formatCurrency(totals.credit)}
 </div>
 <div className="text-xs text-white/70">Total Crédits</div>
 </div>
 <div className="text-center">
 <div
 className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
 isBalanced ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'
 }`}
 >
 {isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
 {isBalanced ? 'Équilibré' : 'Déséquilibré'}
 </div>
 <div className="text-xs text-white/70 mt-1">Statut</div>
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
 {/* Recherche */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher un compte..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-violet-500 focus:border-transparent transition-all"
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

 {/* Toggle comptes équilibrés */}
 <button
 onClick={() => setShowBalanced(!showBalanced)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
 showBalanced
 ? 'border-white/[0.06] bg-white/[0.03] text-white/60'
 : 'border-violet-500/30 bg-violet-900/20 text-violet-400'
 }`}
 >
 <Scale className="w-4 h-4" />
 <span className="text-sm font-medium">
 {showBalanced ? 'Tous les comptes' : 'Non équilibrés'}
 </span>
 </button>
 </motion.div>

 {/* Table Desktop */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="hidden md:block rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden shadow-sm"
 >
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-tribal-black text-white/60 text-left">
 <th className="px-4 py-3 font-semibold">Compte</th>
 <th className="px-4 py-3 font-semibold text-right">Débit</th>
 <th className="px-4 py-3 font-semibold text-right">Crédit</th>
 <th className="px-4 py-3 font-semibold text-right">Solde</th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence mode="popLayout">
 {filteredRows.map((r, idx) => (
 <motion.tr
 key={r.account}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 transition={{ delay: idx * 0.02 }}
 className="border-t border-white/[0.04] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-4 py-3">
 <span className="px-2 py-1 text-violet-400 rounded-md text-xs font-mono">
 {r.account}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 {r.debit > 0 && (
 <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
 <ArrowUpRight className="w-3 h-3" />
 {formatCurrency(r.debit)}
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-right">
 {r.credit > 0 && (
 <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
 <ArrowDownLeft className="w-3 h-3" />
 {formatCurrency(r.credit)}
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-right">
 <span
 className={`inline-flex items-center gap-1 font-bold ${
 r.solde === 0
 ? 'text-white/50'
 : r.solde > 0
 ? 'text-emerald-400'
 : 'text-rose-400'
 }`}
 >
 {r.solde !== 0 &&
 (r.solde > 0 ? (
 <TrendingUp className="w-4 h-4" />
 ) : (
 <TrendingDown className="w-4 h-4" />
 ))}
 {r.solde === 0 ? '—' : formatCurrency(Math.abs(r.solde))}
 </span>
 </td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 <tfoot className="bg-gradient-to-r from-white/[0.02] to-violet-900/10 font-semibold">
 <tr className="border-t-2 border-white/[0.06]">
 <td className="px-4 py-4 text-white/80">
 Total ({filteredRows.length} comptes)
 </td>
 <td className="px-4 py-4 text-right text-emerald-400 text-lg">
 {formatCurrency(totals.debit)}
 </td>
 <td className="px-4 py-4 text-right text-rose-400 text-lg">
 {formatCurrency(totals.credit)}
 </td>
 <td className="px-4 py-4 text-right">
 <span
 className={`text-lg ${
 isBalanced
 ? 'text-emerald-400'
 : 'text-rose-400'
 }`}
 >
 {formatCurrency(totals.solde)}
 </span>
 </td>
 </tr>
 </tfoot>
 </table>
 </div>
 </motion.div>

 {/* Mobile Cards */}
 <div className="md:hidden space-y-3">
 <AnimatePresence mode="popLayout">
 {filteredRows.map((r, idx) => (
 <motion.div
 key={r.account}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ delay: idx * 0.03 }}
 className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-sm"
 >
 <div className="flex items-center justify-between mb-3">
 <span className="px-2 py-1 text-violet-400 rounded-md text-sm font-mono font-semibold">
 {r.account}
 </span>
 <span
 className={`inline-flex items-center gap-1 font-bold ${
 r.solde === 0
 ? 'text-white/50'
 : r.solde > 0
 ? 'text-emerald-400'
 : 'text-rose-400'
 }`}
 >
 {r.solde !== 0 &&
 (r.solde > 0 ? (
 <TrendingUp className="w-4 h-4" />
 ) : (
 <TrendingDown className="w-4 h-4" />
 ))}
 {r.solde === 0 ? 'Équilibré' : formatCurrency(Math.abs(r.solde))}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
 <div className="text-center">
 <div className="text-xs text-white/50 mb-1">Débit</div>
 <div className="text-emerald-400 font-semibold">
 {formatCurrency(r.debit)}
 </div>
 </div>
 <div className="text-center">
 <div className="text-xs text-white/50 mb-1">Crédit</div>
 <div className="text-rose-400 font-semibold">
 {formatCurrency(r.credit)}
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>

 {/* Total mobile */}
 {filteredRows.length > 0 && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="rounded-xl bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-white/[0.06] p-4"
 >
 <div className="text-sm font-semibold text-violet-400 mb-2">
 Total
 </div>
 <div className="grid grid-cols-3 gap-2 text-center">
 <div>
 <div className="text-xs text-white/50">Débit</div>
 <div className="font-bold text-emerald-400">
 {formatCurrency(totals.debit)}
 </div>
 </div>
 <div>
 <div className="text-xs text-white/50">Crédit</div>
 <div className="font-bold text-rose-400">
 {formatCurrency(totals.credit)}
 </div>
 </div>
 <div>
 <div className="text-xs text-white/50">Solde</div>
 <div
 className={`font-bold ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {formatCurrency(totals.solde)}
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </div>

 {/* Empty state */}
 {filteredRows.length === 0 && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-12 text-white/50"
 >
 <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p className="font-medium">Aucun compte trouvé</p>
 <p className="text-sm">Modifiez votre recherche ou vos filtres</p>
 </motion.div>
 )}
 </div>
 )
}

export default BalancePage
