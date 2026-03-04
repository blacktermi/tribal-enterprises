import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 Clock,
 Download,
 Users,
 Building2,
 AlertTriangle,
 AlertCircle,
 CheckCircle,
 XCircle,
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

const ranges = [
 { key: '0-30', min: 0, max: 30, label: '0-30 jours', color: 'emerald', icon: CheckCircle },
 { key: '31-60', min: 31, max: 60, label: '31-60 jours', color: 'amber', icon: AlertCircle },
 { key: '61-90', min: 61, max: 90, label: '61-90 jours', color: 'orange', icon: AlertTriangle },
 { key: '>90', min: 91, max: Infinity, label: '+90 jours', color: 'rose', icon: XCircle },
] as const

export const BalanceAgeePage: React.FC = () => {
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

 // Appliquer le filtre de plateforme
 const revenues = useMemo(
 () => filterRevenuesByPlatform(rawRevenues, selectedPlatform),
 [rawRevenues, selectedPlatform]
 )

 // Données store (dépenses et settings)
 const storeInvoices = useAccountingStore(s => s.invoices)
 const settings = useAccountingStore(s => s.settings)
 const [kind, setKind] = useState<'clients' | 'fournisseurs'>('clients')
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

 const rows = useMemo(() => {
 const today = new Date()
 const acc: Record<string, { name: string; buckets: Record<string, number> }> = {}

 if (kind === 'clients') {
 // Créances clients depuis les revenus unifiés - uniquement les non payées
 for (const rev of revenues) {
 // On ne compte que les créances (non payées)
 if (rev.isPaid) continue

 // Exclure les frais de livraison pour calculer la créance
 const deliveryFee = ((rev.metadata as Record<string, unknown>)?.deliveryFee as number) || 0
 const amountProduits = rev.amount - deliveryFee
 // Le montant payé est affiché tel quel (c'est un montant réel versé)
 const creance = Math.max(0, amountProduits - rev.paidAmount)

 if (creance <= 0) continue

 const dateStr = rev.invoiceDate
 if (!dateStr) continue

 const orderDate = new Date(dateStr)
 const days = Math.floor((+today - +orderDate) / 86400000)
 const bucket = ranges.find(r => days >= r.min && days <= r.max)?.key || '>90'

 const customerName = rev.clientName || 'Client anonyme'

 if (!acc[customerName]) {
 acc[customerName] = {
 name: customerName,
 buckets: { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 },
 }
 }
 acc[customerName].buckets[bucket] += creance
 }
 } else {
 // Dettes fournisseurs depuis le store (FILTRÉES par période)
 const startDateObj = new Date(dateFilters.startDate)
 const endDateObj = new Date(dateFilters.endDate)
 endDateObj.setHours(23, 59, 59, 999) // Inclure toute la journée de fin

 const expenses = storeInvoices.filter(i => (i.type === 'expense' || i.type === 'purchase') && !i.paid)
 for (const inv of expenses) {
 // Filtrer par date
 const invoiceDate = new Date(inv.date)
 if (invoiceDate < startDateObj || invoiceDate > endDateObj) {
 continue // Ignorer les dépenses hors période
 }

 const due = new Date(inv.dueDate || inv.date)
 const days = Math.floor((+today - +due) / 86400000)
 const bucket = ranges.find(r => days >= r.min && days <= r.max)?.key || '>90'
 const key = inv.partnerName || 'Fournisseur'

 if (!acc[key]) {
 acc[key] = { name: key, buckets: { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 } }
 }
 acc[key].buckets[bucket] += inv.totals?.ttc || 0
 }
 }

 return Object.values(acc).sort((a, b) => a.name.localeCompare(b.name))
 }, [revenues, storeInvoices, kind, dateFilters.startDate, dateFilters.endDate])

 // Totaux par tranche
 const totals = useMemo(() => {
 return rows.reduce(
 (acc, r) => ({
 '0-30': acc['0-30'] + r.buckets['0-30'],
 '31-60': acc['31-60'] + r.buckets['31-60'],
 '61-90': acc['61-90'] + r.buckets['61-90'],
 '>90': acc['>90'] + r.buckets['>90'],
 }),
 { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 }
 )
 }, [rows])

 const totalGlobal = Object.values(totals).reduce((a, b) => a + b, 0)

 const exportCSV = () => {
 const header = ['partenaire', '0-30', '31-60', '61-90', '>90']
 const data = rows.map(r => [
 r.name,
 r.buckets['0-30'],
 r.buckets['31-60'],
 r.buckets['61-90'],
 r.buckets['>90'],
 ])
 const csv = [header, ...data].map(r => r.join(',')).join('\n')
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `balance-agee-${kind}-${new Date().toISOString().slice(0, 10)}.csv`
 a.click()
 URL.revokeObjectURL(url)
 }

 const getBucketColor = (key: string) => {
 const range = ranges.find(r => r.key === key)
 const colors: Record<string, string> = {
 emerald:
 ' text-emerald-400 border-white/[0.06]',
 amber:
 ' text-amber-400 border-white/[0.06]',
 orange:
 ' text-orange-400 border-white/[0.06]',
 rose: ' text-rose-400 border-white/[0.06]',
 }
 return colors[range?.color || 'emerald']
 }

 const getBucketTextColor = (key: string) => {
 const range = ranges.find(r => r.key === key)
 const colors: Record<string, string> = {
 emerald: 'text-emerald-400',
 amber: 'text-amber-400',
 orange: 'text-orange-400',
 rose: 'text-rose-400',
 }
 return colors[range?.color || 'emerald']
 }

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
 className={`relative overflow-hidden rounded-2xl p-4 md:p-6 text-white shadow-xl ${
 kind === 'clients'
 ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700'
 : 'bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700'
 }`}
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Clock className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Balance Âgée</h1>
 <p className="text-white/70 text-sm">
 {kind === 'clients'
 ? 'Créances clients par ancienneté'
 : 'Dettes fournisseurs par ancienneté'}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Toggle clients/fournisseurs */}
 <div className="flex gap-1 p-1 bg-white/[0.1] backdrop-blur-sm rounded-lg">
 <button
 onClick={() => setKind('clients')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
 kind === 'clients' ? 'bg-white/[0.03] text-blue-400' : 'text-white/80 hover:bg-white/[0.06]'
 }`}
 >
 <Users className="w-4 h-4" />
 <span className="hidden sm:inline">Clients</span>
 </button>
 <button
 onClick={() => setKind('fournisseurs')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
 kind === 'fournisseurs'
 ? 'bg-white/[0.03] text-rose-400'
 : 'text-white/80 hover:bg-white/[0.06]'
 }`}
 >
 <Building2 className="w-4 h-4" />
 <span className="hidden sm:inline">Fournisseurs</span>
 </button>
 </div>

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleSync}
 disabled={syncing || loading}
 className="flex items-center gap-2 px-3 py-2 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50"
 >
 <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
 <span className="text-sm font-medium hidden sm:inline">
 {syncing ? 'Sync...' : 'Sync'}
 </span>
 </motion.button>

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={exportCSV}
 className="flex items-center gap-2 px-3 py-2 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors"
 >
 <Download className="w-4 h-4" />
 <span className="text-sm font-medium hidden sm:inline">CSV</span>
 </motion.button>
 </div>
 </div>

 {/* Stats par tranche */}
 <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
 {ranges.map(({ key, label, icon: Icon, color }) => (
 <div key={key} className="text-center">
 <div
 className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1 ${
 color === 'emerald'
 ? 'bg-emerald-400/30'
 : color === 'amber'
 ? 'bg-amber-400/30'
 : color === 'orange'
 ? 'bg-orange-400/30'
 : 'bg-rose-400/30'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div className="text-lg md:text-xl font-bold">
 {formatCurrency(totals[key as keyof typeof totals])}
 </div>
 <div className="text-xs text-white/70">{label}</div>
 </div>
 ))}
 </div>
 </motion.div>

 {/* Résumé global */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="rounded-xl bg-tribal-black p-4"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="text-sm text-white/60">
 <span className="font-semibold">{rows.length}</span>{' '}
 {kind === 'clients' ? 'clients' : 'fournisseurs'} avec encours
 </div>
 <div className="text-lg font-bold text-white">
 Total: {formatCurrency(totalGlobal)}
 </div>
 </div>
 {/* Progress bar */}
 <div className="mt-3 h-3 rounded-full bg-white/[0.1] overflow-hidden flex">
 {totalGlobal > 0 &&
 ranges.map(({ key, color }) => {
 const percent = (totals[key as keyof typeof totals] / totalGlobal) * 100
 if (percent === 0) return null
 return (
 <div
 key={key}
 className={`h-full ${
 color === 'emerald'
 ? 'bg-emerald-500'
 : color === 'amber'
 ? 'bg-amber-500'
 : color === 'orange'
 ? 'bg-orange-500'
 : 'bg-rose-500'
 }`}
 style={{ width: `${percent}%` }}
 />
 )
 })}
 </div>
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
 <th className="px-4 py-3 font-semibold">Partenaire</th>
 {ranges.map(({ key, label, icon: Icon, color }) => (
 <th key={key} className="px-4 py-3 font-semibold text-right">
 <div className="flex items-center justify-end gap-1.5">
 <Icon className={`w-4 h-4 ${getBucketTextColor(key)}`} />
 {label}
 </div>
 </th>
 ))}
 <th className="px-4 py-3 font-semibold text-right">Total</th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence mode="popLayout">
 {rows.map((r, idx) => {
 const rowTotal = Object.values(r.buckets).reduce((a, b) => a + b, 0)
 return (
 <motion.tr
 key={r.name}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 transition={{ delay: idx * 0.02 }}
 className="border-t border-white/[0.04] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-4 py-3">
 <span className="font-medium text-white">{r.name}</span>
 </td>
 {ranges.map(({ key }) => (
 <td key={key} className="px-4 py-3 text-right">
 {r.buckets[key] > 0 ? (
 <span className={`font-medium ${getBucketTextColor(key)}`}>
 {formatCurrency(r.buckets[key])}
 </span>
 ) : (
 <span className="text-white/50">—</span>
 )}
 </td>
 ))}
 <td className="px-4 py-3 text-right font-bold text-white">
 {formatCurrency(rowTotal)}
 </td>
 </motion.tr>
 )
 })}
 </AnimatePresence>
 </tbody>
 <tfoot className="bg-tribal-black font-semibold">
 <tr className="border-t-2 border-white/[0.06]">
 <td className="px-4 py-4 text-white/80">Total</td>
 {ranges.map(({ key }) => (
 <td key={key} className={`px-4 py-4 text-right ${getBucketTextColor(key)}`}>
 {formatCurrency(totals[key as keyof typeof totals])}
 </td>
 ))}
 <td className="px-4 py-4 text-right text-lg text-white">
 {formatCurrency(totalGlobal)}
 </td>
 </tr>
 </tfoot>
 </table>
 </div>
 </motion.div>

 {/* Mobile Cards */}
 <div className="md:hidden space-y-3">
 <AnimatePresence mode="popLayout">
 {rows.map((r, idx) => {
 const rowTotal = Object.values(r.buckets).reduce((a, b) => a + b, 0)
 return (
 <motion.div
 key={r.name}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ delay: idx * 0.03 }}
 className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-sm"
 >
 <div className="flex items-center justify-between mb-3">
 <span className="font-semibold text-white">{r.name}</span>
 <span className="font-bold text-white">
 {formatCurrency(rowTotal)}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-2">
 {ranges.map(({ key, label, icon: Icon }) => (
 <div key={key} className={`rounded-lg border p-2 ${getBucketColor(key)}`}>
 <div className="flex items-center gap-1 text-xs mb-1">
 <Icon className="w-3 h-3" />
 {label}
 </div>
 <div className="font-semibold">
 {r.buckets[key] > 0 ? formatCurrency(r.buckets[key]) : '—'}
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )
 })}
 </AnimatePresence>
 </div>

 {/* Empty state */}
 {rows.length === 0 && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-12 text-white/50"
 >
 <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p className="font-medium">Aucune donnée</p>
 <p className="text-sm">
 {kind === 'clients'
 ? 'Créez des factures de vente pour voir les créances'
 :"Créez des factures d'achat pour voir les dettes"}
 </p>
 </motion.div>
 )}
 </div>
 )
}

export default BalanceAgeePage
