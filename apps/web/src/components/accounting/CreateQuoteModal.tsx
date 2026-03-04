/**
 * Modal pour creer un nouveau devis
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Smartphone,
  Wallet,
  Building2,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import { generateAndDownloadQuote } from '../../services/invoiceGenerator'
import type { Brand, PaymentMethod } from '../../accounting/types'

interface CreateQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface QuoteLine {
  id: string
  description: string
  qty: number
  unitPriceHT: number
}

// Methodes de paiement pour acompte (Wave principal)
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { value: 'WAVE', label: 'Wave', icon: Smartphone },
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone },
  { value: 'MTN_MONEY', label: 'MTN Money', icon: Smartphone },
  { value: 'MOOV_MONEY', label: 'Moov Money', icon: Smartphone },
  { value: 'CAISSE', label: 'Especes', icon: Wallet },
  { value: 'BANQUE', label: 'Virement', icon: Building2 },
]

// Marques disponibles (using Brand type values)
const BRANDS: { value: Brand; label: string }[] = [
  { value: 'tribalprint', label: 'Tribal Print' },
  { value: 'jerichoprint', label: 'Jericho Print' },
  { value: 'muslimprint', label: 'Muslim Print' },
  { value: 'tribalverra', label: 'Tribal Verra' },
  { value: 'tribalagency', label: 'Tribal Agency' },
]

// Formater le montant
function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA'
}

// Generer un ID unique pour les lignes
function generateLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Client info
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Quote details
  const [brand, setBrand] = useState<Brand>('tribalprint')
  const [validityDays, setValidityDays] = useState(30)
  const [notes, setNotes] = useState('')

  // Lines
  const [lines, setLines] = useState<QuoteLine[]>([
    { id: generateLineId(), description: '', qty: 1, unitPriceHT: 0 },
  ])

  // Deposit (acompte)
  const [hasDeposit, setHasDeposit] = useState(false)
  const [depositPercent, setDepositPercent] = useState(50)
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('WAVE')
  const [depositReceived, setDepositReceived] = useState(false)
  const [depositReceivedDate, setDepositReceivedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null)

  const addInvoice = useAccountingStore(s => s.addInvoice)
  const recordDeposit = useAccountingStore(s => s.recordDeposit)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setBrand('tribalprint')
      setValidityDays(30)
      setNotes('')
      setLines([{ id: generateLineId(), description: '', qty: 1, unitPriceHT: 0 }])
      setHasDeposit(false)
      setDepositPercent(50)
      setDepositMethod('WAVE')
      setDepositReceived(false)
      setDepositReceivedDate(new Date().toISOString().slice(0, 10))
      setError(null)
      setSuccess(false)
      setCreatedQuoteId(null)
    }
  }, [isOpen])

  // Calculate totals
  const totals = React.useMemo(() => {
    const ht = lines.reduce((sum, line) => sum + line.qty * line.unitPriceHT, 0)
    const tva = 0 // TVA non applicable
    const ttc = ht + tva
    return { ht, tva, ttc }
  }, [lines])

  const depositAmount = hasDeposit ? Math.round((totals.ttc * depositPercent) / 100) : 0

  // Add a new line
  const addLine = () => {
    setLines([...lines, { id: generateLineId(), description: '', qty: 1, unitPriceHT: 0 }])
  }

  // Remove a line
  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  // Update a line
  const updateLine = (id: string, field: keyof QuoteLine, value: string | number) => {
    setLines(
      lines.map(l => {
        if (l.id === id) {
          if (field === 'qty' || field === 'unitPriceHT') {
            return { ...l, [field]: Number(value) || 0 }
          }
          return { ...l, [field]: value }
        }
        return l
      })
    )
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!clientName.trim()) {
      setError('Veuillez entrer le nom du client')
      return
    }

    const validLines = lines.filter(l => l.description.trim() && l.unitPriceHT > 0)
    if (validLines.length === 0) {
      setError('Veuillez ajouter au moins une ligne avec description et prix')
      return
    }

    setIsSubmitting(true)

    try {
      const today = new Date()
      const validUntil = new Date(today)
      validUntil.setDate(validUntil.getDate() + validityDays)

      // Create quote via accounting store
      const quote = addInvoice({
        type: 'quote',
        brand,
        date: today.toISOString().slice(0, 10),
        validUntil: validUntil.toISOString().slice(0, 10),
        partnerName: clientName.trim(),
        partnerPhone: clientPhone.trim() || undefined,
        partnerEmail: clientEmail.trim() || undefined,
        lines: validLines.map(l => ({
          description: l.description,
          qty: l.qty,
          unitPriceHT: l.unitPriceHT,
          tvaRate: 0,
        })),
        quoteStatus: 'pending',
        depositAmount: hasDeposit ? depositAmount : undefined,
        depositMethod: hasDeposit ? depositMethod : undefined,
        // Si acompte deja recu, on enregistre la date
        depositDate: hasDeposit && depositReceived ? depositReceivedDate : undefined,
        memo: notes.trim() || undefined,
      })

      // Si l'acompte a ete recu, enregistrer l'ecriture comptable
      if (hasDeposit && depositReceived && depositAmount > 0) {
        recordDeposit(quote.id, depositAmount, depositMethod, depositReceivedDate)
      }

      setCreatedQuoteId(quote.id)
      setSuccess(true)

      // Auto-download PDF
      try {
        await generateAndDownloadQuote({
          id: quote.id,
          date: today.toISOString(),
          validUntil: validUntil.toISOString(),
          partnerName: clientName.trim(),
          brand,
          lines: validLines.map(l => ({
            description: l.description,
            qty: l.qty,
            unitPriceHT: l.unitPriceHT,
          })),
          totals,
        })
      } catch (pdfError) {
        console.error('Erreur generation PDF:', pdfError)
        // Don't fail the whole operation if PDF fails
      }

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la creation du devis')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Download PDF for created quote
  const handleDownloadPDF = async () => {
    if (!createdQuoteId) return

    try {
      const today = new Date()
      const validUntil = new Date(today)
      validUntil.setDate(validUntil.getDate() + validityDays)

      const validLines = lines.filter(l => l.description.trim() && l.unitPriceHT > 0)

      await generateAndDownloadQuote({
        id: createdQuoteId,
        date: today.toISOString(),
        validUntil: validUntil.toISOString(),
        partnerName: clientName.trim(),
        brand,
        lines: validLines.map(l => ({
          description: l.description,
          qty: l.qty,
          unitPriceHT: l.unitPriceHT,
        })),
        totals,
      })
    } catch (err) {
      console.error('Erreur telechargement PDF:', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-tribal-black rounded-2xl shadow-xl border border-white/[0.06] max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Nouveau devis</h2>
                    <p className="text-xs text-white/70">Creer un devis pour un client</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Success state */}
            {success ? (
              <div className="p-8 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">
                  Devis cree avec succes !
                </h3>
                <p className="text-sm text-white/40 mt-1">
                  Reference: {createdQuoteId}
                </p>
                <p className="text-sm text-white/40">
                  Montant: {formatAmount(totals.ttc)}
                </p>
                {hasDeposit && (
                  <p className="text-sm text-violet-400 mt-1">
                    Acompte demande: {formatAmount(depositAmount)} ({depositPercent}%)
                  </p>
                )}
                <button
                  onClick={handleDownloadPDF}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-900/30 text-violet-300 hover:bg-violet-900/50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Telecharger le PDF
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Client Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informations client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Nom du client *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          placeholder="Nom complet"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Telephone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                          placeholder="+225 07 XX XX XX XX"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={e => setClientEmail(e.target.value)}
                          placeholder="email@exemple.com"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Marque
                      </label>
                      <select
                        value={brand}
                        onChange={e => setBrand(e.target.value as Brand)}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40"
                      >
                        {BRANDS.map(b => (
                          <option key={b.value} value={b.value} className="text-gray-900">
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quote Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Lignes du devis
                    </h3>
                    <button
                      type="button"
                      onClick={addLine}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-900/30 text-violet-300 text-xs font-medium hover:bg-violet-900/50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-white/40 px-1">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Qte</div>
                      <div className="col-span-3 text-right">Prix unit.</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Lines */}
                    {lines.map((line, index) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-12 gap-2 items-center bg-white/[0.04] rounded-lg p-2"
                      >
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={line.description}
                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                            placeholder={`Article ${index + 1}`}
                            className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={line.qty}
                            onChange={e => updateLine(line.id, 'qty', e.target.value)}
                            min="1"
                            className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm text-center focus:outline-none focus:border-tribal-accent/40"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={line.unitPriceHT || ''}
                            onChange={e => updateLine(line.id, 'unitPriceHT', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm text-right focus:outline-none focus:border-tribal-accent/40 placeholder-white/25"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                            className="p-1 rounded text-white/40 hover:text-red-500 hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-violet-900/20 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Total HT</span>
                      <span className="font-medium text-white">
                        {formatAmount(totals.ht)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">TVA (0%)</span>
                      <span className="text-white/50">Exonere</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-violet-800 pt-2">
                      <span className="text-white">Total TTC</span>
                      <span className="text-violet-400">
                        {formatAmount(totals.ttc)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deposit Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasDeposit"
                      checked={hasDeposit}
                      onChange={e => setHasDeposit(e.target.checked)}
                      className="w-4 h-4 rounded border-white/[0.08] text-tribal-accent focus:ring-tribal-accent"
                    />
                    <label
                      htmlFor="hasDeposit"
                      className="text-sm font-medium text-white/60"
                    >
                      Demander un acompte
                    </label>
                  </div>

                  {hasDeposit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-900/20 rounded-lg p-3 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">
                            Pourcentage
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              value={depositPercent}
                              onChange={e => setDepositPercent(Number(e.target.value))}
                              min="10"
                              max="100"
                              step="10"
                              className="flex-1"
                            />
                            <span className="text-sm font-medium text-white w-12 text-right">
                              {depositPercent}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">
                            Montant acompte
                          </label>
                          <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-amber-800 text-amber-300 font-bold text-sm">
                            {formatAmount(depositAmount)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">
                          Mode de paiement prefere
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PAYMENT_METHODS.map(m => {
                            const Icon = m.icon
                            return (
                              <button
                                key={m.value}
                                type="button"
                                onClick={() => setDepositMethod(m.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  depositMethod === m.value
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06]'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                {m.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Acompte deja recu */}
                      <div className="border-t border-amber-800 pt-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="depositReceived"
                            checked={depositReceived}
                            onChange={e => setDepositReceived(e.target.checked)}
                            className="w-4 h-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                          />
                          <label
                            htmlFor="depositReceived"
                            className="text-sm font-medium text-white/60"
                          >
                            Acompte deja recu
                          </label>
                        </div>

                        {depositReceived && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-2 bg-emerald-900/20 rounded-lg border border-emerald-800"
                          >
                            <label className="block text-xs font-medium text-emerald-400 mb-1">
                              Date de reception
                            </label>
                            <input
                              type="date"
                              value={depositReceivedDate}
                              onChange={e => setDepositReceivedDate(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-white/[0.04] border border-emerald-700 text-white text-sm focus:outline-none focus:border-tribal-accent/40"
                            />
                            <p className="text-xs text-emerald-400 mt-1">
                              L'ecriture comptable sera creee automatiquement
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Conditions particulieres, details supplementaires..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40 placeholder-white/25 resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-900/20 border border-red-800 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-400">{error}</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-white/60 font-medium text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Creer le devis</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreateQuoteModal
