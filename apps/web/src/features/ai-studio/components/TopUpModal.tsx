/**
 * TOP UP MODAL - Enregistrer une recharge fal.ai dans Tribal Ops
 * L'admin achete des credits sur fal.ai puis vient saisir le montant ici
 * Le systeme deduit automatiquement les couts de chaque generation
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 X,
 ExternalLink,
 Wallet,
 CheckCircle2,
 AlertTriangle,
 ArrowUpRight,
 Zap,
 TrendingUp,
 TrendingDown,
 DollarSign,
 History,
 Loader2,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useBalance, useAddTopUp, useTopUpHistory, useStats } from '../hooks/useAiStudio'

interface TopUpModalProps {
 isOpen: boolean
 onClose: () => void
}

const FAL_BILLING_URL = 'https://fal.ai/dashboard/billing'

// Montants rapides de recharge
const QUICK_AMOUNTS = [5, 10, 25, 50]

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
 const { data: balanceData } = useBalance()
 const { data: stats } = useStats()
 const { data: topUpData } = useTopUpHistory({ page: 1, limit: 5 })
 const addTopUpMutation = useAddTopUp()

 const [amount, setAmount] = useState('')
 const [note, setNote] = useState('')
 const [showSuccess, setShowSuccess] = useState(false)
 const [lastAdded, setLastAdded] = useState(0)

 const currentBalance = balanceData?.balance ?? 0
 const totalTopUps = balanceData?.totalTopUps ?? 0
 const totalSpent = balanceData?.totalSpent ?? 0

 // Estimer le nombre de generations restantes
 const avgCostPerGen =
 stats && stats.totalGenerations > 0 ? stats.totalCost / stats.totalGenerations : 0.03
 const estimatedGens = avgCostPerGen > 0 ? Math.floor(currentBalance / avgCostPerGen) : 0

 // Couleur selon le solde
 const getBalanceStatus = () => {
 if (currentBalance > 10)
 return { color: 'text-tribal-accent', bg: 'bg-tribal-accent/10', label: 'Solde confortable' }
 if (currentBalance > 3)
 return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Solde moyen' }
 if (currentBalance > 0)
 return { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Solde faible' }
 return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Solde epuise' }
 }

 const status = getBalanceStatus()

 // Enregistrer la recharge
 const handleAddTopUp = useCallback(async () => {
 const numAmount = parseFloat(amount)
 if (!numAmount || numAmount <= 0) return

 try {
 await addTopUpMutation.mutateAsync({ amount: numAmount, note: note || undefined })
 setLastAdded(numAmount)
 setShowSuccess(true)
 setAmount('')
 setNote('')
 setTimeout(() => setShowSuccess(false), 4000)
 } catch {
 // erreur geree par React Query
 }
 }, [amount, note, addTopUpMutation])

 // Ouvrir fal.ai billing
 const handleOpenBilling = () => {
 window.open(FAL_BILLING_URL, '_blank', 'noopener,noreferrer')
 }

 const handleClose = () => {
 setAmount('')
 setNote('')
 setShowSuccess(false)
 onClose()
 }

 return (
 <AnimatePresence>
 {isOpen && (
 <motion.div
 className="fixed inset-0 z-50 flex items-center justify-center p-4"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 >
 {/* Backdrop */}
 <motion.div
 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
 onClick={handleClose}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 />

 {/* Modal */}
 <motion.div
 className="relative w-full max-w-md bg-white/[0.04] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 >
 {/* Header gradient */}
 <div className="relative overflow-hidden">
 <div className="absolute inset-0 bg-tribal-accent" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

 <div className="relative px-6 pt-5 pb-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
 <Wallet className="w-5 h-5 text-white" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-white">Solde fal.ai</h2>
 <p className="text-xs text-white/70">Gestion du solde interne</p>
 </div>
 </div>
 <button
 onClick={handleClose}
 className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
 >
 <X className="w-4 h-4 text-white" />
 </button>
 </div>

 {/* Solde actuel - grand */}
 <div className="text-center">
 <div className="text-4xl font-bold text-white font-mono tracking-tight">
 ${currentBalance.toFixed(2)}
 </div>
 <div className="text-xs text-white/60 mt-1">
 {estimatedGens > 0
 ? `~${estimatedGens} generations estimees`
 : 'Rechargez pour generer'}
 </div>
 </div>

 {/* Mini stats */}
 <div className="flex items-center justify-center gap-4 mt-3">
 <div className="flex items-center gap-1 text-[10px] text-white/50">
 <TrendingUp className="w-3 h-3" />
 Recharge: ${totalTopUps.toFixed(2)}
 </div>
 <div className="flex items-center gap-1 text-[10px] text-white/50">
 <TrendingDown className="w-3 h-3" />
 Depense: ${totalSpent.toFixed(2)}
 </div>
 </div>
 </div>
 </div>

 {/* Body */}
 <div className="px-6 py-5 space-y-5">
 {/* Status badge */}
 <div
 className={cn(
 'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium',
 status.bg,
 status.color
 )}
 >
 {currentBalance > 3 ? (
 <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
 ) : (
 <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
 )}
 <span>{status.label}</span>
 </div>

 {/* Success feedback */}
 <AnimatePresence>
 {showSuccess && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tribal-accent/10 text-tribal-accent text-xs font-medium">
 <CheckCircle2 className="w-3.5 h-3.5" />
 +${lastAdded.toFixed(2)} enregistre (+{Math.floor(lastAdded * 40)} tokens)
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Instructions */}
 <div className="space-y-2">
 <p className="text-xs font-medium text-white/40">
 Comment ca marche
 </p>
 <div className="space-y-1.5">
 {[
 'Achetez des credits sur fal.ai (bouton ci-dessous)',
 'Saisissez le montant achete ici',
 'Le solde sera deduit automatiquement a chaque generation',
 ].map((step, i) => (
 <div key={i} className="flex items-start gap-2.5 text-xs">
 <span className="w-5 h-5 rounded-full bg-tribal-accent/10 text-tribal-accent flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-px">
 {i + 1}
 </span>
 <span className="text-white/60">{step}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Lien fal.ai billing */}
 <button
 onClick={handleOpenBilling}
 className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors"
 >
 <ExternalLink className="w-4 h-4" />
 Acheter des credits sur fal.ai
 <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
 </button>

 {/* Formulaire de saisie */}
 <div className="space-y-3">
 <p className="text-xs font-semibold text-white/60">
 Enregistrer une recharge
 </p>

 {/* Montants rapides */}
 <div className="flex gap-2">
 {QUICK_AMOUNTS.map(q => (
 <button
 key={q}
 onClick={() => setAmount(String(q))}
 className={cn(
 'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
 amount === String(q)
 ? 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20'
 : 'bg-white/[0.06] text-white/40 hover:bg-tribal-accent/10 hover:text-tribal-accent '
 )}
 >
 ${q}
 </button>
 ))}
 </div>

 {/* Champ montant custom */}
 <div className="relative">
 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="number"
 min="0.01"
 step="0.01"
 placeholder="Montant en USD"
 value={amount}
 onChange={e => setAmount(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter') handleAddTopUp()
 }}
 className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-mono text-white placeholder:text-gray-400 focus:outline-none focus:border-tribal-accent focus:ring-2 focus:ring-tribal-accent/20 transition-all"
 />
 </div>

 {/* Note optionnelle */}
 <input
 type="text"
 placeholder="Note (optionnel) — ex: Recharge Stripe du 07/02"
 value={note}
 onChange={e => setNote(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter') handleAddTopUp()
 }}
 className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 placeholder:text-gray-400 focus:outline-none focus:border-tribal-accent focus:ring-2 focus:ring-tribal-accent/20 transition-all"
 />

 {/* Estimation */}
 {parseFloat(amount) > 0 && (
 <div className="text-[10px] text-white/40 flex items-center gap-1">
 <Zap className="w-3 h-3 text-tribal-accent" />${amount} ={' '}
 {Math.floor(parseFloat(amount) * 40)} tokens (~
 {Math.floor(parseFloat(amount) * 40)} generations)
 </div>
 )}

 {/* Bouton enregistrer */}
 <button
 onClick={handleAddTopUp}
 disabled={
 !parseFloat(amount) || parseFloat(amount) <= 0 || addTopUpMutation.isPending
 }
 className={cn(
 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
 parseFloat(amount) > 0
 ? 'bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black shadow-lg shadow-tribal-accent/20 hover:shadow-tribal-accent/30'
 : 'bg-white/[0.06] text-gray-400 cursor-not-allowed'
 )}
 >
 {addTopUpMutation.isPending ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Enregistrement...
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 Enregistrer la recharge
 {parseFloat(amount) > 0 && (
 <span className="font-mono">(${parseFloat(amount).toFixed(2)})</span>
 )}
 </>
 )}
 </button>

 {/* Erreur */}
 {addTopUpMutation.isError && (
 <div className="text-xs text-red-400 flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" />
 {addTopUpMutation.error?.message || 'Erreur lors de la recharge'}
 </div>
 )}
 </div>

 {/* Historique des dernieres recharges */}
 {topUpData && topUpData.topUps.length > 0 && (
 <div className="space-y-2">
 <div className="flex items-center gap-1.5 text-xs font-medium text-white/40">
 <History className="w-3.5 h-3.5" />
 Dernieres recharges
 </div>
 <div className="space-y-1">
 {topUpData.topUps.map(t => (
 <div
 key={t.id}
 className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] text-xs"
 >
 <div className="flex items-center gap-2">
 <span className="font-bold font-mono text-tribal-accent">
 +${t.amount.toFixed(2)}
 </span>
 {t.note && (
 <span className="text-white/40 truncate max-w-[140px]">
 {t.note}
 </span>
 )}
 </div>
 <span className="text-white/40 text-[10px]">
 {new Date(t.createdAt).toLocaleDateString('fr-FR', {
 day: '2-digit',
 month: 'short',
 })}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 )
}
