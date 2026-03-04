/**
 * Page Revenus - Affiche tous les revenus (Commandes + Devis)
 * Fusionne VentesPage + DevisPage pour une vue unifiee
 * Les montants EXCLUENT les frais de livraison (factures par agence externe)
 */

import React, { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 Wallet,
 Search,
 DollarSign,
 TrendingUp,
 CheckCircle2,
 RefreshCw,
 CreditCard,
 FileText,
 ShoppingCart,
 Receipt,
 Banknote,
 X,
 ChevronDown,
 ArrowRightCircle,
 Edit3,
} from 'lucide-react'
import {
 useUnifiedRevenues,
 type UnifiedRevenue,
 type RevenueSource,
 syncRevenues,
 recordPayment,
 updateRevenuePaymentMethod,
 markRevenuePaid,
 convertQuoteToOrder,
 type PaymentType,
} from '../../lib/hooks/useUnifiedRevenues'
import { useAccountingFilters, filterRevenuesByPlatform } from '../../store/accountingFilters'
import { AccountingFiltersBar } from '../../components/accounting/AccountingFiltersBar'
import {
 generateAndDownloadInvoice,
 generateAndDownloadQuote,
} from '../../services/invoiceGenerator'
import { EditQuoteModal } from '../../components/accounting/EditQuoteModal'
import { useAccountingStore } from '../../store/accounting'
import { cn } from '../../lib/utils'

// Labels pour les sources de revenus
const SOURCE_LABELS: Record<RevenueSource, string> = {
 PRINT: 'Print',
 AGENCY: 'Agency',
 KAUI: 'Kaui',
 QUOTE: 'Devis',
}

// Couleurs pour les sources
const SOURCE_COLORS: Record<RevenueSource, { bg: string; text: string }> = {
 PRINT: {
 bg: '',
 text: 'text-emerald-400',
 },
 AGENCY: {
 bg: '',
 text: 'text-purple-400',
 },
 KAUI: {
 bg: '',
 text: 'text-blue-400',
 },
 QUOTE: {
 bg: '',
 text: 'text-orange-400',
 },
}

// Couleurs pour les plateformes Print
const TENANT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
 'tribal-print': {
 bg: '',
 text: 'text-tribal-accent',
 label: 'Tribal Print',
 },
 'jericho-print': {
 bg: '',
 text: 'text-amber-400',
 label: 'Jericho Print',
 },
 'muslim-print': {
 bg: '',
 text: 'text-teal-400',
 label: 'Muslim Print',
 },
 'tribal-verra': {
 bg: '',
 text: 'text-rose-400',
 label: 'Tribal Verra',
 },
}

// Modes de paiement
const PAYMENT_METHODS = [
 { value: 'WAVE', label: 'Wave' },
 { value: 'ORANGE_MONEY', label: 'Orange Money' },
 { value: 'MTN_MONEY', label: 'MTN Money' },
 { value: 'MOOV_MONEY', label: 'Moov Money' },
 { value: 'CASH', label: 'Especes' },
 { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
 { value: 'CHECK', label: 'Cheque' },
]

// Formater la devise XOF
function formatXOF(amount: number): string {
 return amount.toLocaleString('fr-FR') + ' F'
}

// Formater la date
function formatDate(dateStr?: string): string {
 if (!dateStr) return '-'
 const date = new Date(dateStr)
 return date.toLocaleDateString('fr-FR', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 })
}

// Formater date courte
function formatShortDate(dateStr?: string): string {
 if (!dateStr) return '-'
 const date = new Date(dateStr)
 return date.toLocaleDateString('fr-FR', {
 day: '2-digit',
 month: 'short',
 })
}

// Types d'onglets
type TabType = 'all' | 'orders' | 'quotes'

// Helper: extraire le montant SANS frais de livraison
function getAmountWithoutDelivery(revenue: UnifiedRevenue): number {
 const meta = revenue.metadata as { deliveryFee?: number } | null
 const deliveryFee = meta?.deliveryFee || 0
 return Math.max(0, revenue.amount - deliveryFee)
}

// Helper: calculer le solde restant (sans livraison)
function getBalance(revenue: UnifiedRevenue): number {
 const amountWithoutDelivery = getAmountWithoutDelivery(revenue)
 return Math.max(0, amountWithoutDelivery - revenue.paidAmount)
}

// Modal d'enregistrement de paiement
interface PaymentModalProps {
 revenue: UnifiedRevenue
 onClose: () => void
 onSuccess: () => void
}

