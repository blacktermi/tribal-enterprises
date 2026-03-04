/**
 * Modal pour enregistrer un paiement sur un revenu unifié
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { UnifiedRevenue, PaymentType } from '../../lib/hooks/useUnifiedRevenues'
import { recordPayment } from '../../lib/hooks/useUnifiedRevenues'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  revenue: UnifiedRevenue | null
  onSuccess?: () => void
}

// Méthodes de paiement (compactes)
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces', icon: Wallet },
  { value: 'BANK_TRANSFER', label: 'Virement', icon: Building2 },
  { value: 'WAVE', label: 'Wave', icon: Smartphone },
  { value: 'ORANGE_MONEY', label: 'Orange', icon: Smartphone },
  { value: 'MTN_MONEY', label: 'MTN', icon: Smartphone },
  { value: 'CREDIT_CARD', label: 'Carte', icon: CreditCard },
]

// Types de paiement
const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'PAYMENT', label: 'Paiement' },
  { value: 'DEPOSIT', label: 'Acompte' },
  { value: 'BALANCE', label: 'Solde' },
]

// Formater le montant
function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' XOF'
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  revenue,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [type, setType] = useState<PaymentType>('PAYMENT')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && revenue) {
      // Pour les devis avec acompte demande, pre-remplir avec le montant de l'acompte
      const meta = revenue.metadata as {
        depositAmount?: number
        depositMethod?: string
        quoteStatus?: string
      } | null
      const isQuote = revenue.source === 'QUOTE'
      const requestedDeposit = meta?.depositAmount || 0
      const preferredMethod = meta?.depositMethod || 'WAVE'

      // Calculer le solde sans frais de livraison (livraison gérée par service externe)
      const dlvFee = (revenue.metadata as { deliveryFee?: number })?.deliveryFee ?? 0
      const amtWithoutDlv = Math.max(0, revenue.amount - dlvFee)
      const balWithoutDlv = Math.max(0, amtWithoutDlv - revenue.paidAmount)

      if (isQuote && requestedDeposit > 0 && revenue.paidAmount === 0) {
        // Devis avec acompte demande mais pas encore recu
        setAmount(requestedDeposit.toString())
        setType('DEPOSIT')
        setMethod(preferredMethod)
      } else {
        setAmount(balWithoutDlv.toString())
        setMethod('WAVE')
        // Si on paie le solde complet, utiliser BALANCE par défaut pour la persistance
        setType(revenue.paidAmount > 0 ? 'BALANCE' : 'PAYMENT')
      }
      setReference('')
      setNotes('')
      setReceivedAt(new Date().toISOString().split('T')[0])
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, revenue])

  // Gérer la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revenue) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Veuillez entrer un montant valide')
      return
    }

    if (amountNum > balanceWithoutDelivery) {
      setError(
        `Le montant ne peut pas dépasser le solde restant (${formatAmount(balanceWithoutDelivery)})`
      )
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await recordPayment(revenue.id, {
        amount: amountNum,
        method,
        type,
        reference: reference || undefined,
        receivedAt,
        notes: notes || undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setError((err as Error).message || "Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Raccourci pour remplir le solde
  const handleFillBalance = () => {
    if (revenue) {
      setAmount(balanceWithoutDelivery.toString())
      setType('BALANCE')
    }
  }

  // Récupérer les frais de livraison depuis les metadata
  const deliveryFee = (revenue?.metadata as { deliveryFee?: number })?.deliveryFee ?? 0

  // Montants SANS frais de livraison (la livraison est gérée par un service externe)
  const amountWithoutDelivery = Math.max(0, (revenue?.amount ?? 0) - deliveryFee)
  const balanceWithoutDelivery = Math.max(0, amountWithoutDelivery - (revenue?.paidAmount ?? 0))

  if (!revenue) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay + Container centré avec flexbox */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal - Centré et compact */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-tribal-black rounded-2xl shadow-xl border border-white/[0.06]"
            >
              {/* Header - Plus compact */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Enregistrer un paiement</h2>
                      <p className="text-xs text-white/70 truncate max-w-[200px]">
                        {revenue.clientName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Info du revenu */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-white">
                  <div>
                    <div className="text-xs text-white/70">Montant produits</div>
                    <div className="font-bold text-sm">{formatAmount(amountWithoutDelivery)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Solde restant</div>
                    <div className="font-bold text-sm">{formatAmount(balanceWithoutDelivery)}</div>
                  </div>
                </div>
              </div>

              {/* Success state */}
              {success ? (
                <div className="p-6 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-14 h-14 rounded-full bg-emerald-900/30 flex items-center justify-center mb-3"
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-base font-bold text-white">
                    Paiement enregistré !
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    {formatAmount(parseFloat(amount))} enregistré avec succès.
                  </p>
                </div>
              ) : (
                /* Formulaire compact */
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                  {/* Montant */}
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Montant du paiement
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-20 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-tribal-accent/40 placeholder-white/25 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleFillBalance}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-medium text-tribal-accent hover:bg-white/[0.06] rounded"
                      >
                        Solde complet
                      </button>
                    </div>
                  </div>

                  {/* Type de paiement */}
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Type
                    </label>
                    <div className="flex gap-2">
                      {PAYMENT_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            type === t.value
                              ? 'bg-tribal-accent text-tribal-black'
                              : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.06]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Méthode de paiement - Grille compacte */}
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Méthode de paiement
                    </label>
                    <div className="grid grid-cols-6 gap-1">
                      {PAYMENT_METHODS.map(m => {
                        const Icon = m.icon
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setMethod(m.value)}
                            title={m.label}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-xs transition-colors ${
                              method === m.value
                                ? 'bg-tribal-accent/10 border-2 border-tribal-accent text-tribal-accent'
                                : 'bg-white/[0.04] border-2 border-transparent text-white/60 hover:bg-white/[0.06]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-medium truncate w-full text-center">
                              {m.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Erreur */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-lg bg-red-900/20 border border-red-800 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-xs text-red-400">{error}</span>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-white/60 font-medium text-sm transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2 rounded-xl bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PaymentModal
