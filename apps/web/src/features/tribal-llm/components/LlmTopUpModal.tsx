/**
 * TRIBAL LLM - Modal de recharge de credits
 * Permet d'ajouter manuellement une recharge (montant USD + note optionnelle)
 * Dark-only premium theme (tribal accent)
 */

import { useState } from 'react'
import { X, DollarSign, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useAddTopUp } from '../hooks/useTribalLlm'

interface LlmTopUpModalProps {
  onClose: () => void
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100]

export function LlmTopUpModal({ onClose }: LlmTopUpModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)

  const addTopUp = useAddTopUp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return

    try {
      await addTopUp.mutateAsync({ amount: numAmount, note: note.trim() || undefined })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch {
      // handled by React Query
    }
  }

  const handleQuickAmount = (val: number) => {
    setAmount(String(val))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-tribal-dark rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden">
        {/* Header gradient */}
        <div className="px-6 py-4 bg-tribal-accent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Nouvelle recharge</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-white/70 mt-1">
            Ajoutez des credits pour suivre la consommation de l'equipe
          </p>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-tribal-accent mx-auto mb-4" />
            <p className="text-lg font-semibold text-white">Recharge ajoutee !</p>
            <p className="text-sm text-white/40 mt-1">
              +${parseFloat(amount).toFixed(2)} ajoute aux credits
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Montant (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg font-medium">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 text-lg font-semibold bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-tribal-accent/30 focus:border-tribal-accent/40 transition-all"
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_AMOUNTS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      amount === String(val)
                        ? 'bg-tribal-accent text-tribal-black shadow-sm'
                        : 'bg-white/[0.04] text-white/50 hover:bg-tribal-accent/10 hover:text-tribal-accent'
                    )}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: Recharge mensuelle, achat credits supplementaires..."
                rows={2}
                className="w-full px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-tribal-accent/30 focus:border-tribal-accent/40 transition-all resize-none"
              />
            </div>

            {/* Error */}
            {addTopUp.isError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {(addTopUp.error as Error)?.message || 'Erreur lors de la recharge'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-white/50 hover:bg-white/[0.04] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!amount || parseFloat(amount) <= 0 || addTopUp.isPending}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  amount && parseFloat(amount) > 0
                    ? 'bg-tribal-accent text-white shadow-md shadow-tribal-accent/20 hover:shadow-lg'
                    : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                )}
              >
                {addTopUp.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>Ajouter +${amount || '0.00'}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