const PaymentModal: React.FC<PaymentModalProps> = ({ revenue, onClose, onSuccess }) => {
 const balance = getBalance(revenue)
 const [amount, setAmount] = useState(balance)
 const [method, setMethod] = useState('WAVE')
 const [type, setType] = useState<PaymentType>('PAYMENT')
 const [reference, setReference] = useState('')
 const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10))
 const [notes, setNotes] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (amount <= 0) {
 setError('Le montant doit etre superieur a 0')
 return
 }

 setLoading(true)
 setError(null)

 try {
 await recordPayment(revenue.id, {
 amount,
 method,
 type,
 reference: reference || undefined,
 receivedAt,
 notes: notes || undefined,
 })
 onSuccess()
 onClose()
 } catch (err) {
 setError((err as Error).message)
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-white/[0.03] rounded-xl shadow-xl w-full max-w-md"
 >
 <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <Banknote className="w-5 h-5 text-emerald-400" />
 Enregistrer un paiement
 </h3>
 <button
 onClick={onClose}
 className="p-1 text-white/50 hover:text-white/60"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-4 space-y-4">
 {/* Info client */}
 <div className="bg-tribal-black rounded-lg p-3">
 <p className="text-sm font-medium text-white">
 {revenue.clientName}
 </p>
 <p className="text-xs text-white/50">
 {revenue.sourceRef || revenue.id.slice(0, 8)}
 </p>
 <div className="mt-2 flex justify-between text-sm">
 <span className="text-white/50">Solde restant:</span>
 <span className="font-semibold text-orange-400">{formatXOF(balance)}</span>
 </div>
 </div>

 {error && (
 <div className="bg-red-950/30 text-red-400 text-sm p-3 rounded-lg">
 {error}
 </div>
 )}

 {/* Montant */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Montant *
 </label>
 <input
 type="number"
 value={amount}
 onChange={e => setAmount(Number(e.target.value))}
 min={1}
 max={balance}
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 />
 <div className="flex gap-2 mt-2">
 <button
 type="button"
 onClick={() => setAmount(balance)}
 className="text-xs px-2 py-1 text-emerald-400 rounded"
 >
 Solder ({formatXOF(balance)})
 </button>
 {balance > 10000 && (
 <button
 type="button"
 onClick={() => setAmount(Math.round(balance / 2))}
 className="text-xs px-2 py-1 bg-tribal-black text-white/60 rounded"
 >
 50% ({formatXOF(Math.round(balance / 2))})
 </button>
 )}
 </div>
 </div>

 {/* Mode de paiement */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Mode de paiement *
 </label>
 <select
 value={method}
 onChange={e => setMethod(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 >
 {PAYMENT_METHODS.map(m => (
 <option key={m.value} value={m.value}>
 {m.label}
 </option>
 ))}
 </select>
 </div>

 {/* Type de paiement */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Type
 </label>
 <select
 value={type}
 onChange={e => setType(e.target.value as PaymentType)}
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 >
 <option value="DEPOSIT">Acompte</option>
 <option value="PAYMENT">Paiement</option>
 <option value="BALANCE">Solde</option>
 </select>
 </div>

 {/* Date */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Date de reception *
 </label>
 <input
 type="date"
 value={receivedAt}
 onChange={e => setReceivedAt(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 />
 </div>

 {/* Reference */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Reference (optionnel)
 </label>
 <input
 type="text"
 value={reference}
 onChange={e => setReference(e.target.value)}
 placeholder="Ex: WAVE-123456"
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 />
 </div>

 {/* Notes */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Notes (optionnel)
 </label>
 <textarea
 value={notes}
 onChange={e => setNotes(e.target.value)}
 rows={2}
 className="w-full px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white resize-none"
 />
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-white/60 hover:text-white"
 >
 Annuler
 </button>
 <button
 type="submit"
 disabled={loading || amount <= 0}
 className="px-4 py-2 bg-tribal-accent hover:bg-tribal-accent-light text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
 >
 {loading ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <CheckCircle2 className="w-4 h-4" />
 )}
 Enregistrer
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )
}

// Composant ligne de tableau avec details acompte
const RevenueRow: React.FC<{
 revenue: UnifiedRevenue
 index: number
 onPayment: (revenue: UnifiedRevenue) => void
 onRefresh: () => void
 isSelected: boolean
 onToggleSelect: (id: string) => void
 onEdit?: (revenue: UnifiedRevenue) => void
}> = ({ revenue, index, onPayment, onRefresh, isSelected, onToggleSelect, onEdit }) => {
 const [expanded, setExpanded] = useState(false)
 const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false)
 const [generatingPdf, setGeneratingPdf] = useState(false)
 const [showDepositDropdown, setShowDepositDropdown] = useState(false)
 const [showBalanceDropdown, setShowBalanceDropdown] = useState(false)
 const amountWithoutDelivery = getAmountWithoutDelivery(revenue)
 const balance = getBalance(revenue)
 // Plafonner le montant payé affiché au montant produit (le client a pu payer livraison incluse)
 const displayPaid = Math.min(revenue.paidAmount, amountWithoutDelivery)
 const meta = revenue.metadata as {
 tenantSlug?: string
 deliveryFee?: number
 paymentMethod?: string
 items?: Array<{ description?: string; quantity?: number; unitPrice?: number; total?: number }>
 } | null
 const tenantSlug = meta?.tenantSlug
 const tenantInfo = tenantSlug ? TENANT_COLORS[tenantSlug] : null
 const hasPayments = revenue.payments && revenue.payments.length > 0

 // Determiner le mode de paiement a afficher:
 // 1. Si des paiements existent, prendre le dernier mode utilise
 // 2. Sinon, utiliser metadata.paymentMethod comme fallback
 const getDisplayPaymentMethod = (): string => {
 if (hasPayments && revenue.payments!.length > 0) {
 // Trier par date et prendre le dernier
 const sortedPayments = [...revenue.payments!].sort(
 (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
 )
 return (sortedPayments[0].method || '').toUpperCase()
 }
 return (meta?.paymentMethod || '').toUpperCase()
 }

 const currentPaymentMethod = getDisplayPaymentMethod()
 const [markingPaid, setMarkingPaid] = useState(false)
 const [convertingToOrder, setConvertingToOrder] = useState(false)

 // Handler pour convertir un devis en commande
 const handleConvertToOrder = async (e: React.MouseEvent) => {
 e.stopPropagation()
 if (convertingToOrder || revenue.source !== 'QUOTE') return

 // Verifier que ce n'est pas deja converti
 const quoteStatus = (meta as { quoteStatus?: string } | null)?.quoteStatus
 if (quoteStatus === 'converted') {
 alert('Ce devis a deja ete converti en commande')
 return
 }

 if (!confirm('Convertir ce devis en commande de production ?')) return

 setConvertingToOrder(true)
 try {
 const result = await convertQuoteToOrder(revenue.sourceId)
 alert(`Commande ${result.order.orderNumber} creee avec succes!`)
 onRefresh()
 } catch (error) {
 console.error('Erreur conversion devis:', error)
 alert(`Erreur: ${(error as Error).message}`)
 } finally {
 setConvertingToOrder(false)
 }
 }

 // Handler pour marquer comme solde avec le mode selectionne
 const handleMarkPaid = async (e: React.MouseEvent) => {
 e.stopPropagation()
 if (markingPaid || balance <= 0) return

 const method = currentPaymentMethod || 'WAVE'
 if (!confirm(`Marquer comme solde (${method}) ?`)) return

 setMarkingPaid(true)
 try {
 await markRevenuePaid(revenue.id, method)
 onRefresh()
 } catch (error) {
 console.error('Erreur marquage solde:', error)
 alert('Erreur lors du marquage comme solde')
 } finally {
 setMarkingPaid(false)
 }
 }

 // Handler pour telecharger la facture PDF
 const handleDownloadPdf = async (e: React.MouseEvent) => {
 e.stopPropagation()
 if (generatingPdf) return

 setGeneratingPdf(true)
 try {
 // Preparer les donnees selon le type (Devis ou Commande)
 if (revenue.source === 'QUOTE') {
 // Pour les devis, utiliser generateAndDownloadQuote
 const quoteData = {
 id: revenue.sourceRef || revenue.id.slice(0, 8),
 date: revenue.invoiceDate,
 partnerName: revenue.clientName,
 brand: tenantSlug || 'tribal-print',
 lines: [
 {
 description: revenue.description || 'Service',
 qty: 1,
 unitPriceHT: amountWithoutDelivery,
 },
 ],
 totals: {
 ht: amountWithoutDelivery,
 tva: 0,
 ttc: amountWithoutDelivery,
 },
 }
 await generateAndDownloadQuote(quoteData)
 } else {
 // Pour les commandes (PRINT, AGENCY, KAUI)
 const invoiceData = {
 orderNumber: revenue.sourceRef || revenue.id.slice(0, 8),
 orderDate: revenue.invoiceDate,
 tenant: tenantSlug,
 customer: {
 name: revenue.clientName,
 phone: revenue.clientPhone,
 },
 items: [
 {
 description: revenue.description || 'Produit',
 quantity: 1,
 unitPrice: amountWithoutDelivery,
 total: amountWithoutDelivery,
 },
 ],
 pricing: {
 subtotal: amountWithoutDelivery,
 total: amountWithoutDelivery,
 },
 }
 await generateAndDownloadInvoice(invoiceData)
 }
 } catch (error) {
 console.error('Erreur generation PDF:', error)
 alert('Erreur lors de la generation du PDF')
 } finally {
 setGeneratingPdf(false)
 }
 }

 return (
 <>
 <motion.tr
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.02 }}
 className={cn(
 'hover:bg-white/[0.06] cursor-pointer',
 balance > 0 && !revenue.isPaid && 'bg-amber-900/20/50',
 isSelected && 'bg-blue-900/20'
 )}
 onClick={() => hasPayments && setExpanded(!expanded)}
 >
 {/* Checkbox */}
 <td className="px-2 py-2 whitespace-nowrap">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => onToggleSelect(revenue.id)}
 onClick={e => e.stopPropagation()}
 className="w-3.5 h-3.5 rounded border-white/[0.08] text-blue-400 focus:ring-blue-500 cursor-pointer"
 />
 </td>
 {/* Date */}
 <td className="px-2 py-2 whitespace-nowrap text-xs text-white">
 {formatDate(revenue.invoiceDate)}
 </td>
 {/* Reference */}
 <td className="px-2 py-2 whitespace-nowrap">
 <span className="text-xs font-mono text-white">
 {revenue.sourceRef || revenue.id.slice(0, 8)}
 </span>
 </td>
 {/* Source + Plateforme fusionnees */}
 <td className="px-2 py-2 whitespace-nowrap">
 <div className="flex flex-col gap-0.5">
 <span
 className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${SOURCE_COLORS[revenue.source].bg} ${SOURCE_COLORS[revenue.source].text}`}
 >
 {SOURCE_LABELS[revenue.source]}
 </span>
 {tenantInfo && (
 <span className={`text-[10px] ${tenantInfo.text}`}>{tenantInfo.label}</span>
 )}
 </div>
 </td>
 {/* Client */}
 <td className="px-2 py-2">
 <p className="text-xs font-medium text-white truncate max-w-[120px]">
 {revenue.clientName}
 </p>
 {revenue.clientPhone && (
 <p className="text-[10px] text-white/50">{revenue.clientPhone}</p>
 )}
 </td>
 {/* Total */}
 <td className="px-2 py-2 whitespace-nowrap text-right">
 <span className="text-xs font-semibold text-white">
 {formatXOF(amountWithoutDelivery)}
 </span>
 </td>
 {/* Paye / Acompte - cliquable pour choisir le mode de paiement de l'acompte */}
 <td className="px-2 py-2 whitespace-nowrap text-right relative">
 {revenue.isPaid || balance <= 0 ? (
 // Solde complet - afficher avec dropdown pour modifier le mode
 <div className="relative inline-block">
 <button
 onClick={e => {
 e.stopPropagation()
 setShowDepositDropdown(!showDepositDropdown)
 setShowBalanceDropdown(false)
 }}
 className="flex flex-col items-end gap-0.5 cursor-pointer group"
 title="Cliquer pour modifier le mode de paiement"
 >
 <span className="text-xs font-medium text-emerald-400 group-hover:underline">
 {formatXOF(displayPaid)}
 </span>
 {currentPaymentMethod && (
 <span className="text-[9px] px-1 py-0.5 text-emerald-400 rounded">
 {PAYMENT_METHODS.find(m => m.value === currentPaymentMethod)?.label ||
 currentPaymentMethod}
 </span>
 )}
 </button>
 {showDepositDropdown && (
 <div
 className="absolute right-0 top-full mt-1 z-50 bg-white/[0.03] border border-white/[0.06] rounded-lg shadow-lg py-1 min-w-[160px]"
 onClick={e => e.stopPropagation()}
 >
 <div className="px-2 py-1 text-[10px] text-white/50 border-b border-white/[0.04]">
 Mode de paiement:
 </div>
 {PAYMENT_METHODS.map(m => (
 <button
 key={m.value}
 onClick={async e => {
 e.stopPropagation()
 setShowDepositDropdown(false)
 setUpdatingPaymentMethod(true)
 try {
 await updateRevenuePaymentMethod(revenue.id, m.value)
 onRefresh()
 } catch (error) {
 console.error('Erreur mise a jour mode:', error)
 alert('Erreur lors de la mise a jour')
 } finally {
 setUpdatingPaymentMethod(false)
 }
 }}
 disabled={updatingPaymentMethod}
 className={cn(
 'w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.06] flex items-center gap-2',
 currentPaymentMethod === m.value &&
 'bg-emerald-900/20 text-emerald-400'
 )}
 >
 <CreditCard className="w-3 h-3 text-white/50" />
 {m.label}
 {currentPaymentMethod === m.value && (
 <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
 )}
 </button>
 ))}
 </div>
 )}
 </div>
 ) : revenue.paidAmount > 0 ? (
 // Acompte partiel - afficher avec dropdown et badge
 <div className="relative inline-block">
 <button
 onClick={e => {
 e.stopPropagation()
 setShowDepositDropdown(!showDepositDropdown)
 setShowBalanceDropdown(false)
 }}
 className="flex flex-col items-end gap-0.5 cursor-pointer group"
 title="Cliquer pour changer le mode de paiement de l'acompte"
 >
 <div className="flex items-center gap-0.5">
 <span className="text-xs font-semibold text-amber-400 group-hover:underline">
 {formatXOF(displayPaid)}
 </span>
 <ChevronDown
 className={cn(
 'w-3 h-3 text-white/50 transition-transform',
 showDepositDropdown && 'rotate-180'
 )}
 />
 </div>
 {currentPaymentMethod && (
 <span className="text-[9px] px-1 py-0.5 text-amber-400 rounded">
 {PAYMENT_METHODS.find(m => m.value === currentPaymentMethod)?.label ||
 currentPaymentMethod}
 </span>
 )}
 </button>
 {showDepositDropdown && (
 <div
 className="absolute right-0 top-full mt-1 z-50 bg-white/[0.03] border border-white/[0.06] rounded-lg shadow-lg py-1 min-w-[160px]"
 onClick={e => e.stopPropagation()}
 >
 <div className="px-2 py-1 text-[10px] text-white/50 border-b border-white/[0.04]">
 Mode de paiement acompte:
 </div>
 {PAYMENT_METHODS.map(m => (
 <button
 key={m.value}
 onClick={async e => {
 e.stopPropagation()
 setShowDepositDropdown(false)
 setUpdatingPaymentMethod(true)
 try {
 await updateRevenuePaymentMethod(revenue.id, m.value)
 onRefresh()
 } catch (error) {
 console.error('Erreur mise a jour mode:', error)
 alert('Erreur lors de la mise a jour')
 } finally {
 setUpdatingPaymentMethod(false)
 }
 }}
 disabled={updatingPaymentMethod}
 className={cn(
 'w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.06] flex items-center gap-2',
 currentPaymentMethod === m.value &&
 'bg-amber-900/20 text-amber-400'
 )}
 >
 <CreditCard className="w-3 h-3 text-white/50" />
 {m.label}
 {currentPaymentMethod === m.value && (
 <CheckCircle2 className="w-3 h-3 text-amber-400 ml-auto" />
 )}
 </button>
 ))}
 </div>
 )}
 </div>
 ) : (
 <span className="text-xs text-white/50">-</span>
 )}
 </td>
 {/* Reste - cliquable pour marquer comme paye */}
 <td className="px-2 py-2 whitespace-nowrap text-right relative">
 {balance > 0 ? (
 <div className="relative inline-block">
 <button
 onClick={e => {
 e.stopPropagation()
 setShowBalanceDropdown(!showBalanceDropdown)
 setShowDepositDropdown(false)
 }}
 className="text-xs font-semibold text-orange-400 hover:text-orange-400 hover:underline cursor-pointer"
 title="Cliquer pour marquer comme paye"
 >
 {formatXOF(balance)}
 </button>
 {showBalanceDropdown && (
 <div
 className="absolute right-0 top-full mt-1 z-50 bg-white/[0.03] border border-white/[0.06] rounded-lg shadow-lg py-1 min-w-[140px]"
 onClick={e => e.stopPropagation()}
 >
 <div className="px-2 py-1 text-[10px] text-white/50 border-b border-white/[0.04]">
 Marquer solde via:
 </div>
 {PAYMENT_METHODS.map(m => (
 <button
 key={m.value}
 onClick={async e => {
 e.stopPropagation()
 setShowBalanceDropdown(false)
 setMarkingPaid(true)
 try {
 await markRevenuePaid(revenue.id, m.value)
 onRefresh()
 } catch (error) {
 console.error('Erreur marquage solde:', error)
 alert('Erreur lors du marquage comme solde')
 } finally {
 setMarkingPaid(false)
 }
 }}
 disabled={markingPaid}
 className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.06] flex items-center gap-2"
 >
 <CreditCard className="w-3 h-3 text-white/50" />
 {m.label}
 </button>
 ))}
 </div>
 )}
 </div>
 ) : (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
 )}
 </td>
 {/* Actions */}
 <td className="px-2 py-2 whitespace-nowrap">
 <div className="flex items-center justify-center gap-0.5">
 {/* Bouton Editer - uniquement pour les devis */}
 {revenue.source === 'QUOTE' && onEdit && (
 <button
 onClick={e => {
 e.stopPropagation()
 onEdit(revenue)
 }}
 className="p-1 text-amber-400 hover:bg-amber-900/20 rounded transition-colors"
 title="Modifier le devis"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 )}
 <button
 onClick={handleDownloadPdf}
 disabled={generatingPdf}
 className={cn(
 'p-1 text-blue-400 hover:bg-blue-900/20 rounded transition-colors',
 generatingPdf && 'opacity-50 cursor-wait'
 )}
 title={revenue.source === 'QUOTE' ? 'Devis PDF' : 'Facture PDF'}
 >
 {generatingPdf ? (
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <FileText className="w-3.5 h-3.5" />
 )}
 </button>
 {/* Bouton Convertir en commande - uniquement pour les devis non convertis */}
 {revenue.source === 'QUOTE' &&
 (meta as { quoteStatus?: string } | null)?.quoteStatus !== 'converted' && (
 <button
 onClick={handleConvertToOrder}
 disabled={convertingToOrder}
 className={cn(
 'p-1 text-orange-400 hover:bg-orange-900/20 rounded transition-colors',
 convertingToOrder && 'opacity-50 cursor-wait'
 )}
 title="Convertir en commande de production"
 >
 {convertingToOrder ? (
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <ArrowRightCircle className="w-3.5 h-3.5" />
 )}
 </button>
 )}
 {balance > 0 && (
 <>
 <button
 onClick={e => {
 e.stopPropagation()
 onPayment(revenue)
 }}
 className="p-1 text-emerald-400 hover:bg-emerald-900/20 rounded transition-colors"
 title="Enregistrer un paiement partiel"
 >
 <Banknote className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={handleMarkPaid}
 disabled={markingPaid}
 className={cn(
 'p-1 text-green-400 hover:bg-green-900/20 rounded transition-colors',
 markingPaid && 'opacity-50 cursor-wait'
 )}
 title={`Marquer solde (${currentPaymentMethod || 'WAVE'})`}
 >
 {markingPaid ? (
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <CheckCircle2 className="w-3.5 h-3.5" />
 )}
 </button>
 </>
 )}
 </div>
 </td>
 </motion.tr>

 {/* Ligne de details des paiements */}
 <AnimatePresence>
 {expanded && hasPayments && (
 <motion.tr
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 >
 <td colSpan={9} className="px-4 py-2 bg-tribal-black">
 <div className="pl-8">
 <p className="text-xs font-medium text-white/50 mb-2">
 Historique des paiements:
 </p>
 <div className="space-y-1">
 {revenue.payments?.map(payment => (
 <div
 key={payment.id}
 className="flex items-center gap-4 text-xs text-white/60"
 >
 <span className="w-20">{formatShortDate(payment.receivedAt)}</span>
 <span className="w-24 font-medium text-emerald-400">
 {formatXOF(payment.amount)}
 </span>
 <span className="w-24">{payment.method}</span>
 <span className="px-1.5 py-0.5 bg-white/[0.1] rounded text-[10px]">
 {payment.type}
 </span>
 {payment.reference && (
 <span className="text-white/50">
 {payment.reference}
 </span>
 )}
 </div>
 ))}
 </div>
 </div>
 </td>
 </motion.tr>
 )}
 </AnimatePresence>
 </>
 )
}

export const RevenusPage: React.FC = () => {
 // Filtres globaux persistants
 const { selectedYear, selectedPeriod, selectedMonth, selectedPlatform } = useAccountingFilters()

 // Calculer les dates de filtre
 const dateFilters = useMemo(() => {
 const now = new Date()
 const year = selectedYear ?? now.getFullYear()
 let startDate: string | undefined
 let endDate: string | undefined

 if (selectedPeriod === 'all' || selectedYear === null) {
 // Pas de filtre
 } else if (selectedPeriod === 'year') {
 startDate = `${year}-01-01`
 endDate = `${year}-12-31`
 } else if (selectedPeriod === 'month') {
 const month = selectedMonth ?? now.getMonth()
 const monthStr = String(month + 1).padStart(2, '0')
 startDate = `${year}-${monthStr}-01`
 const lastDay = new Date(year, month + 1, 0).getDate()
 endDate = `${year}-${monthStr}-${lastDay}`
 } else if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(now.getMonth() / 3)
 const startMonth = currentQuarter * 3
 startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`
 const endMonth = startMonth + 2
 const lastDay = new Date(year, endMonth + 1, 0).getDate()
 endDate = `${year}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`
 } else if (selectedPeriod === 'week') {
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 startDate = weekAgo.toISOString().slice(0, 10)
 endDate = now.toISOString().slice(0, 10)
 }

 return { startDate, endDate }
 }, [selectedYear, selectedPeriod, selectedMonth])

 // Hook unifie pour les revenus (limit eleve pour tout charger)
 const {
 data: revenues,
 loading,
 refresh,
 } = useUnifiedRevenues({
 filters: {
 startDate: dateFilters.startDate,
 endDate: dateFilters.endDate,
 limit: 10000,
 },
 includeSummary: false,
 })

 // Etats locaux
 const [activeTab, setActiveTab] = useState<TabType>('all')
 const [search, setSearch] = useState('')
 const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all')
 const [sourceFilter, setSourceFilter] = useState<RevenueSource | 'all'>('all')
 const [syncing, setSyncing] = useState(false)
 const [paymentModal, setPaymentModal] = useState<UnifiedRevenue | null>(null)
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
 const [bulkPaymentMethod, setBulkPaymentMethod] = useState('')
 const [applyingBulk, setApplyingBulk] = useState(false)
 const [editQuoteId, setEditQuoteId] = useState<string | null>(null)
 const [currentPage, setCurrentPage] = useState(1)
 const ITEMS_PER_PAGE = 50

 // Store pour acceder aux devis complets
 const invoices = useAccountingStore(s => s.invoices)
 const quoteToEdit = useMemo(() => {
 if (!editQuoteId) return null
 return invoices.find(inv => inv.id === editQuoteId && inv.type === 'quote') || null
 }, [editQuoteId, invoices])

 // Handler pour ouvrir l'edition d'un devis
 const handleEditQuote = useCallback((revenue: UnifiedRevenue) => {
 // Le sourceId du revenue correspond a l'id du devis dans le store
 setEditQuoteId(revenue.sourceId)
 }, [])

 // Filtrer les revenus par onglet
 const tabFilteredRevenues = useMemo(() => {
 let filtered = revenues

 // D'abord filtrer par plateforme (filtre global)
 filtered = filterRevenuesByPlatform(filtered, selectedPlatform)

 // Puis filtrer par onglet
 if (activeTab === 'orders') {
 return filtered.filter(r => r.source === 'PRINT' || r.source === 'AGENCY')
 }
 if (activeTab === 'quotes') {
 return filtered.filter(r => r.source === 'QUOTE')
 }
 return filtered
 }, [revenues, activeTab, selectedPlatform])

 // Filtrer les revenus
 const filteredRevenues = useMemo(() => {
 let filtered = [...tabFilteredRevenues]

 // Filtre par recherche
 if (search) {
 const s = search.toLowerCase()
 filtered = filtered.filter(
 rev =>
 rev.id.toLowerCase().includes(s) ||
 (rev.sourceRef || '').toLowerCase().includes(s) ||
 rev.clientName.toLowerCase().includes(s) ||
 (rev.description || '').toLowerCase().includes(s) ||
 (rev.clientPhone || '').includes(s)
 )
 }

 // Filtre par statut de paiement
 if (statusFilter !== 'all') {
 filtered = filtered.filter(rev => {
 const balance = getBalance(rev)
 if (statusFilter === 'paid') return rev.isPaid || balance <= 0
 if (statusFilter === 'partial') return rev.paidAmount > 0 && balance > 0
 if (statusFilter === 'pending') return rev.paidAmount === 0 && balance > 0
 return true
 })
 }

 // Filtre par source
 if (sourceFilter !== 'all') {
 filtered = filtered.filter(rev => rev.source === sourceFilter)
 }

 // Trier par date decroissante
 return filtered.sort(
 (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
 )
 }, [tabFilteredRevenues, search, statusFilter, sourceFilter])

 // Pagination
 const totalPages = Math.ceil(filteredRevenues.length / ITEMS_PER_PAGE)
 const paginatedRevenues = filteredRevenues.slice(
 (currentPage - 1) * ITEMS_PER_PAGE,
 currentPage * ITEMS_PER_PAGE
 )

 // Reset page quand filtres changent
 React.useEffect(() => {
 setCurrentPage(1)
 }, [activeTab, search, statusFilter, sourceFilter, dateFilters.startDate, dateFilters.endDate, selectedPlatform])

 // Stats - montants SANS livraison
 const stats = useMemo(() => {
 let total = 0
 let paid = 0
 let deposits = 0
 let pending = 0

 for (const r of filteredRevenues) {
 const amountWithoutDelivery = getAmountWithoutDelivery(r)
 const balance = getBalance(r)
 // Plafonner le montant paye au montant produit (le client a pu payer livraison incluse)
 const cappedPaid = Math.min(r.paidAmount, amountWithoutDelivery)

 total += amountWithoutDelivery

 if (r.isPaid || balance <= 0) {
 // Commande soldee
 paid += cappedPaid
 } else if (r.paidAmount > 0) {
 // Acompte verse
 deposits += cappedPaid
 pending += balance
 } else {
 // Pas encore paye
 pending += amountWithoutDelivery
 }
 }

 const count = filteredRevenues.length
 const paidCount = filteredRevenues.filter(r => r.isPaid || getBalance(r) <= 0).length
 const withDeposit = filteredRevenues.filter(r => r.paidAmount > 0 && getBalance(r) > 0).length
 const pendingCount = filteredRevenues.filter(
 r => r.paidAmount === 0 && getBalance(r) > 0
 ).length

 return { total, paid, deposits, pending, count, paidCount, withDeposit, pendingCount }
 }, [filteredRevenues])

 // Synchroniser les sources
 const handleSync = useCallback(async () => {
 setSyncing(true)
 try {
 const result = await syncRevenues(['PRINT', 'AGENCY', 'KAUI', 'QUOTE'])
 refresh()
 alert(
 `Synchronisation terminee!\n\nPrint: ${result.synced.PRINT || 0}\nAgency: ${result.synced.AGENCY || 0}\nKaui: ${result.synced.KAUI || 0}\nDevis: ${result.synced.QUOTE || 0}\n\nTotal: ${result.total}`
 )
 } catch (error) {
 console.error('Erreur sync:', error)
 alert('Erreur lors de la synchronisation')
 } finally {
 setSyncing(false)
 }
 }, [refresh])

 // Selection multiple
 const toggleSelect = useCallback((id: string) => {
 setSelectedIds(prev => {
 const next = new Set(prev)
 if (next.has(id)) {
 next.delete(id)
 } else {
 next.add(id)
 }
 return next
 })
 }, [])

 const toggleSelectAll = useCallback(() => {
 if (selectedIds.size === filteredRevenues.length) {
 setSelectedIds(new Set())
 } else {
 setSelectedIds(new Set(filteredRevenues.map(r => r.id)))
 }
 }, [filteredRevenues, selectedIds.size])

 const clearSelection = useCallback(() => {
 setSelectedIds(new Set())
 }, [])

 // Appliquer le mode de paiement en masse
 const applyBulkPaymentMethod = useCallback(async () => {
 if (!bulkPaymentMethod || selectedIds.size === 0) return

 setApplyingBulk(true)
 try {
 const promises = Array.from(selectedIds).map(id =>
 updateRevenuePaymentMethod(id, bulkPaymentMethod)
 )
 await Promise.all(promises)
 refresh()
 clearSelection()
 setBulkPaymentMethod('')
 } catch (error) {
 console.error('Erreur mise a jour en masse:', error)
 alert('Erreur lors de la mise a jour')
 } finally {
 setApplyingBulk(false)
 }
 }, [bulkPaymentMethod, selectedIds, refresh, clearSelection])

 // Tabs
 const tabs = [
 { id: 'all' as TabType, label: 'Tous', icon: Wallet, count: revenues.length },
 {
 id: 'orders' as TabType,
 label: 'Commandes',
 icon: ShoppingCart,
 count: revenues.filter(r => r.source === 'PRINT' || r.source === 'AGENCY').length,
 },
 {
 id: 'quotes' as TabType,
 label: 'Devis',
 icon: FileText,
 count: revenues.filter(r => r.source === 'QUOTE').length,
 },
 ]

 return (
 <div className="space-y-6">
 {/* Header avec filtres globaux */}
 <AccountingFiltersBar title="Revenus" />

 {/* Header descriptif */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl glass p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Wallet className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Revenus</h1>
 <p className="text-white/70 text-sm">Commandes et devis - montants hors livraison</p>
 </div>
 </div>
 <button
 onClick={handleSync}
 disabled={syncing || loading}
 className="flex items-center gap-2 px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-lg transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
 Synchroniser
 </button>
 </div>
 </motion.div>

 {/* Onglets */}
 <div className="flex gap-2 border-b border-white/[0.06]">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
 activeTab === tab.id
 ? 'border-emerald-600 text-emerald-400'
 : 'border-transparent text-white/50 hover:text-white/80'
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 <span className="text-xs bg-tribal-black px-1.5 py-0.5 rounded">
 {tab.count}
 </span>
 </button>
 ))}
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
 >
 <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
 <Receipt className="w-4 h-4" />
 Documents
 </div>
 <p className="text-2xl font-bold text-white">{stats.count}</p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
 >
 <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
 <DollarSign className="w-4 h-4" />
 CA (hors livraison)
 </div>
 <p className="text-2xl font-bold text-emerald-400">
 {formatXOF(stats.total)}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
 >
 <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
 <TrendingUp className="w-4 h-4" />
 Encaisse
 </div>
 <p className="text-2xl font-bold text-blue-400">
 {formatXOF(stats.paid)}
 </p>
 <p className="text-xs text-white/50">{stats.paidCount} soldes</p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
 >
 <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
 <Banknote className="w-4 h-4" />
 Acomptes
 </div>
 <p className="text-2xl font-bold text-amber-400">
 {formatXOF(stats.deposits)}
 </p>
 <p className="text-xs text-white/50">{stats.withDeposit} en cours</p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"
 >
 <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
 <CreditCard className="w-4 h-4" />
 Soldes impayes
 </div>
 <p className="text-2xl font-bold text-orange-400">
 {formatXOF(stats.pending)}
 </p>
 <p className="text-xs text-white/50">
 {stats.pendingCount + stats.withDeposit} a encaisser
 </p>
 </motion.div>
 </div>

 {/* Barre de filtres */}
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher par reference, client, telephone..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-emerald-500"
 />
 </div>

 <div className="flex gap-2 flex-wrap">
 {/* Filtre par source (visible seulement sur onglet"Tous") */}
 {activeTab === 'all' && (
 <select
 value={sourceFilter}
 onChange={e => setSourceFilter(e.target.value as RevenueSource | 'all')}
 className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white font-medium"
 >
 <option value="all">Toutes sources</option>
 <option value="PRINT">Print</option>
 <option value="AGENCY">Agency</option>
 <option value="QUOTE">Devis</option>
 </select>
 )}

 <select
 value={statusFilter}
 onChange={e =>
 setStatusFilter(e.target.value as 'all' | 'paid' | 'partial' | 'pending')
 }
 className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white"
 >
 <option value="all">Tous statuts</option>
 <option value="paid">Soldes</option>
 <option value="partial">Avec acompte</option>
 <option value="pending">Impayes</option>
 </select>
 </div>
 </div>

 {/* Barre d'actions groupees */}
 {selectedIds.size > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-blue-900/20 border border-white/[0.06] rounded-xl p-3 flex flex-wrap items-center gap-3"
 >
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-blue-400">
 {selectedIds.size} selectionne{selectedIds.size > 1 ? 's' : ''}
 </span>
 <button
 onClick={clearSelection}
 className="text-xs text-blue-400 hover:text-blue-400"
 >
 Annuler
 </button>
 </div>
 <div className="h-4 w-px bg-blue-200" />
 <div className="flex items-center gap-2">
 <span className="text-xs text-white/60">Mode paiement:</span>
 <select
 value={bulkPaymentMethod}
 onChange={e => setBulkPaymentMethod(e.target.value)}
 className="text-xs px-2 py-1 rounded border border-white/[0.06] bg-white/[0.03]"
 >
 <option value="">Choisir...</option>
 {PAYMENT_METHODS.map(m => (
 <option key={m.value} value={m.value}>
 {m.label}
 </option>
 ))}
 </select>
 <button
 onClick={applyBulkPaymentMethod}
 disabled={!bulkPaymentMethod || applyingBulk}
 className={cn(
 'text-xs px-3 py-1 rounded bg-tribal-accent text-white hover:bg-tribal-accent-light disabled:opacity-50',
 applyingBulk && 'cursor-wait'
 )}
 >
 {applyingBulk ? 'Application...' : 'Appliquer'}
 </button>
 </div>
 </motion.div>
 )}

 {/* Tableau des revenus */}
 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-tribal-black">
 <tr>
 <th className="px-2 py-2 text-left">
 <input
 type="checkbox"
 checked={
 selectedIds.size === filteredRevenues.length && filteredRevenues.length > 0
 }
 onChange={toggleSelectAll}
 className="w-3.5 h-3.5 rounded border-white/[0.08] text-blue-400 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 <th className="px-2 py-2 text-left text-[10px] font-medium text-white/50 uppercase">
 Date
 </th>
 <th className="px-2 py-2 text-left text-[10px] font-medium text-white/50 uppercase">
 Ref
 </th>
 <th className="px-2 py-2 text-left text-[10px] font-medium text-white/50 uppercase">
 Source
 </th>
 <th className="px-2 py-2 text-left text-[10px] font-medium text-white/50 uppercase">
 Client
 </th>
 <th className="px-2 py-2 text-right text-[10px] font-medium text-white/50 uppercase">
 Total
 </th>
 <th className="px-2 py-2 text-right text-[10px] font-medium text-amber-400 uppercase">
 Paye
 </th>
 <th className="px-2 py-2 text-right text-[10px] font-medium text-white/50 uppercase">
 Reste
 </th>
 <th className="px-2 py-2 text-center text-[10px] font-medium text-white/50 uppercase">
 Act.
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/[0.06]">
 {paginatedRevenues.map((rev, idx) => (
 <RevenueRow
 key={rev.id}
 revenue={rev}
 index={idx}
 onPayment={setPaymentModal}
 onRefresh={refresh}
 isSelected={selectedIds.has(rev.id)}
 onToggleSelect={toggleSelect}
 onEdit={rev.source === 'QUOTE' ? handleEditQuote : undefined}
 />
 ))}

 {filteredRevenues.length === 0 && (
 <tr>
 <td
 colSpan={9}
 className="px-4 py-12 text-center text-white/50"
 >
 <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p>{loading ? 'Chargement...' : 'Aucun revenu trouve'}</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
 <div className="text-sm text-white/60">
 Affichage{' '}
 <span className="font-medium text-white">
 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredRevenues.length)}
 </span>{' '}
 sur{' '}
 <span className="font-medium text-white">{filteredRevenues.length}</span>{' '}
 revenus
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setCurrentPage(1)}
 disabled={currentPage === 1}
 className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
 >
 {'<<'}
 </button>
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="flex items-center justify-center px-3 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors text-sm"
 >
 Precedent
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
 Suivant
 </button>
 <button
 onClick={() => setCurrentPage(totalPages)}
 disabled={currentPage === totalPages}
 className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
 >
 {'>>'}
 </button>
 </div>
 </div>
 )}

 {/* Info */}
 <div className="text-xs text-white/50 text-center">
 Les montants affiches excluent les frais de livraison (factures par agence externe). Cliquez
 sur une ligne avec acompte pour voir l'historique des paiements.
 </div>

 {/* Modal de paiement */}
 {paymentModal && (
 <PaymentModal
 revenue={paymentModal}
 onClose={() => setPaymentModal(null)}
 onSuccess={refresh}
 />
 )}

 {/* Modal d'edition de devis */}
 <EditQuoteModal
 isOpen={!!editQuoteId}
 onClose={() => setEditQuoteId(null)}
 onSuccess={refresh}
 quote={quoteToEdit}
 />
 </div>
 )
}
