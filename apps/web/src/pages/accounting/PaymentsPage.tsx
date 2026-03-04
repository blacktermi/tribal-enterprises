import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 CreditCard,
 ArrowDownLeft,
 ArrowUpRight,
 Plus,
 X,
 Calendar,
 Banknote,
 Building,
 Smartphone,
 Filter,
 CheckCircle2,
 RefreshCw,
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import { useUnifiedRevenues, syncRevenues } from '../../lib/hooks/useUnifiedRevenues'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../accounting/types'
import {
 useAccountingFilters,
 filterRevenuesByPlatform,
 AVAILABLE_YEARS,
 PERIOD_OPTIONS,
 AVAILABLE_MONTHS,
 getYearLabel,
} from '../../store/accountingFilters'
import { cn } from '../../lib/utils'

// Formater la référence de manière lisible
function formatRef(ref: string): string {
 // Si c'est un numéro de commande (TP-2026-xxx, JP-2026-xxx, etc.), l'utiliser directement
 if (/^[A-Z]{2}-\d{4}-\d+$/.test(ref)) {
 return ref
 }
 const shortId = ref
 .replace(/[^a-zA-Z0-9]/g, '')
 .slice(-4)
 .toUpperCase()
 return `ENC-${shortId}`
}

// Normaliser le nom de la méthode de paiement
function normalizePaymentMethod(method?: string): string {
 if (!method) return 'WAVE'
 const m = method.toUpperCase()
 if (m.includes('WAVE')) return 'WAVE'
 if (m.includes('ORANGE')) return 'ORANGE_MONEY'
 if (m.includes('MTN')) return 'MTN_MONEY'
 if (m.includes('MOOV')) return 'MOOV_MONEY'
 if (m.includes('MOBILE') || m.includes('MONEY')) return 'MOBILE_MONEY'
 if (m.includes('BANQUE') || m.includes('VIREMENT') || m.includes('BANK')) return 'BANQUE'
 if (m.includes('ESPECE') || m.includes('CASH') || m.includes('CAISSE')) return 'CAISSE'
 return m
}

export const PaymentsPage: React.FC = () => {
 const settings = useAccountingStore(s => s.settings)
 const addJournalEntry = useAccountingStore(s => s.addJournalEntry)
 const storeInvoices = useAccountingStore(s => s.invoices)

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

 // Récupérer les revenus unifiés depuis l'API
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

 const [methodFilter, setMethodFilter] = useState<string>('ALL')
 const [showTTC, setShowTTC] = useState<boolean>(true)
 const [showForm, setShowForm] = useState(false)
 const [currentPage, setCurrentPage] = useState(1)
 const ITEMS_PER_PAGE = 50
 const [syncing, setSyncing] = useState(false)
 const [form, setForm] = useState<{
 date: string
 method: string
 direction: 'IN' | 'OUT'
 amount: string
 ref: string
 }>({
 date: new Date().toISOString().slice(0, 10),
 method: 'WAVE',
 direction: 'IN',
 amount: '',
 ref: '',
 })

 const formatCurrency = (val: number) =>
 val.toLocaleString('fr-FR', { style: 'currency', currency: settings.currency })

 // Extraire les paiements depuis les revenus unifiés + dépenses du store
 const payments = useMemo(() => {
 const rows: Array<{
 id: string
 date: string
 ref?: string
 method?: string
 amountHT: number
 amountTTC: number
 direction: 'IN' | 'OUT'
 customerName?: string
 isDeposit?: boolean
 paymentType?: string
 source?: string
 }> = []

 // 1. Encaissements depuis les revenus unifiés (paiements reçus)
 for (const rev of revenues) {
 // Exclure les frais de livraison
 const deliveryFee = ((rev.metadata as Record<string, unknown>)?.deliveryFee as number) || 0
 const paymentMethod =
 ((rev.metadata as Record<string, unknown>)?.paymentMethod as string) || 'WAVE'

 // Si la commande est soldée, on prend le montant total (moins livraison)
 if (rev.isPaid) {
 const amountProduits = rev.amount - deliveryFee
 if (amountProduits > 0) {
 rows.push({
 id: `pay-${rev.id}`,
 date: rev.paidAt || rev.invoiceDate,
 ref: rev.sourceRef || rev.sourceId,
 method: normalizePaymentMethod(paymentMethod),
 amountHT: amountProduits,
 amountTTC: amountProduits,
 direction: 'IN',
 customerName: rev.clientName,
 isDeposit: false,
 paymentType: 'PAYMENT',
 source: rev.source,
 })
 }
 } else if (rev.paidAmount > 0) {
 // Acompte partiel reçu (non soldé mais avec paiement)
 rows.push({
 id: `dep-${rev.id}`,
 date: rev.invoiceDate,
 ref: rev.sourceRef || rev.sourceId,
 method: normalizePaymentMethod(paymentMethod),
 amountHT: rev.paidAmount,
 amountTTC: rev.paidAmount,
 direction: 'IN',
 customerName: rev.clientName,
 isDeposit: true,
 paymentType: 'DEPOSIT',
 source: rev.source,
 })
 }
 }

 // 2. Décaissements depuis les dépenses du store (sorties)
 const startDateObj = new Date(dateFilters.startDate)
 const endDateObj = new Date(dateFilters.endDate)
 endDateObj.setHours(23, 59, 59, 999)

 const expenses = storeInvoices.filter(i => i.type === 'expense' || i.type === 'purchase')
 for (const exp of expenses) {
 const expDate = new Date(exp.date)
 if (expDate < startDateObj || expDate > endDateObj) continue

 // Seulement si la dépense est payée
 if (!exp.paid) continue

 rows.push({
 id: `exp-${exp.id}`,
 date: exp.paidAt || exp.date,
 ref: exp.ref || exp.id.slice(0, 8),
 method: normalizePaymentMethod(exp.paymentMethod),
 amountHT: exp.totals.ht,
 amountTTC: exp.totals.ttc,
 direction: 'OUT',
 customerName: exp.partnerName,
 isDeposit: false,
 paymentType: 'EXPENSE',
 source: 'EXPENSE',
 })
 }

 return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
 }, [revenues, storeInvoices, dateFilters])

 const filtered = payments.filter(p => (methodFilter === 'ALL' ? true : p.method === methodFilter))

 // Pagination
 const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
 const paginatedItems = filtered.slice(
 (currentPage - 1) * ITEMS_PER_PAGE,
 currentPage * ITEMS_PER_PAGE
 )

 // Reset page quand filtre change
 React.useEffect(() => {
 setCurrentPage(1)
 }, [methodFilter, dateFilters.startDate, dateFilters.endDate, selectedPlatform])

 const getAmount = (p: (typeof payments)[0]) => (showTTC ? p.amountTTC : p.amountHT)

 const totalsByMethod = useMemo(() => {
 const acc: Record<string, { in: number; out: number; deposits: number }> = {}
 for (const p of payments) {
 const key = p.method || 'AUTRE'
 const amount = showTTC ? p.amountTTC : p.amountHT
 acc[key] = acc[key] || { in: 0, out: 0, deposits: 0 }
 if (p.direction === 'IN') {
 if (p.isDeposit) acc[key].deposits += amount
 else acc[key].in += amount
 } else {
 acc[key].out += amount
 }
 }
 return acc
 }, [payments, showTTC])

 const globalTotals = useMemo(() => {
 return payments.reduce(
 (acc, p) => {
 const amount = showTTC ? p.amountTTC : p.amountHT
 if (p.direction === 'IN') {
 if (p.isDeposit) acc.deposits += amount
 else acc.in += amount
 } else {
 acc.out += amount
 }
 return acc
 },
 { in: 0, out: 0, deposits: 0 }
 )
 }, [payments, showTTC])

 const methods = ['ALL', ...PAYMENT_METHODS]

 const getMethodIcon = (method: string) => {
 switch (method?.toUpperCase()) {
 case 'BANQUE':
 return <Building className="w-4 h-4" />
 case 'CAISSE':
 return <Banknote className="w-4 h-4" />
 case 'WAVE':
 case 'ORANGE_MONEY':
 case 'MTN_MONEY':
 case 'MOOV_MONEY':
 case 'MOBILE_MONEY':
 return <Smartphone className="w-4 h-4" />
 default:
 return <CreditCard className="w-4 h-4" />
 }
 }

 const getMethodColor = (method: string) => {
 switch (method?.toUpperCase()) {
 case 'BANQUE':
 return ' text-blue-400 border-white/[0.06]'
 case 'CAISSE':
 return ' text-green-400 border-white/[0.06]'
 case 'WAVE':
 case 'ORANGE_MONEY':
 case 'MTN_MONEY':
 case 'MOOV_MONEY':
 case 'MOBILE_MONEY':
 return ' text-purple-400 border-white/[0.06]'
 default:
 return 'bg-tribal-black text-white/80 border-white/[0.06]'
 }
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

 const handleCreate = () => {
 const amount = Number(form.amount)
 if (!amount || amount <= 0) return alert('Montant invalide')
 const date = form.date || new Date().toISOString().slice(0, 10)
 const payAcc = settings.paymentAccounts[form.method as keyof typeof settings.paymentAccounts]
 const acc = settings.accounts
 const lines =
 form.direction === 'IN'
 ? [
 { account: payAcc, debit: amount },
 { account: acc['40'].code, credit: amount },
 ]
 : [
 { account: acc['61'].code, debit: amount },
 { account: payAcc, credit: amount },
 ]
 addJournalEntry({
 id: `J-${Date.now()}-PAY-MAN`,
 date,
 ref: form.ref || undefined,
 lines,
 })
 setShowForm(false)
 setForm({ date, method: form.method, direction: form.direction, amount: '', ref: '' })
 }

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

 {/* Sélecteur de mois (visible quand période = mois) */}
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
 <CreditCard className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Encaissements</h1>
 <p className="text-white/70 text-sm">
 Paiements recus et decaissements (depuis Revenus et Depenses)
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {/* Toggle HT/TTC */}
 <div className="flex items-center gap-2 bg-white/[0.1] backdrop-blur-sm rounded-xl px-3 py-2">
 <span className={`text-sm font-medium ${!showTTC ? 'text-white' : 'text-white/50'}`}>
 HT
 </span>
 <button
 onClick={() => setShowTTC(s => !s)}
 className={`relative w-12 h-6 rounded-full transition-colors ${showTTC ? 'bg-emerald-500' : 'bg-white/30'}`}
 >
 <div
 className={`absolute top-1 w-4 h-4 rounded-full bg-white/[0.03] transition-transform ${showTTC ? 'left-7' : 'left-1'}`}
 />
 </button>
 <span className={`text-sm font-medium ${showTTC ? 'text-white' : 'text-white/50'}`}>
 TTC
 </span>
 </div>

 {/* Sync button */}
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleSync}
 disabled={syncing || loading}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50"
 >
 <RefreshCw className={cn('w-4 h-4', (syncing || loading) && 'animate-spin')} />
 <span className="text-sm font-medium hidden sm:inline">Actualiser</span>
 </motion.button>

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => setShowForm(s => !s)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
 showForm
 ? 'bg-white/30 text-white'
 : 'bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm'
 }`}
 >
 {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
 <span className="text-sm font-medium">
 {showForm ? 'Fermer' : 'Nouvel encaissement'}
 </span>
 </motion.button>
 </div>
 </div>

 {/* Stats globales */}
 <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
 <div className="text-center">
 <div className="text-2xl md:text-3xl font-bold">{payments.length}</div>
 <div className="text-xs text-white/70">Transactions</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-emerald-300">
 {formatCurrency(globalTotals.in)}
 </div>
 <div className="text-xs text-white/70">Encaissements</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-amber-300">
 {formatCurrency(globalTotals.deposits)}
 </div>
 <div className="text-xs text-white/70">Acomptes recus</div>
 </div>
 <div className="text-center">
 <div className="text-lg md:text-xl font-bold text-rose-300">
 {formatCurrency(globalTotals.out)}
 </div>
 <div className="text-xs text-white/70">Decaissements</div>
 </div>
 </div>

 {/* Total net */}
 <div className="relative mt-3 pt-3 border-t border-white/10 text-center">
 <div className="text-xl font-bold text-cyan-300">
 {formatCurrency(globalTotals.in + globalTotals.deposits - globalTotals.out)}
 </div>
 <div className="text-xs text-white/70">Solde net periode</div>
 </div>
 </motion.div>

 {/* Formulaire */}
 <AnimatePresence>
 {showForm && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 md:p-6 shadow-sm">
 <div className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
 <Banknote className="w-4 h-4" />
 Nouvel encaissement
 </div>
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div>
 <label className="block text-xs font-medium text-white/60 mb-1.5">
 Date
 </label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="date"
 className="w-full pl-10 pr-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all"
 value={form.date}
 onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-white/60 mb-1.5">
 Methode
 </label>
 <select
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all"
 value={form.method}
 onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
 >
 {Object.keys(settings.paymentAccounts).map(m => (
 <option key={m} value={m}>
 {PAYMENT_METHOD_LABELS[m as keyof typeof PAYMENT_METHOD_LABELS] || m}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-white/60 mb-1.5">
 Direction
 </label>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setForm(f => ({ ...f, direction: 'IN' }))}
 className={`flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${
 form.direction === 'IN'
 ? ' border-emerald-500/30 text-emerald-400'
 : 'border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 <ArrowDownLeft className="w-4 h-4" />
 <span className="text-sm">Entree</span>
 </button>
 <button
 type="button"
 onClick={() => setForm(f => ({ ...f, direction: 'OUT' }))}
 className={`flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${
 form.direction === 'OUT'
 ? ' border-white/[0.08] text-rose-400'
 : 'border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 <ArrowUpRight className="w-4 h-4" />
 <span className="text-sm">Sortie</span>
 </button>
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-white/60 mb-1.5">
 Montant ({settings.currency})
 </label>
 <input
 type="number"
 min={0}
 placeholder="0"
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all"
 value={form.amount}
 onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-white/60 mb-1.5">
 Ref/Note
 </label>
 <input
 type="text"
 placeholder="Optionnel"
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all"
 value={form.ref}
 onChange={e => setForm(f => ({ ...f, ref: e.target.value }))}
 />
 </div>
 </div>
 <div className="mt-4 flex justify-end">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={handleCreate}
 className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
 >
 <CheckCircle2 className="w-4 h-4" />
 Enregistrer
 </motion.button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Filtre par méthode */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="flex items-center gap-2 overflow-x-auto pb-2"
 >
 <Filter className="w-4 h-4 text-white/50 flex-shrink-0" />
 {methods.map(m => (
 <button
 key={m}
 onClick={() => setMethodFilter(m)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
 methodFilter === m
 ? ' text-teal-400'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 {m === 'ALL' ? (
 'Tous'
 ) : (
 <>
 {getMethodIcon(m)}
 {PAYMENT_METHOD_LABELS[m as keyof typeof PAYMENT_METHOD_LABELS] || m}
 </>
 )}
 </button>
 ))}
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
 <th className="px-4 py-3 font-semibold">Date</th>
 <th className="px-4 py-3 font-semibold">Reference</th>
 <th className="px-4 py-3 font-semibold">Client/Fournisseur</th>
 <th className="px-4 py-3 font-semibold">Methode</th>
 <th className="px-4 py-3 font-semibold">Direction</th>
 <th className="px-4 py-3 font-semibold text-right">Montant</th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence mode="popLayout">
 {paginatedItems.map((p, idx) => {
 return (
 <motion.tr
 key={p.id}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 transition={{ delay: idx * 0.02 }}
 className="border-t border-white/[0.04] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-4 py-3 text-white/60">
 <div className="flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 {new Date(p.date).toLocaleDateString('fr-FR')}
 </div>
 </td>
 <td className="px-4 py-3">
 <span className="px-2.5 py-1.5 text-purple-400 rounded-lg text-xs font-bold">
 {p.ref ? formatRef(p.ref) : '-'}
 </span>
 </td>
 <td className="px-4 py-3 text-white/80">
 {p.customerName || '-'}
 </td>
 <td className="px-4 py-3">
 <span
 className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getMethodColor(p.method || 'AUTRE')}`}
 >
 {getMethodIcon(p.method || 'AUTRE')}
 {PAYMENT_METHOD_LABELS[
 (p.method || 'AUTRE') as keyof typeof PAYMENT_METHOD_LABELS
 ] ||
 p.method ||
 'AUTRE'}
 </span>
 </td>
 <td className="px-4 py-3">
 {p.direction === 'IN' ? (
 <span className="inline-flex items-center gap-1 text-emerald-400">
 <ArrowDownLeft className="w-4 h-4" />
 {p.isDeposit ? 'Acompte' : 'Entree'}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-rose-400">
 <ArrowUpRight className="w-4 h-4" />
 Sortie
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-right font-semibold">
 <span
 className={
 p.direction === 'IN'
 ? 'text-emerald-400'
 : 'text-rose-400'
 }
 >
 {p.direction === 'IN' ? '+' : '-'}
 {formatCurrency(getAmount(p))}
 </span>
 </td>
 </motion.tr>
 )
 })}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 </motion.div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
 <div className="text-sm text-white/60">
 Affichage{' '}
 <span className="font-medium text-white">
 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
 </span>{' '}
 sur{' '}
 <span className="font-medium text-white">{filtered.length}</span>{' '}
 transactions
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setCurrentPage(1)}
 disabled={currentPage === 1}
 className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
 >
 <ChevronsLeft className="w-4 h-4" />
 </button>
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="flex items-center justify-center px-3 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors text-sm"
 >
 <ChevronLeft className="w-4 h-4" />
 <span className="hidden sm:inline ml-1">Precedent</span>
 </button>
 <div className="hidden md:flex items-center gap-1">
 {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
 let page: number
 if (totalPages <= 7) {
 page = i + 1
 } else if (currentPage <= 4) {
 page = i + 1
 } else if (currentPage >= totalPages - 3) {
 page = totalPages - 6 + i
 } else {
 page = currentPage - 3 + i
 }
 return (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
 currentPage === page
 ? 'bg-teal-600 text-white'
 : 'border border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 {page}
 </button>
 )
 })}
 </div>
 <div className="md:hidden px-3 py-1.5 text-sm font-medium text-white">
 {currentPage} / {totalPages}
 </div>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="flex items-center justify-center px-3 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors text-sm"
 >
 <span className="hidden sm:inline mr-1">Suivant</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 <button
 onClick={() => setCurrentPage(totalPages)}
 disabled={currentPage === totalPages}
 className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
 >
 <ChevronsRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 {/* Mobile Cards */}
 <div className="md:hidden space-y-3">
 <AnimatePresence mode="popLayout">
 {paginatedItems.map((p, idx) => {
 return (
 <motion.div
 key={p.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ delay: idx * 0.03 }}
 className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3 shadow-sm"
 >
 <div className="flex items-center justify-between">
 <span
 className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getMethodColor(p.method || 'AUTRE')}`}
 >
 {getMethodIcon(p.method || 'AUTRE')}
 {PAYMENT_METHOD_LABELS[
 (p.method || 'AUTRE') as keyof typeof PAYMENT_METHOD_LABELS
 ] ||
 p.method ||
 'AUTRE'}
 </span>
 <span className="text-xs text-white/50 flex items-center gap-1">
 <Calendar className="w-3 h-3" />
 {new Date(p.date).toLocaleDateString('fr-FR')}
 </span>
 </div>

 {p.customerName && (
 <div className="text-sm font-medium text-white/80">
 {p.customerName}
 </div>
 )}

 {p.ref && (
 <div className="text-xs text-white/50">
 <span className="px-2 py-1 text-purple-400 rounded-lg font-bold">
 {formatRef(p.ref)}
 </span>
 </div>
 )}

 <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
 <div className="flex items-center gap-1">
 {p.direction === 'IN' ? (
 <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
 <ArrowDownLeft className="w-4 h-4" />
 {p.isDeposit ? 'Acompte' : 'Entree'}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-rose-400 text-sm">
 <ArrowUpRight className="w-4 h-4" />
 Sortie
 </span>
 )}
 </div>
 <span
 className={`font-bold text-lg ${p.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {p.direction === 'IN' ? '+' : '-'}
 {formatCurrency(getAmount(p))}
 </span>
 </div>
 </motion.div>
 )
 })}
 </AnimatePresence>
 </div>

 {/* Résumé par méthode */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
 >
 {Object.entries(totalsByMethod).map(([m, v], idx) => (
 <motion.div
 key={m}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.3 + idx * 0.05 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-sm"
 >
 <div className="flex items-center gap-2 mb-3">
 <div
 className={`w-8 h-8 rounded-lg flex items-center justify-center ${getMethodColor(m)}`}
 >
 {getMethodIcon(m)}
 </div>
 <span className="font-semibold text-white/80">
 {PAYMENT_METHOD_LABELS[m as keyof typeof PAYMENT_METHOD_LABELS] || m}
 </span>
 </div>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs text-white/50 flex items-center gap-1">
 <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
 Entrees
 </span>
 <span className="font-semibold text-emerald-400">
 {formatCurrency(v.in)}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-xs text-white/50 flex items-center gap-1">
 <ArrowUpRight className="w-3 h-3 text-rose-500" />
 Sorties
 </span>
 <span className="font-semibold text-rose-400">
 {formatCurrency(v.out)}
 </span>
 </div>
 <div className="pt-2 mt-2 border-t border-white/[0.04] flex items-center justify-between">
 <span className="text-xs text-white/50">Solde</span>
 <span
 className={`font-bold ${v.in - v.out >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
 >
 {formatCurrency(v.in - v.out)}
 </span>
 </div>
 </div>
 </motion.div>
 ))}
 </motion.div>

 {/* Empty state */}
 {filtered.length === 0 && !loading && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-12 text-white/50"
 >
 <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p className="font-medium">Aucun encaissement</p>
 <p className="text-sm">Aucun paiement recu pour cette periode</p>
 </motion.div>
 )}
 </div>
 )
}

export default PaymentsPage
