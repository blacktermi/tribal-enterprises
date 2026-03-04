/**
 * Modal pour modifier un devis existant
 * Si le devis est deja converti en commande, la commande sera mise a jour automatiquement
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
  Edit3,
  LinkIcon,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import { generateAndDownloadQuote } from '../../services/invoiceGenerator'
import { resolveApiBase } from '../../utils/api'
import type { Brand, PaymentMethod, Invoice } from '../../accounting/types'

interface EditQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  quote: Invoice | null
}

interface QuoteLine {
  id: string
  description: string
  qty: number
  unitPriceHT: number
}

// Labels des methodes de paiement pour affichage
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  MOOV_MONEY: 'Moov Money',
  CAISSE: 'Especes',
  BANQUE: 'Virement',
  AUTRE: 'Autre',
}

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

export const EditQuoteModal: React.FC<EditQuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quote,
}) => {
  // Client info
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Quote details
  const [brand, setBrand] = useState<Brand>('tribalprint')
  const [quoteDate, setQuoteDate] = useState('') // Date du devis (modifiable)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')

  // Lines
  const [lines, setLines] = useState<QuoteLine[]>([
    { id: generateLineId(), description: '', qty: 1, unitPriceHT: 0 },
  ])

  // Deposit (acompte) - lecture seule pour les devis existants
  const [depositAmount, setDepositAmount] = useState(0)
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('WAVE')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [linkedOrderInfo, setLinkedOrderInfo] = useState<string | null>(null)

  const updateInvoice = useAccountingStore(s => s.updateInvoice)

  // Charger les donnees du devis quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && quote) {
      setClientName(quote.partnerName || '')
      setClientPhone(quote.partnerPhone || '')
      setClientEmail(quote.partnerEmail || '')
      setBrand((quote.brand as Brand) || 'tribalprint')
      setQuoteDate(quote.date || '') // Charger la date du devis
      setValidUntil(quote.validUntil || '')
      setNotes(quote.memo || '')
      setDepositAmount(quote.depositAmount || 0)
      setDepositMethod((quote.depositMethod as PaymentMethod) || 'WAVE')

      // Convertir les lignes du devis
      if (quote.lines && quote.lines.length > 0) {
        setLines(
          quote.lines.map((l, idx) => ({
            id: `line-${idx}-${Date.now()}`,
            description: l.description || '',
            qty: l.qty || 1,
            unitPriceHT: l.unitPriceHT || 0,
          }))
        )
      } else {
        setLines([{ id: generateLineId(), description: '', qty: 1, unitPriceHT: 0 }])
      }

      // Verifier si le devis est lie a une commande
      if (quote.quoteStatus === 'converted' && quote.convertedToInvoiceId) {
        setLinkedOrderInfo(quote.convertedToInvoiceId)
      } else {
        setLinkedOrderInfo(null)
      }

      setError(null)
      setSuccess(false)
    }
  }, [isOpen, quote])

  // Calculate totals
  const totals = React.useMemo(() => {
    const ht = lines.reduce((sum, line) => sum + line.qty * line.unitPriceHT, 0)
    const tva = 0 // TVA non applicable
    const ttc = ht + tva
    return { ht, tva, ttc }
  }, [lines])

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

  // Mettre a jour la commande liee si elle existe
  const updateLinkedOrder = async (
    quoteId: string,
    updatedData: {
      clientName?: string
      clientPhone?: string
      clientEmail?: string
      date?: string // Date du devis (pour mettre a jour la date de commande)
      lines: Array<{ description: string; qty: number; unitPriceHT: number }>
      totals: { ht: number; tva: number; ttc: number }
    }
  ) => {
    try {
      const apiBase = resolveApiBase()
      const response = await fetch(`${apiBase}/accounting/quotes/${quoteId}/update-linked-order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Avertissement mise a jour commande liee:', errorData)
        // On ne throw pas l'erreur, la mise a jour du devis est prioritaire
      }

      return response.ok
    } catch (err) {
      console.warn('Erreur mise a jour commande liee:', err)
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!quote) {
      setError('Devis non trouve')
      return
    }

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
      // Preparer les donnees de mise a jour
      const updateData = {
        partnerName: clientName.trim(),
        partnerPhone: clientPhone.trim() || undefined,
        partnerEmail: clientEmail.trim() || undefined,
        brand,
        date: quoteDate || undefined, // Date du devis (pour la comptabilite)
        validUntil: validUntil || undefined,
        memo: notes.trim() || undefined,
        lines: validLines.map(l => ({
          description: l.description,
          qty: l.qty,
          unitPriceHT: l.unitPriceHT,
          tvaRate: 0,
        })),
      }

      // Mettre a jour le devis dans le store (et l'API)
      const updatedQuote = updateInvoice(quote.id, updateData)

      if (!updatedQuote) {
        throw new Error('Erreur lors de la mise a jour du devis')
      }

      // Si le devis est lie a une commande, mettre a jour la commande
      if (linkedOrderInfo) {
        await updateLinkedOrder(quote.id, {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim() || undefined,
          clientEmail: clientEmail.trim() || undefined,
          date: quoteDate || undefined, // Propager la date a la commande
          lines: validLines,
          totals,
        })
      }

      setSuccess(true)

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la mise a jour du devis')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Download PDF for quote
  const handleDownloadPDF = async () => {
    if (!quote) return

    try {
      const validLines = lines.filter(l => l.description.trim() && l.unitPriceHT > 0)

      await generateAndDownloadQuote({
        id: quote.id,
        date: quote.date,
        validUntil: validUntil || quote.validUntil,
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

  if (!quote) return null

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
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Modifier le devis</h2>
                    <p className="text-xs text-white/70">
                      {quote.ref || quote.id.slice(0, 12)}
                      {linkedOrderInfo && ' (lie a une commande)'}
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
                  Devis modifie avec succes !
                </h3>
                {linkedOrderInfo && (
                  <p className="text-sm text-amber-400 mt-2 flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    Commande liee mise a jour
                  </p>
                )}
                <p className="text-sm text-white/40 mt-1">
                  Nouveau montant: {formatAmount(totals.ttc)}
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Telecharger le PDF
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Avertissement si lie a une commande */}
                {linkedOrderInfo && (
                  <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 flex items-start gap-2">
                    <LinkIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-300">
                      <strong>Devis converti en commande</strong>
                      <p className="text-xs mt-0.5">
                        Les modifications seront automatiquement appliquees a la commande liee.
                      </p>
                    </div>
                  </div>
                )}

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
                  {/* Date du devis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Date du devis
                      </label>
                      <input
                        type="date"
                        value={quoteDate}
                        onChange={e => setQuoteDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">
                        Valide jusqu'au
                      </label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={e => setValidUntil(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-tribal-accent/40"
                      />
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
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-900/30 text-amber-300 text-xs font-medium hover:bg-amber-900/50 transition-colors"
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
                  <div className="bg-amber-900/20 rounded-lg p-3 space-y-1">
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
                    <div className="flex justify-between text-base font-bold border-t border-amber-800 pt-2">
                      <span className="text-white">Total TTC</span>
                      <span className="text-amber-400">
                        {formatAmount(totals.ttc)}
                      </span>
                    </div>
                    {depositAmount > 0 && (
                      <div className="flex justify-between text-sm border-t border-amber-800 pt-2 mt-2">
                        <span className="text-emerald-400">
                          Acompte recu ({PAYMENT_METHOD_LABELS[depositMethod] || depositMethod})
                        </span>
                        <span className="font-medium text-emerald-400">
                          {formatAmount(depositAmount)}
                        </span>
                      </div>
                    )}
                  </div>
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
                        <span>Modification...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enregistrer</span>
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

export default EditQuoteModal
