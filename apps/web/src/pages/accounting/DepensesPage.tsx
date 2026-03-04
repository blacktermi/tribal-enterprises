import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useAccountingStore } from '../../store/accounting'
import {
 Plus,
 Receipt,
 CreditCard,
 Calendar,
 Tag,
 FileText,
 Wallet,
 TrendingDown,
 DollarSign,
 Package,
 Users,
 Trash2,
 Building2,
 Pencil,
 X,
 RefreshCw,
 CloudDownload,
 Loader2,
 CheckCircle2,
 AlertCircle,
 Search,
 Camera,
 Smartphone,
 Link2,
 Upload,
 Check,
} from 'lucide-react'
import { useMarketingExpenses } from '../../lib/hooks/useMarketingExpenses'
import {
 useAccountingFilters,
 AVAILABLE_YEARS,
 PERIOD_OPTIONS,
 AVAILABLE_MONTHS,
 getYearLabel,
} from '../../store/accountingFilters'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

// Category badge component
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
 const colors: Record<string, string> = {
 'Salaires': ' text-violet-400',
 'Remuneration Associes': ' text-emerald-400',
"Main d'œuvre (Atelier)": ' text-orange-400',
 'Sous-traitance Impression': 'bg-sky-900/20 text-sky-400',
 'Sous-traitance Fabrication': ' text-teal-400',
 'Fournitures': ' text-amber-400',
 'Matériel': ' text-yellow-400',
 'Loyer': ' text-purple-400',
 'Marketing': ' text-pink-400',
 'Abonnements & Logiciels': ' text-tribal-accent',
 'Hébergement & Domaines': ' text-cyan-400',
 'Déplacements': ' text-blue-400',
 'Livraison (Reprise)': ' text-orange-400',
 'Services': ' text-rose-400',
 'Frais généraux': 'bg-tribal-black text-white/80',
 'Autre': 'bg-white/[0.04] text-white/80',
 default: 'bg-white/[0.04] text-white/80',
 }

 const colorClass = colors[category] || colors.default

 return (
 <span
 className={cn(
 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
 colorClass
 )}
 >
 <Tag className="w-3 h-3" />
 {category}
 </span>
 )
}

// Composant Combobox fournisseur avec recherche
interface SupplierComboboxProps {
 suppliers: Array<{ id: string; name: string }>
 supplierId: string
 supplierName: string
 customSupplier: boolean
 onSelect: (id: string, name: string) => void
 onCustom: (name: string) => void
 onClear: () => void
}

const SupplierCombobox: React.FC<SupplierComboboxProps> = ({
 suppliers,
 supplierId,
 supplierName,
 customSupplier,
 onSelect,
 onCustom,
 onClear,
}) => {
 const [open, setOpen] = useState(false)
 const [query, setQuery] = useState('')
 const containerRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLInputElement>(null)

 // Fermer le dropdown au clic extérieur
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setOpen(false)
 }
 }
 document.addEventListener('mousedown', handler)
 return () => document.removeEventListener('mousedown', handler)
 }, [])

 // Filtrer les fournisseurs par la saisie
 const filtered = useMemo(() => {
 if (!query.trim()) return suppliers
 const q = query.toLowerCase()
 return suppliers.filter(s => s.name.toLowerCase().includes(q))
 }, [suppliers, query])

 // Texte affiché dans l'input quand fermé
 const displayValue = customSupplier
 ? supplierName
 : supplierId
 ? suppliers.find(s => s.id === supplierId)?.name || ''
 : ''

 const handleOpen = useCallback(() => {
 setOpen(true)
 setQuery('')
 setTimeout(() => inputRef.current?.focus(), 50)
 }, [])

 const handleSelect = useCallback(
 (id: string, name: string) => {
 onSelect(id, name)
 setOpen(false)
 setQuery('')
 },
 [onSelect]
 )

 const handleCustom = useCallback(() => {
 onCustom('')
 setOpen(false)
 setQuery('')
 }, [onCustom])

 return (
 <div ref={containerRef} className="relative">
 {/* Bouton trigger / affichage sélection */}
 {!open && !customSupplier && (
 <button
 type="button"
 onClick={handleOpen}
 className={cn(
 'w-full flex items-center gap-2 px-3 py-2.5 border rounded-xl text-left transition-all',
 'border-white/[0.06] bg-white/[0.03]',
 'hover:border-red-500/30',
 'focus:outline-none focus:ring-red-500/20 focus:border-red-500',
 !displayValue && 'text-white/40'
 )}
 >
 <Building2 className="w-4 h-4 text-white/40 flex-shrink-0" />
 <span className="flex-1 truncate text-sm text-white">
 {displayValue || '-- Sélectionner --'}
 </span>
 <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
 </button>
 )}

 {/* Input de recherche (quand ouvert) */}
 {open && !customSupplier && (
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
 <input
 ref={inputRef}
 type="text"
 placeholder="Rechercher un fournisseur..."
 value={query}
 onChange={e => setQuery(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Escape') {
 setOpen(false)
 setQuery('')
 }
 }}
 className="w-full pl-9 pr-8 py-2.5 border border-red-400 bg-white/[0.03] text-white rounded-xl ring-2 ring-red-500/20 transition-all text-sm placeholder:text-white/40"
 />
 <button
 type="button"
 onClick={() => {
 setOpen(false)
 setQuery('')
 }}
 className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white/60"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* Dropdown des résultats */}
 {open && !customSupplier && (
 <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.03] shadow-xl">
 {filtered.length === 0 && (
 <div className="px-3 py-3 text-sm text-white/40 text-center">
 Aucun fournisseur trouvé
 </div>
 )}
 {filtered.map(s => (
 <button
 key={s.id}
 type="button"
 onClick={() => handleSelect(s.id, s.name)}
 className={cn(
 'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
 'hover:bg-red-950/30',
 s.id === supplierId
 ? 'bg-red-950/30 text-red-400 font-medium'
 : 'text-white/80'
 )}
 >
 <Building2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
 {s.name}
 </button>
 ))}
 {/* Séparateur + Saisie manuelle */}
 <div className="border-t border-white/[0.04]">
 <button
 type="button"
 onClick={handleCustom}
 className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-blue-400 hover:bg-blue-900/20 transition-colors font-medium"
 >
 <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
 Saisir manuellement...
 </button>
 </div>
 </div>
 )}

 {/* Input saisie manuelle */}
 {customSupplier && (
 <div className="relative">
 <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
 <input
 className="w-full pl-9 pr-8 py-2.5 border border-blue-500/30 bg-white/[0.03] text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:ring-tribal-accent/20 focus:border-tribal-accent/40 transition-all text-sm"
 placeholder="Nom du fournisseur"
 value={supplierName}
 onChange={e => onCustom(e.target.value)}
 autoFocus
 />
 <button
 type="button"
 onClick={() => {
 onClear()
 }}
 className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white/60"
 title="Revenir à la liste"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>
 )
}

export const DepensesPage: React.FC = () => {
 const invoices = useAccountingStore(s => s.invoices)
 const partners = useAccountingStore(s => s.partners)
 const settings = useAccountingStore(s => s.settings)
 const addInvoice = useAccountingStore(s => s.addInvoice)
 const deleteInvoice = useAccountingStore(s => s.deleteInvoice)
 const updateInvoice = useAccountingStore(s => s.updateInvoice)
 const computeTotals = useAccountingStore(s => s.computeTotals)
 const loadFromApi = useAccountingStore(s => s.loadFromApi)

 const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
 const [category, setCategory] = useState<string>('Frais généraux')
 const [supplierId, setSupplierId] = useState<string>('')
 const [supplierName, setSupplierName] = useState<string>('')
 const [customSupplier, setCustomSupplier] = useState<boolean>(false)
 const [description, setDescription] = useState<string>('')
 const [ht, setHT] = useState<number>(0)
 const [tvaRate, setTvaRate] = useState<number>(0)
 const [method, setMethod] = useState<keyof typeof settings.paymentAccounts>('WAVE')
 const [isInvestment, setIsInvestment] = useState<boolean>(false)
 const [investmentDuration, setInvestmentDuration] = useState<number>(5)
 const [isChargesSociales, setIsChargesSociales] = useState<boolean>(false)

 // État pour l'édition
 const [editingExpense, setEditingExpense] = useState<any>(null)
 const [editDate, setEditDate] = useState<string>('')
 const [editCategory, setEditCategory] = useState<string>('')
 const [editSupplierId, setEditSupplierId] = useState<string>('')
 const [editSupplierName, setEditSupplierName] = useState<string>('')
 const [editCustomSupplier, setEditCustomSupplier] = useState<boolean>(false)
 const [editDescription, setEditDescription] = useState<string>('')
 const [editHT, setEditHT] = useState<number>(0)
 const [editTvaRate, setEditTvaRate] = useState<number>(0)
 const [editPaymentMethod, setEditPaymentMethod] = useState<string>('WAVE')
 const [editIsInvestment, setEditIsInvestment] = useState<boolean>(false)
 const [editInvestmentDuration, setEditInvestmentDuration] = useState<number>(5)
 const [editIsChargesSociales, setEditIsChargesSociales] = useState<boolean>(false)

 // Selection multi dans l'historique
 const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())

 // Filtres globaux persistants
 const {
 selectedYear,
 selectedPeriod,
 selectedMonth,
 setSelectedYear,
 setSelectedPeriod,
 setSelectedMonth,
 } = useAccountingFilters()

 // Filtres locaux
 const [search, setSearch] = useState('')
 const [categoryFilter, setCategoryFilter] = useState<string>('all')
 const [supplierFilter, setSupplierFilter] = useState<string>('all')

 // Liste des fournisseurs depuis la page Tiers (type="fournisseur") — declare tot pour les hooks Wave
 const supplierPartners = useMemo(() => {
 return partners
 .filter(p => p.type === 'fournisseur')
 .sort((a, b) => a.name.localeCompare(b.name))
 }, [partners])
 const allSupplierNames = useMemo(() => supplierPartners.map(p => p.name), [supplierPartners])

 // Hook pour synchronisation des dépenses marketing
 const {
 isLoading: isSyncingMarketing,
 syncMarketingExpenses,
 getExistingMarketingExpenses,
 getMarketingExpensesTotal,
 } = useMarketingExpenses()
 const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)
 const [showSyncModal, setShowSyncModal] = useState(false)
 const [syncYear, setSyncYear] = useState(new Date().getFullYear())
 const [syncOverwrite, setSyncOverwrite] = useState(false)
 const [syncPaymentMethod, setSyncPaymentMethod] = useState<
 'BANQUE' | 'CAISSE' | 'WAVE' | 'ORANGE_MONEY'
 >('WAVE')

 // === Interets Associes ===
 const [interestMonth, setInterestMonth] = useState(() => {
 const now = new Date()
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
 })

 const interestDetails = useMemo(() => {
 const [year, month] = interestMonth.split('-').map(Number)
 const daysInMonth = new Date(year, month, 0).getDate()
 const amountPerAssociate = daysInMonth * 10000
 const total = amountPerAssociate * 2
 const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', {
 month: 'long',
 year: 'numeric',
 })
 const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
 const monthPad = String(month).padStart(2, '0')
 const refJoseph = `INT-JOSEPH-${year}-${monthPad}`
 const refSouka = `INT-SOUKA-${year}-${monthPad}`
 const alreadyGenerated = invoices.some(
 inv => inv.ref === refJoseph || inv.ref === refSouka
 )
 return {
 year,
 month,
 daysInMonth,
 amountPerAssociate,
 total,
 monthName,
 lastDay,
 refJoseph,
 refSouka,
 alreadyGenerated,
 }
 }, [interestMonth, invoices])

 // Retraits reels par associe pour le mois selectionne
 const associateWithdrawals = useMemo(() => {
 const [year, month] = interestMonth.split('-').map(Number)
 const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
 const today = new Date().toISOString().slice(0, 10)
 const now = new Date()
 // Debut de la semaine courante (lundi)
 const dayOfWeek = now.getDay() || 7 // Dimanche = 7
 const mondayDate = new Date(now)
 mondayDate.setDate(now.getDate() - dayOfWeek + 1)
 const weekStart = mondayDate.toISOString().slice(0, 10)

 const associates = [
 { name: 'Joseph Kakou', keywords: ['joseph', 'kakou', 'joseph kakou'], phones: ['0566907470', '566907470'] },
 { name: 'Souka', keywords: ['souka'], phones: ['0749684645', '749684645'] },
 ]

 return associates.map(assoc => {
 // Filtrer les depenses de cet associe pour le mois
 const monthExpenses = invoices.filter(inv => {
 if (inv.type !== 'expense') return false
 if (!inv.date.startsWith(monthPrefix)) return false
 // Exclure les ecritures auto-generees (INT-JOSEPH/SOUKA)
 if (inv.ref?.startsWith('INT-')) return false
 const partnerLower = (inv.partnerName || '').toLowerCase()
 const memoLower = (inv.memo || '').toLowerCase()
 return assoc.keywords.some(kw => partnerLower.includes(kw) || memoLower.includes(kw))
 }).sort((a, b) => b.date.localeCompare(a.date))

 const totalMonth = monthExpenses.reduce((s, e) => s + (e.totals?.ttc || 0), 0)
 const totalWeek = monthExpenses
 .filter(e => e.date >= weekStart && e.date <= today)
 .reduce((s, e) => s + (e.totals?.ttc || 0), 0)
 const totalToday = monthExpenses
 .filter(e => e.date === today)
 .reduce((s, e) => s + (e.totals?.ttc || 0), 0)

 return {
 ...assoc,
 expenses: monthExpenses,
 totalMonth,
 totalWeek,
 totalToday,
 }
 })
 }, [invoices, interestMonth])

 const handleGenerateInterests = () => {
 const { daysInMonth, amountPerAssociate, monthName, lastDay, refJoseph, refSouka } =
 interestDetails
 const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)

 addInvoice({
 type: 'expense',
 date: lastDay,
 ref: refJoseph,
 expenseCategory: 'Remuneration Associes',
 partnerName: 'Joseph Kakou',
 memo: `Interet quotidien associe - ${monthLabel} (${daysInMonth}j x 10 000 FCFA)`,
 lines: [{ qty: 1, unitPriceHT: amountPerAssociate, tvaRate: 0 }],
 paid: true,
 paymentMethod: 'CAISSE',
 paidAt: lastDay,
 } as any)

 addInvoice({
 type: 'expense',
 date: lastDay,
 ref: refSouka,
 expenseCategory: 'Remuneration Associes',
 partnerName: 'Souka',
 memo: `Interet quotidien associe - ${monthLabel} (${daysInMonth}j x 10 000 FCFA)`,
 lines: [{ qty: 1, unitPriceHT: amountPerAssociate, tvaRate: 0 }],
 paid: true,
 paymentMethod: 'CAISSE',
 paidAt: lastDay,
 } as any)
 }

 // === Wave Screenshot Scan ===
 interface WaveTransaction {
 id: string
 recipientName: string | null
 recipientPhone: string | null
 amount: number | null
 date: string | null
 type: 'debit' | 'credit'
 failed: boolean
 description: string
 match: { supplierId: string; supplierName: string; matchSource: string; suggestedCategory: string | null } | null
 customSupplierName?: string
 category?: string
 ignored: boolean
 ignoreReason?: string
 }

 interface WaveScan {
 id: string
 image: string
 status: 'extracting' | 'done' | 'error'
 error?: string
 transactions: WaveTransaction[]
 }

 const [waveScans, setWaveScans] = useState<WaveScan[]>([])
 const [waveActiveScan, setWaveActiveScan] = useState<string | null>(null)
 const [waveMappingTx, setWaveMappingTx] = useState<string | null>(null)
 const [waveSelectedTxs, setWaveSelectedTxs] = useState<Set<string>>(new Set())
 const waveFileRef = useRef<HTMLInputElement>(null)

 const waveExtracting = waveScans.some(s => s.status === 'extracting')
 const activeScan = waveScans.find(s => s.id === waveActiveScan)

 // Dernière dépense payée via Wave (hors Marketing/Facebook)
 const lastWaveExpense = useMemo(() => {
 const waveExpenses = invoices.filter(
 i => i.type === 'expense' && i.paymentMethod?.toUpperCase() === 'WAVE'
 && i.expenseCategory !== 'Marketing' // Exclure les pubs Facebook (auto-sync fin de mois)
 )
 if (waveExpenses.length === 0) return null
 // Trouver la plus récente
 let latest = waveExpenses[0]
 for (const e of waveExpenses) {
 const d = e.paidAt || e.date || ''
 const ld = latest.paidAt || latest.date || ''
 if (d > ld) latest = e
 }
 const dateStr = latest.paidAt || latest.date || ''
 if (!dateStr) return null
 let formattedDate = dateStr
 try {
 formattedDate = new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
 } catch { /* keep raw */ }
 return {
 date: formattedDate,
 amount: latest.totals?.ttc || 0,
 supplier: latest.partnerName || 'Inconnu',
 category: latest.expenseCategory || '',
 }
 }, [invoices])

 // Filtres pour ignorer certaines transactions
 const checkTxIgnored = useCallback((tx: { recipientName?: string | null; recipientPhone?: string | null; type?: string; failed?: boolean; description?: string }): string | null => {
 const nameLower = (tx.recipientName || '').toLowerCase()
 const descLower = (tx.description || '').toLowerCase()
 const phone = (tx.recipientPhone || '').replace(/[^0-9]/g, '')

 // Transactions recues = pas des depenses
 if (tx.type === 'credit') return 'Argent recu (pas une depense)'
 // Transactions echouees
 if (tx.failed) return 'Transaction echouee / fonds insuffisants'
 // Facebook/Meta
 if (['facebook', 'meta', 'fb ', 'facebk', 'fb.me'].some(kw => nameLower.includes(kw) || descLower.includes(kw)))
 return 'Facebook/Meta — deja traque via API'
 // Coffre, carte prepayee, compte perso
 if (['coffre', 'coffre-fort', 'epargne', 'vault', 'carte prepayee', 'carte prépayée', 'prepaid card', 'carte prepaye'].some(kw => nameLower.includes(kw) || descLower.includes(kw))
 || ['0787502637', '787502637'].some(p => phone.includes(p)))
 return 'Mouvement interne (coffre / carte / compte perso)'
 // Abonnements personnels
 if (['crunchyroll', 'spotify', 'netflix', 'disney+', 'apple music', 'deezer', 'youtube premium', 'o\'rencard', 'orencard', 'rencard'].some(kw => nameLower.includes(kw)))
 return 'Depense personnelle'
 return null
 }, [])

 // Compresser une image pour l'envoi (reduit les screenshots retina iPhone de 5-10MB a ~200KB)
 const compressImage = useCallback((file: File, maxWidth = 1400): Promise<string> => {
 return new Promise((resolve, reject) => {
 const img = new Image()
 const url = URL.createObjectURL(file)
 img.onload = () => {
 URL.revokeObjectURL(url)
 const scale = img.width > maxWidth ? maxWidth / img.width : 1
 const canvas = document.createElement('canvas')
 canvas.width = Math.round(img.width * scale)
 canvas.height = Math.round(img.height * scale)
 const ctx = canvas.getContext('2d')
 if (!ctx) { reject(new Error('Canvas non supporte')); return }
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
 resolve(canvas.toDataURL('image/jpeg', 0.82))
 }
 img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Erreur chargement image')) }
 img.src = url
 })
 }, [])

 const processOneImage = useCallback(async (file: File) => {
 const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

 // Compresser l'image (JPEG redimensionne) au lieu d'envoyer le PNG brut
 const compressed = await compressImage(file)
 // Garder l'original pour l'apercu, le compresse pour l'API
 const reader = new FileReader()
 const preview = await new Promise<string>((resolve, reject) => {
 reader.onload = () => resolve(reader.result as string)
 reader.onerror = reject
 reader.readAsDataURL(file)
 })

 setWaveScans(prev => [...prev, { id: scanId, image: preview, status: 'extracting', transactions: [] }])
 // Auto-selectionner la premiere image
 setWaveActiveScan(prev => prev || scanId)

 try {
 const response = await fetch('/api/accounting/wave-extract', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ image: compressed }),
 })

 const data = await response.json()
 if (!response.ok) {
 setWaveScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'error' as const, error: data.error || 'Erreur extraction' } : s))
 return
 }

 // Transformer les transactions retournees par le backend
 const transactions: WaveTransaction[] = (data.transactions || []).map((item: any, idx: number) => {
 const tx = item.extracted || item
 const ignoreReason = checkTxIgnored(tx)
 return {
 id: `${scanId}-tx-${idx}`,
 recipientName: tx.recipientName || null,
 recipientPhone: tx.recipientPhone || null,
 amount: tx.amount || null,
 date: tx.date || null,
 type: tx.type || 'debit',
 failed: tx.failed || false,
 description: tx.description || '',
 match: item.match || null,
 category: item.match?.suggestedCategory || tx.suggestedCategory || undefined,
 ignored: !!ignoreReason,
 ignoreReason: ignoreReason || undefined,
 }
 })

 setWaveScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'done' as const, transactions } : s))
 } catch (err) {
 setWaveScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'error' as const, error: (err as Error).message } : s))
 }
 }, [checkTxIgnored, compressImage])

 const handleWaveUpload = useCallback(async (files: FileList | File[]) => {
 const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
 if (!imageFiles.length) return
 imageFiles.forEach(f => processOneImage(f))
 }, [processOneImage])

 // Creer directement la depense depuis une transaction Wave
 const useWaveTransaction = useCallback((tx: WaveTransaction) => {
 const txDate = tx.date || new Date().toISOString().slice(0, 10)
 const txAmount = tx.amount || 0
 const supplierValue = tx.match?.supplierName || tx.customSupplierName || tx.recipientName || 'Fournisseur'

 // Detection doublons : meme date + meme montant + methode WAVE
 const isDuplicate = invoices.some(inv =>
 inv.type === 'expense' &&
 inv.date === txDate &&
 inv.paymentMethod === 'WAVE' &&
 Math.abs((inv.lines?.[0]?.unitPriceHT || inv.totals?.ht || 0) - txAmount) < 2
 )

 if (isDuplicate) {
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => t.id === tx.id
 ? { ...t, ignored: true, ignoreReason: 'Doublon — cette depense existe deja (meme date + montant + WAVE)' }
 : t
 ),
 })))
 return
 }

 const cat = tx.category || tx.match?.suggestedCategory || 'Frais généraux'

 addInvoice({
 type: 'expense',
 date: txDate,
 expenseCategory: cat,
 partnerId: tx.match?.supplierId || undefined,
 partnerName: supplierValue,
 memo: tx.description || tx.recipientName || '',
 lines: [{ qty: 1, unitPriceHT: txAmount, tvaRate: 0 }],
 paid: true,
 paymentMethod: 'WAVE',
 paidAt: txDate,
 } as any)

 // Sauvegarder la categorie sur le fournisseur pour auto-detection future
 if (tx.match?.supplierId && cat) {
 fetch(`/api/accounting/suppliers/${tx.match.supplierId}/add-alias`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({ defaultCategory: cat }),
 }).catch(() => {})
 }

 // Retirer de la liste
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.filter(t => t.id !== tx.id),
 })))
 }, [addInvoice, invoices])

 // Associer un fournisseur a une transaction Wave
 const handleWaveMapSupplier = useCallback(async (txId: string, targetSupplierId: string) => {
 let tx: WaveTransaction | undefined
 for (const scan of waveScans) {
 tx = scan.transactions.find(t => t.id === txId)
 if (tx) break
 }
 if (!tx) return
 setWaveMappingTx(txId)
 try {
 await fetch(`/api/accounting/suppliers/${targetSupplierId}/add-alias`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({
 waveName: tx.recipientName,
 wavePhone: tx.recipientPhone,
 }),
 })
 const supplier = supplierPartners.find(s => s.id === targetSupplierId)
 if (supplier) {
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => t.id === txId
 ? { ...t, match: { supplierId: supplier.id, supplierName: supplier.name, matchSource: 'manual', suggestedCategory: null } }
 : t
 ),
 })))
 }
 } catch {
 // silencieux
 } finally {
 setWaveMappingTx(null)
 }
 }, [waveScans, supplierPartners])

 const resetWave = useCallback(() => {
 setWaveScans([])
 setWaveActiveScan(null)
 }, [])

 // Nombre de dépenses marketing déjà synchronisées
 const marketingExpensesCount = useMemo(
 () => getExistingMarketingExpenses().length,
 [getExistingMarketingExpenses]
 )
 const marketingExpensesTotal = useMemo(
 () => getMarketingExpensesTotal(),
 [getMarketingExpensesTotal]
 )

 // Fonction de synchronisation
 const handleSyncMarketing = async () => {
 const result = await syncMarketingExpenses(syncYear, {
 overwrite: syncOverwrite,
 paymentMethod: syncPaymentMethod,
 })

 if (result.success) {
 setSyncResult({
 success: true,
 message: `✅ Synchronisation réussie ! ${result.created} créées, ${result.updated} mises à jour, ${result.skipped} ignorées.`,
 })
 } else {
 setSyncResult({
 success: false,
 message: `❌ Erreur: ${result.error}`,
 })
 }

 // Masquer le message après 5 secondes
 setTimeout(() => setSyncResult(null), 5000)
 setShowSyncModal(false)
 }

 const totals = useMemo(
 () =>
 computeTotals({
 type: 'expense',
 date,
 lines: [{ qty: 1, unitPriceHT: ht, tvaRate }],
 } as any),
 [date, ht, tvaRate]
 )

 // Liste brute des dépenses
 const allExpenses = useMemo(() => {
 return invoices.filter(i => i.type === 'expense').sort((a, b) => b.date.localeCompare(a.date))
 }, [invoices])

 // Liste des fournisseurs uniques (pour le filtre)
 const uniqueSuppliers = useMemo(() => {
 const suppliers = new Set<string>()
 allExpenses.forEach(e => {
 if (e.partnerName) suppliers.add(e.partnerName)
 })
 return Array.from(suppliers).sort()
 }, [allExpenses])

 // Liste des dépenses filtrées
 const expenseList = useMemo(() => {
 let result = [...allExpenses]

 // Filtre par année (indépendant de la période)
 if (selectedYear !== null) {
 result = result.filter(e => {
 const expenseDate = new Date(e.date)
 const expenseYear = expenseDate.getFullYear()

 // Filtre par année
 if (expenseYear !== selectedYear) return false

 // Filtre par mois si sélectionné
 if (selectedPeriod === 'month') {
 const targetMonth =
 selectedMonth !== null && selectedMonth !== undefined
 ? selectedMonth
 : new Date().getMonth()
 return expenseDate.getMonth() === targetMonth
 }

 // Filtre par trimestre
 if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(new Date().getMonth() / 3)
 const expenseQuarter = Math.floor(expenseDate.getMonth() / 3)
 return expenseQuarter === currentQuarter
 }

 // Filtre par semaine
 if (selectedPeriod === 'week') {
 const now = new Date()
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 return expenseDate >= weekAgo
 }

 return true
 })
 } else if (selectedPeriod === 'week') {
 // Pas d'année sélectionnée mais période semaine
 const now = new Date()
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 result = result.filter(e => new Date(e.date) >= weekAgo)
 }

 // Filtre par recherche
 if (search.trim()) {
 const s = search.toLowerCase()
 result = result.filter(
 e =>
 (e.partnerName || '').toLowerCase().includes(s) ||
 (e.memo || '').toLowerCase().includes(s) ||
 (e.expenseCategory || '').toLowerCase().includes(s) ||
 (e.ref || '').toLowerCase().includes(s)
 )
 }

 // Filtre par catégorie
 if (categoryFilter !== 'all') {
 result = result.filter(e => e.expenseCategory === categoryFilter)
 }

 // Filtre par fournisseur
 if (supplierFilter !== 'all') {
 result = result.filter(e => e.partnerName === supplierFilter)
 }

 return result
 }, [
 allExpenses,
 selectedYear,
 selectedPeriod,
 selectedMonth,
 search,
 categoryFilter,
 supplierFilter,
 ])

 // Stats basées sur les dépenses filtrées
 const expenseStats = useMemo(() => {
 const total = expenseList.reduce((s, i) => s + (i.totals?.ttc || 0), 0)
 // Dépenses du mois calendaire courant (toutes, pas seulement filtrées)
 const now = new Date()
 const thisMonth = allExpenses
 .filter(
 i =>
 new Date(i.date).getMonth() === now.getMonth() &&
 new Date(i.date).getFullYear() === now.getFullYear()
 )
 .reduce((s, i) => s + (i.totals?.ttc || 0), 0)
 return { count: expenseList.length, total, thisMonth }
 }, [expenseList, allExpenses])

 const onSave = () => {
 const supplierValue = supplierName?.trim() || 'Fournisseur'

 // Créer la dépense directement avec le statut payé et la méthode de paiement
 addInvoice({
 type: 'expense',
 date,
 expenseCategory: category,
 partnerId: supplierId || undefined,
 partnerName: supplierValue,
 memo: description?.trim() || '',
 isInvestment,
 investmentDuration: isInvestment ? investmentDuration : undefined,
 isChargesSociales,
 lines: [{ qty: 1, unitPriceHT: ht, tvaRate }],
 // Inclure directement le paiement pour éviter les problèmes de sync
 paid: true,
 paymentMethod: method,
 paidAt: date, // Date de la dépense = date du paiement
 } as any)

 setSupplierId('')
 setSupplierName('')
 setCustomSupplier(false)
 setDescription('')
 setHT(0)
 setTvaRate(0)
 setIsInvestment(false)
 setInvestmentDuration(5)
 setIsChargesSociales(false)
 }

 // Ouvrir le modal d'édition
 const openEditModal = (expense: any) => {
 setEditingExpense(expense)
 setEditDate(expense.date)
 setEditCategory(expense.expenseCategory || 'Frais généraux')
 const partnerName = expense.partnerName || ''
 const partnerId = expense.partnerId || ''
 setEditSupplierId(partnerId)
 setEditSupplierName(partnerName)
 // Si le fournisseur n'est pas dans la liste, activer saisie manuelle
 setEditCustomSupplier(partnerName !== '' && !allSupplierNames.includes(partnerName))
 setEditDescription(expense.memo || '')
 setEditHT(expense.lines?.[0]?.unitPriceHT || expense.totals?.ht || 0)
 setEditTvaRate(expense.lines?.[0]?.tvaRate || 0)
 setEditPaymentMethod(expense.paymentMethod || 'BANQUE')
 setEditIsInvestment(expense.isInvestment || false)
 setEditInvestmentDuration(expense.investmentDuration || 5)
 setEditIsChargesSociales(expense.isChargesSociales || false)
 }

 // Sauvegarder l'édition
 const onSaveEdit = () => {
 if (!editingExpense) return

 const supplierValue = editSupplierName?.trim() || 'Fournisseur'

 updateInvoice(editingExpense.id, {
 date: editDate,
 expenseCategory: editCategory,
 partnerId: editSupplierId || undefined,
 partnerName: supplierValue,
 memo: editDescription?.trim() || '',
 paymentMethod: editPaymentMethod,
 isInvestment: editIsInvestment,
 investmentDuration: editIsInvestment ? editInvestmentDuration : undefined,
 isChargesSociales: editIsChargesSociales,
 lines: [{ qty: 1, unitPriceHT: editHT, tvaRate: editTvaRate }],
 } as any)
 setEditingExpense(null)
 }

 const methods = Object.keys(settings.paymentAccounts) as Array<
 keyof typeof settings.paymentAccounts
 >

 const categories = [
 'Salaires',
 'Remuneration Associes',
"Main d'\u0153uvre (Atelier)",
 'Sous-traitance Impression',
 'Sous-traitance Fabrication',
 'Fournitures',
 'Matériel',
 'Loyer',
 'Marketing',
 'Abonnements & Logiciels',
 'Hébergement & Domaines',
 'Déplacements',
 'Livraison (Reprise)',
 'Services',
 'Frais généraux',
 'Autre',
 ]
 return (
 <div className="space-y-6 overflow-x-hidden">
 {/* Header descriptif */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl glass p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
 <div className="relative flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <CreditCard className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Dépenses</h1>
 <p className="text-white/70 text-sm">
 Enregistrez et suivez toutes vos dépenses d’exploitation, achats et investissements
 </p>
 </div>
 </div>
 </motion.div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-red-900/20 to-rose-900/20 p-5"
 >
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
 <TrendingDown className="w-5 h-5 text-white" />
 </div>
 <span className="text-sm text-red-400">Total dépenses</span>
 </div>
 <p className="text-2xl font-bold text-red-400">
 {expenseStats.total.toLocaleString()} {settings.currency}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-5"
 >
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
 <Calendar className="w-5 h-5 text-white" />
 </div>
 <span className="text-sm text-amber-400">Ce mois</span>
 </div>
 <p className="text-2xl font-bold text-amber-400">
 {expenseStats.thisMonth.toLocaleString()} {settings.currency}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
 >
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
 <Receipt className="w-5 h-5 text-white" />
 </div>
 <span className="text-sm text-white/60">Nb dépenses</span>
 </div>
 <p className="text-2xl font-bold text-white/80">
 {expenseStats.count}
 </p>
 </motion.div>
 </div>

 {/* Barre de filtres globaux */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.22 }}
 className="flex flex-col sm:flex-row gap-3"
 >
 {/* Recherche */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher par fournisseur, description..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all"
 />
 </div>

 <div className="flex gap-2 flex-wrap min-w-0">
 {/* Filtre par année */}
 <select
 value={selectedYear ?? 'all'}
 onChange={e =>
 setSelectedYear(e.target.value === 'all' ? null : parseInt(e.target.value))
 }
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white font-medium text-sm min-w-0"
 >
 {AVAILABLE_YEARS.map(y => (
 <option key={y ?? 'all'} value={y ?? 'all'}>
 {getYearLabel(y)}
 </option>
 ))}
 </select>

 {/* Filtre par période */}
 <select
 value={selectedPeriod}
 onChange={e => setSelectedPeriod(e.target.value as any)}
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white font-medium text-sm min-w-0"
 >
 {PERIOD_OPTIONS.map(p => (
 <option key={p.key} value={p.key}>
 {p.label}
 </option>
 ))}
 </select>

 {/* Filtre par mois (visible uniquement si période = mois) */}
 {selectedPeriod === 'month' && (
 <select
 value={selectedMonth ?? new Date().getMonth()}
 onChange={e => setSelectedMonth(parseInt(e.target.value))}
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white font-medium text-sm min-w-0"
 >
 {AVAILABLE_MONTHS.map(m => (
 <option key={m.value} value={m.value}>
 {m.label}
 </option>
 ))}
 </select>
 )}

 {/* Filtre par catégorie */}
 <select
 value={categoryFilter}
 onChange={e => setCategoryFilter(e.target.value)}
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm min-w-0 max-w-[180px]"
 >
 <option value="all">Toutes categories</option>
 {categories.map(c => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>

 {/* Filtre par fournisseur */}
 <select
 value={supplierFilter}
 onChange={e => setSupplierFilter(e.target.value)}
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm min-w-0 max-w-[180px]"
 >
 <option value="all">Tous fournisseurs</option>
 {uniqueSuppliers.map(s => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>

 {/* Bouton reset filtres */}
 {(search || categoryFilter !== 'all' || supplierFilter !== 'all') && (
 <button
 onClick={() => {
 setSearch('')
 setCategoryFilter('all')
 setSupplierFilter('all')
 }}
 className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-red-500 hover:border-red-500/30 transition-colors"
 title="Réinitialiser les filtres"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>
 </motion.div>

 {/* Synchronisation dépenses marketing */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.25 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-pink-900/20 via-fuchsia-900/10 to-purple-900/20 p-5"
 >
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
 <CloudDownload className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-white">
 Dépenses Marketing (Facebook Ads)
 </h3>
 <p className="text-sm text-white/50 truncate max-w-[250px] sm:max-w-none">
 {marketingExpensesCount > 0
 ? `${marketingExpensesCount} dépenses synchronisées (${marketingExpensesTotal.toLocaleString()} ${settings.currency})`
 : 'Synchronisez automatiquement vos dépenses publicitaires'}
 </p>
 </div>
 </div>

 <button
 onClick={() => setShowSyncModal(true)}
 disabled={isSyncingMarketing}
 className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
 >
 {isSyncingMarketing ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <RefreshCw className="w-4 h-4" />
 )}
 Synchroniser
 </button>
 </div>

 {/* Message de résultat */}
 <AnimatePresence>
 {syncResult && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className={cn(
 'mt-4 p-3 rounded-xl flex items-center gap-2 text-sm',
 syncResult.success
 ? ' text-emerald-400'
 : ' text-red-400'
 )}
 >
 {syncResult.success ? (
 <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 flex-shrink-0" />
 )}
 {syncResult.message}
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 {/* Modal de synchronisation */}
 <AnimatePresence>
 {showSyncModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
 onClick={() => setShowSyncModal(false)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 onClick={e => e.stopPropagation()}
 className="w-full max-w-md bg-white/[0.03] rounded-2xl shadow-2xl overflow-hidden"
 >
 <div className="p-5 border-b border-white/[0.06] bg-gradient-to-r from-pink-900/20 to-fuchsia-900/20">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
 <CloudDownload className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-white">
 Synchroniser Facebook Ads
 </h3>
 <p className="text-sm text-white/50">
 Importer les dépenses publicitaires
 </p>
 </div>
 </div>
 </div>

 <div className="p-5 space-y-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Année
 </label>
 <select
 value={syncYear}
 onChange={e => setSyncYear(parseInt(e.target.value))}
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 >
 {AVAILABLE_YEARS.filter((y): y is number => y !== null).map(y => (
 <option key={y} value={y}>
 {y}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Méthode de paiement
 </label>
 <select
 value={syncPaymentMethod}
 onChange={e => setSyncPaymentMethod(e.target.value as any)}
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 >
 <option value="BANQUE">Banque</option>
 <option value="CAISSE">Caisse</option>
 <option value="WAVE">Wave</option>
 <option value="ORANGE_MONEY">Orange Money</option>
 </select>
 </div>

 <label className="flex items-center gap-3 p-3 rounded-xl bg-tribal-black cursor-pointer">
 <input
 type="checkbox"
 checked={syncOverwrite}
 onChange={e => setSyncOverwrite(e.target.checked)}
 className="w-4 h-4 rounded border-white/[0.08] text-pink-400 focus:ring-pink-500"
 />
 <div>
 <span className="text-sm font-medium text-white/80">
 Mettre à jour les existantes
 </span>
 <p className="text-xs text-white/50">
 Écraser les dépenses déjà synchronisées
 </p>
 </div>
 </label>

 <div className="p-3 rounded-xl bg-blue-900/20 text-sm text-blue-400">
 <p className="font-medium mb-1">💡 Comment ça marche ?</p>
 <p className="text-xs">
 Les dépenses Facebook Ads de chaque mois seront importées automatiquement avec
 la catégorie"Marketing" et la marque correspondante.
 </p>
 </div>
 </div>

 <div className="p-5 border-t border-white/[0.06] flex gap-3">
 <button
 onClick={() => setShowSyncModal(false)}
 className="flex-1 px-4 py-2.5 border border-white/[0.06] text-white/80 rounded-xl hover:bg-white/[0.06] transition-colors"
 >
 Annuler
 </button>
 <button
 onClick={handleSyncMarketing}
 disabled={isSyncingMarketing}
 className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 text-white rounded-xl font-medium disabled:opacity-50"
 >
 {isSyncingMarketing ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <CloudDownload className="w-4 h-4" />
 )}
 Importer
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Section Interets Associes */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.27 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-green-900/20 p-5"
 >
 <div className="flex flex-col gap-4">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
 <Users className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-white">
 Interets Associes
 </h3>
 <p className="text-sm text-white/50">
 Protocole : 10 000 FCFA/jour par associe
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
 <input
 type="month"
 value={interestMonth}
 onChange={e => setInterestMonth(e.target.value)}
 className="px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-sm font-medium min-w-0"
 />
 {interestDetails.alreadyGenerated ? (
 <span className="inline-flex items-center gap-2 px-4 py-2.5 text-emerald-400 rounded-xl font-medium text-sm">
 <CheckCircle2 className="w-4 h-4" />
 Genere
 </span>
 ) : (
 <button
 onClick={handleGenerateInterests}
 className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all text-sm"
 >
 <DollarSign className="w-4 h-4" />
 Generer
 </button>
 )}
 </div>
 </div>

 {/* Cards par associe */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {[
 { name: 'Joseph Kakou', initials: 'JK', color: 'from-blue-500 to-indigo-600', idx: 0 },
 { name: 'Souka', initials: 'SK', color: 'from-orange-500 to-amber-600', idx: 1 },
 ].map(associe => {
 const data = associateWithdrawals[associe.idx]
 const limits = { day: 10000, week: 70000, month: 300000 }
 return (
 <div key={associe.name} className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4">
 <div className="flex items-center gap-2.5 mb-3">
 <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', associe.color)}>
 {associe.initials}
 </div>
 <span className="font-medium text-sm text-white">{associe.name}</span>
 <span className="ml-auto text-xs text-white/40">{data?.expenses.length || 0} retrait(s)</span>
 </div>

 {/* Limites vs reel */}
 <div className="grid grid-cols-3 gap-2 mb-3">
 {[
 { label: 'Jour', limit: limits.day, actual: data?.totalToday || 0 },
 { label: 'Semaine', limit: limits.week, actual: data?.totalWeek || 0 },
 { label: 'Mois', limit: limits.month, actual: data?.totalMonth || 0 },
 ].map(period => {
 const pct = period.limit > 0 ? Math.min((period.actual / period.limit) * 100, 100) : 0
 const over = period.actual > period.limit
 return (
 <div key={period.label} className="p-2 rounded-lg bg-tribal-black">
 <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium text-center">{period.label}</p>
 <p className={cn('text-sm font-bold text-center mt-0.5', over ? 'text-red-400' : 'text-white')}>
 {period.actual.toLocaleString()}
 </p>
 <div className="mt-1 h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
 <div
 className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
 style={{ width: `${pct}%` }}
 />
 </div>
 <p className="text-[10px] text-white/40 text-center mt-0.5">/ {period.limit.toLocaleString()}</p>
 </div>
 )
 })}
 </div>

 {/* Historique des retraits */}
 {data && data.expenses.length > 0 && (
 <div className="border-t border-white/[0.06] pt-2 max-h-32 overflow-y-auto space-y-1">
 {data.expenses.slice(0, 10).map(e => (
 <div key={e.id} className="flex items-center justify-between text-xs">
 <span className="text-white/50">
 {new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
 </span>
 <span className="text-white/60 truncate mx-2 flex-1">
 {e.memo || e.partnerName}
 </span>
 <span className="font-medium text-white flex-shrink-0">
 {(e.totals?.ttc || 0).toLocaleString()} F
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 )
 })}
 </div>

 {/* Total combine */}
 <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 rounded-xl /50 border border-white/[0.06]">
 <span className="text-xs sm:text-sm font-medium text-white/80 min-w-0 truncate">
 Total {interestDetails.monthName} (2 associes)
 </span>
 <span className="text-base sm:text-lg font-bold text-emerald-400 flex-shrink-0">
 {interestDetails.total.toLocaleString()} {settings.currency}
 </span>
 </div>
 </div>
 </motion.div>

 {/* Section Scan Wave */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.28 }}
 className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-900/20 via-sky-900/10 to-blue-900/20 p-5"
 >
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
 <Smartphone className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-white">
 Scan Wave
 </h3>
 <p className="text-sm text-white/50">
 Uploadez vos screenshots Wave pour pre-remplir automatiquement
 </p>
 {lastWaveExpense && (
 <p className="text-xs text-cyan-400 font-medium mt-0.5 truncate max-w-[260px] sm:max-w-none">
 Derniere : {lastWaveExpense.date} &middot; {lastWaveExpense.supplier} &middot; {lastWaveExpense.amount.toLocaleString('fr-FR')} FCFA{lastWaveExpense.category ? ` (${lastWaveExpense.category})` : ''}
 </p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2 flex-shrink-0">
 {waveScans.length > 0 && (
 <button
 onClick={resetWave}
 className="flex items-center gap-2 px-3 py-2.5 border border-white/[0.06] text-white/60 rounded-xl hover:bg-white/[0.06] transition-colors text-sm"
 >
 <X className="w-4 h-4" />
 <span className="hidden sm:inline">Tout effacer</span>
 </button>
 )}
 <input
 ref={waveFileRef}
 type="file"
 accept="image/*"
 multiple
 className="hidden"
 onChange={e => {
 if (e.target.files?.length) handleWaveUpload(e.target.files)
 e.target.value = ''
 }}
 />
 <button
 onClick={() => waveFileRef.current?.click()}
 disabled={waveExtracting}
 className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
 >
 {waveExtracting ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Camera className="w-4 h-4" />
 )}
 {waveExtracting ? 'Analyse...' : <><span className="hidden sm:inline">Scanner des screenshots</span><span className="sm:hidden">Scanner</span></>}
 </button>
 </div>
 </div>

 {/* Drop zone */}
 {waveScans.length === 0 && (
 <div
 className="mt-4 border-2 border-dashed border-cyan-500/30 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-900/20 transition-colors"
 onClick={() => waveFileRef.current?.click()}
 onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
 onDrop={e => {
 e.preventDefault()
 e.stopPropagation()
 if (e.dataTransfer.files?.length) handleWaveUpload(e.dataTransfer.files)
 }}
 onPaste={e => {
 const items = e.clipboardData?.items
 if (!items) return
 const files: File[] = []
 for (const item of Array.from(items)) {
 if (item.type.startsWith('image/')) {
 const file = item.getAsFile()
 if (file) files.push(file)
 }
 }
 if (files.length) handleWaveUpload(files)
 }}
 tabIndex={0}
 >
 <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
 <p className="text-sm text-white/60">
 Glissez vos screenshots ici, cliquez, ou <span className="font-medium text-cyan-400">collez (Ctrl+V)</span>
 </p>
 <p className="text-xs text-white/40 mt-1">Plusieurs fichiers acceptes — chaque capture peut contenir plusieurs transactions</p>
 </div>
 )}

 {/* Thumbnails des images importees */}
 {waveScans.length > 0 && (
 <div className="mt-4">
 <div className="flex items-center gap-3 overflow-x-auto pb-2">
 {waveScans.map(scan => {
 const validTx = scan.transactions.filter(t => !t.ignored).length
 const totalTx = scan.transactions.length
 return (
 <button
 key={scan.id}
 onClick={() => setWaveActiveScan(scan.id)}
 className={cn(
 'relative flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all',
 waveActiveScan === scan.id ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-105' : 'border-white/[0.06] hover:border-cyan-500/30',
 scan.status === 'error' && 'border-red-400',
 )}
 >
 <img src={scan.image} alt="" className="w-full h-full object-cover" />
 {scan.status === 'extracting' && (
 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
 <Loader2 className="w-5 h-5 text-white animate-spin" />
 </div>
 )}
 {scan.status === 'error' && (
 <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
 <X className="w-5 h-5 text-white" />
 </div>
 )}
 {scan.status === 'done' && (
 <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] font-medium text-center py-0.5">
 {validTx}/{totalTx} tx
 </div>
 )}
 </button>
 )
 })}
 {/* Bouton ajouter */}
 <button
 onClick={() => waveFileRef.current?.click()}
 className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-white/[0.08] flex items-center justify-center hover:border-cyan-500/40 hover:bg-cyan-900/20 transition-colors"
 >
 <Plus className="w-6 h-6 text-white/40" />
 </button>
 </div>

 {/* Panel de revue : Image + Transactions */}
 {activeScan && (
 <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
 {/* Apercu image */}
 <div className="lg:col-span-2">
 <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-tribal-black">
 <img
 src={activeScan.image}
 alt="Capture Wave"
 className="w-full max-h-[600px] object-contain"
 />
 </div>
 </div>

 {/* Transactions extraites */}
 <div className="lg:col-span-3 space-y-2">
 {activeScan.status === 'extracting' && (
 <div className="flex items-center justify-center gap-3 p-8 text-cyan-400">
 <Loader2 className="w-6 h-6 animate-spin" />
 <span className="font-medium">Extraction des transactions en cours...</span>
 </div>
 )}
 {activeScan.status === 'error' && (
 <div className="p-4 rounded-xl bg-red-950/30 border border-white/[0.06] text-red-400 text-sm">
 {activeScan.error}
 </div>
 )}
 {activeScan.status === 'done' && activeScan.transactions.length === 0 && (
 <div className="p-4 text-center text-white/50 text-sm">
 Aucune transaction detectee sur cette capture
 </div>
 )}

 {/* Barre d'actions groupees */}
 {activeScan.status === 'done' && activeScan.transactions.filter(t => !t.ignored).length > 0 && (
 <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-xl bg-tribal-black border border-white/[0.06]">
 {/* Checkbox tout selectionner */}
 {(() => {
 const validIds = activeScan.transactions.filter(t => !t.ignored).map(t => t.id)
 const allSelected = validIds.length > 0 && validIds.every(id => waveSelectedTxs.has(id))
 return (
 <button
 onClick={() => {
 setWaveSelectedTxs(prev => {
 const next = new Set(prev)
 if (allSelected) { validIds.forEach(id => next.delete(id)) }
 else { validIds.forEach(id => next.add(id)) }
 return next
 })
 }}
 className="flex items-center gap-1.5 text-xs text-white/60"
 >
 <div className={cn(
 'w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors',
 allSelected ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-white/[0.15]',
 )}>
 {allSelected && <Check className="w-3 h-3" />}
 </div>
 Tout
 </button>
 )
 })()}

 <div className="w-px h-5 bg-white/[0.1]" />

 {/* Appliquer categorie en masse */}
 {waveSelectedTxs.size > 0 && (
 <>
 <select
 className="px-2 py-1 border border-white/[0.06] bg-white/[0.03] text-white/80 rounded-lg text-xs"
 defaultValue=""
 onChange={e => {
 if (!e.target.value) return
 const cat = e.target.value
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => waveSelectedTxs.has(t.id) ? { ...t, category: cat } : t),
 })))
 e.target.value = ''
 }}
 >
 <option value="">Categorie...</option>
 {categories.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>

 <button
 onClick={() => {
 const selected = activeScan.transactions.filter(t => waveSelectedTxs.has(t.id) && !t.ignored)
 selected.forEach(tx => useWaveTransaction(tx))
 setWaveSelectedTxs(new Set())
 }}
 className="px-3 py-1.5 bg-tribal-accent hover:bg-tribal-accent-light text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
 >
 <Check className="w-3.5 h-3.5" />
 Valider ({waveSelectedTxs.size})
 </button>
 </>
 )}
 </div>
 )}

 {activeScan.transactions.map(tx => (
 <div
 key={tx.id}
 className={cn(
 'p-3 rounded-xl border transition-colors',
 tx.ignored ? 'border-white/[0.06] bg-tribal-black/50 opacity-50' : 'border-white/[0.06] bg-white/[0.03]',
 waveSelectedTxs.has(tx.id) && 'ring-2 ring-cyan-500/30 border-cyan-400',
 )}
 >
 <div className="flex items-start gap-3">
 {/* Checkbox selection */}
 {!tx.ignored && (
 <button
 onClick={() => {
 setWaveSelectedTxs(prev => {
 const next = new Set(prev)
 if (next.has(tx.id)) next.delete(tx.id)
 else next.add(tx.id)
 return next
 })
 }}
 className={cn(
 'mt-0.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
 waveSelectedTxs.has(tx.id) ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-white/[0.15]',
 )}
 >
 {waveSelectedTxs.has(tx.id) && <Check className="w-3 h-3" />}
 </button>
 )}
 <div className="flex-1 min-w-0">
 {/* Nom + montant */}
 <div className="flex items-center gap-2 flex-wrap">
 <span className={cn('font-medium text-sm', tx.ignored ? 'text-white/40' : 'text-white')}>
 {tx.recipientName || 'Inconnu'}
 </span>
 {tx.recipientPhone && (
 <span className="text-xs text-white/40 font-mono">{tx.recipientPhone}</span>
 )}
 <span className={cn('font-bold text-sm ml-auto flex-shrink-0', tx.ignored ? 'text-white/40' : 'text-cyan-400')}>
 {tx.amount?.toLocaleString('fr-FR')} F
 </span>
 </div>

 {/* Date + description */}
 <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
 {tx.date && <span>{new Date(tx.date).toLocaleDateString('fr-FR')}</span>}
 {tx.description && <span className="truncate">{tx.description}</span>}
 </div>

 {/* Ignore reason */}
 {tx.ignored && tx.ignoreReason && (
 <div className="mt-1 text-xs text-amber-400 italic">{tx.ignoreReason}</div>
 )}

 {/* Categorie + Fournisseur */}
 {!tx.ignored && (
 <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
 <Tag className="w-3 h-3 text-white/40 flex-shrink-0" />
 <select
 value={tx.category || 'Frais généraux'}
 onChange={e => {
 const val = e.target.value
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => t.id === tx.id ? { ...t, category: val } : t),
 })))
 }}
 className="px-1.5 py-0.5 border border-white/[0.06] bg-white/[0.03] text-white/80 rounded-md text-[11px] focus:ring-1 focus:ring-cyan-500"
 >
 {categories.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 )}

 {/* Fournisseur */}
 {!tx.ignored && (
 <div className="mt-2">
 {tx.match ? (
 <div className="flex items-center gap-1.5 text-xs text-emerald-400">
 <Link2 className="w-3 h-3" />
 <span className="font-medium">{tx.match.supplierName}</span>
 <button
 onClick={() => setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => t.id === tx.id
 ? { ...t, match: null, customSupplierName: tx.match?.supplierName || tx.recipientName || '' }
 : t
 ),
 })))}
 className="ml-1 p-0.5 text-white/40 hover:text-cyan-400 transition-colors"
 title="Changer le fournisseur"
 >
 <Pencil className="w-3 h-3" />
 </button>
 </div>
 ) : (
 <div className="space-y-1">
 <div className="relative">
 <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
 <input
 type="text"
 value={tx.customSupplierName ?? tx.recipientName ?? ''}
 onChange={e => {
 const val = e.target.value
 setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.map(t => t.id === tx.id ? { ...t, customSupplierName: val } : t),
 })))
 }}
 placeholder="Rechercher ou saisir un fournisseur..."
 className="w-full pl-7 pr-2 py-1.5 border border-white/[0.08] bg-white/[0.03] text-white rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
 />
 {waveMappingTx === tx.id && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-amber-400" />}
 </div>
 {/* Suggestions filtrees */}
 {(() => {
 const q = (tx.customSupplierName ?? tx.recipientName ?? '').toLowerCase().trim()
 const matches = q.length >= 1
 ? supplierPartners.filter(s => s.name.toLowerCase().includes(q)).slice(0, 6)
 : []
 return matches.length > 0 ? (
 <div className="flex flex-wrap gap-1">
 {matches.map(s => (
 <button
 key={s.id}
 onClick={() => handleWaveMapSupplier(tx.id, s.id)}
 className="px-2 py-0.5 text-amber-300 rounded-md text-[11px] font-medium hover:bg-amber-900/40 transition-colors"
 >
 {s.name}
 </button>
 ))}
 </div>
 ) : null
 })()}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-1 flex-shrink-0">
 {!tx.ignored && (
 <button
 onClick={() => useWaveTransaction(tx)}
 className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-600 text-white rounded-lg text-xs font-medium transition-colors"
 >
 Valider
 </button>
 )}
 <button
 onClick={() => setWaveScans(prev => prev.map(s => ({
 ...s,
 transactions: s.transactions.filter(t => t.id !== tx.id),
 })))}
 className="p-1 text-white/40 hover:text-red-500 transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </motion.div>

 {/* Formulaire nouvelle dépense */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="rounded-2xl border border-white/[0.06] bg-white/80 backdrop-blur-xl overflow-hidden"
 >
 <div className="p-5 border-b border-white/[0.06] bg-gradient-to-r from-red-900/20/50 to-rose-900/20/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
 <Plus className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-white">Nouvelle dépense</h3>
 <p className="text-sm text-white/50">
 Enregistrer un achat ou une charge
 </p>
 </div>
 </div>
 </div>

 <div className="p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5" /> Date
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all"
 type="date"
 value={date}
 onChange={e => setDate(e.target.value)}
 />
 </div>

 <div className="space-y-1.5 lg:col-span-2 xl:col-span-1">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <Tag className="w-3.5 h-3.5" /> Catégorie
 </label>
 <select
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all"
 value={category}
 onChange={e => setCategory(e.target.value)}
 >
 {categories.map(c => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5 xl:col-span-1">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5" /> Fournisseur
 </label>
 <SupplierCombobox
 suppliers={supplierPartners}
 supplierId={supplierId}
 supplierName={supplierName}
 customSupplier={customSupplier}
 onSelect={(id, name) => {
 setCustomSupplier(false)
 setSupplierId(id)
 setSupplierName(name)
 }}
 onCustom={name => {
 setCustomSupplier(true)
 setSupplierId('')
 setSupplierName(name)
 }}
 onClear={() => {
 setCustomSupplier(false)
 setSupplierId('')
 setSupplierName('')
 }}
 />
 </div>

 <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <FileText className="w-3.5 h-3.5" /> Description
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all"
 placeholder="Détail de la dépense"
 value={description}
 onChange={e => setDescription(e.target.value)}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <DollarSign className="w-3.5 h-3.5" /> Montant HT
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all text-right font-medium"
 type="number"
 step={1}
 value={ht}
 onChange={e => setHT(parseInt(e.target.value || '0', 10))}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 TVA %
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all text-center"
 type="number"
 step={0.01}
 value={tvaRate}
 onChange={e => setTvaRate(parseFloat(e.target.value || '0'))}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
 <Wallet className="w-3.5 h-3.5" /> Paiement
 </label>
 <select
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:ring-red-500/20 focus:border-red-500 transition-all"
 value={method}
 onChange={e => setMethod(e.target.value as any)}
 >
 {methods.map(m => (
 <option key={m} value={m}>
 {m}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Option Investissement */}
 <div className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-tribal-black">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
 isInvestment
 ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
 : 'bg-white/[0.1]'
 )}
 >
 <Package
 className={cn(
 'w-4 h-4',
 isInvestment ? 'text-white' : 'text-white/50'
 )}
 />
 </div>
 <div>
 <p className="text-sm font-medium text-white">
 Investissement (immobilisation)
 </p>
 <p className="text-xs text-white/50">
 Cochez si c'est un achat durable (ordinateur, machine, véhicule, mobilier...)
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsInvestment(!isInvestment)}
 className={cn(
 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
 isInvestment ? 'bg-purple-600' : 'bg-white/[0.1]'
 )}
 >
 <span
 className={cn(
 'inline-block h-4 w-4 transform rounded-full bg-white/[0.03] transition-transform shadow-sm',
 isInvestment ? 'translate-x-6' : 'translate-x-1'
 )}
 />
 </button>
 </div>

 {isInvestment && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mt-4 pt-4 border-t border-white/[0.06]"
 >
 <div className="flex items-center gap-4">
 <label className="text-sm text-white/60">
 Durée d'amortissement :
 </label>
 <select
 value={investmentDuration}
 onChange={e => setInvestmentDuration(parseInt(e.target.value, 10))}
 className="px-3 py-2 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl focus:outline-none focus:border-tribal-accent/40/20 focus:border-purple-500 transition-all"
 >
 <option value={3}>3 ans (matériel informatique)</option>
 <option value={5}>5 ans (mobilier, équipement)</option>
 <option value={10}>10 ans (véhicules, machines)</option>
 <option value={20}>20 ans (bâtiments)</option>
 </select>
 </div>
 </motion.div>
 )}
 </div>

 {/* Option Charges Sociales */}
 <div className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-tribal-black">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
 isChargesSociales
 ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
 : 'bg-white/[0.1]'
 )}
 >
 <Users
 className={cn(
 'w-4 h-4',
 isChargesSociales ? 'text-white' : 'text-white/50'
 )}
 />
 </div>
 <div>
 <p className="text-sm font-medium text-white">
 Charges sociales
 </p>
 <p className="text-xs text-white/50">
 Cochez s'il s'agit de cotisations sociales (CNPS, mutuelle, retraite,
 assurance...)
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsChargesSociales(!isChargesSociales)}
 className={cn(
 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
 isChargesSociales ? 'bg-teal-600' : 'bg-white/[0.1]'
 )}
 >
 <span
 className={cn(
 'inline-block h-4 w-4 transform rounded-full bg-white/[0.03] transition-transform shadow-sm',
 isChargesSociales ? 'translate-x-6' : 'translate-x-1'
 )}
 />
 </button>
 </div>
 </div>

 {/* Footer avec totaux */}
 <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex flex-wrap items-center gap-2 sm:gap-4">
 <div className="px-3 sm:px-4 py-2 rounded-xl bg-tribal-black">
 <span className="text-xs text-white/50">HT</span>
 <p className="font-semibold text-sm sm:text-base text-white">
 {totals.ht.toLocaleString()} {settings.currency}
 </p>
 </div>
 <div className="px-3 sm:px-4 py-2 rounded-xl bg-amber-900/20">
 <span className="text-xs text-amber-400">TVA</span>
 <p className="font-semibold text-sm sm:text-base text-amber-400">
 {totals.tva.toLocaleString()} {settings.currency}
 </p>
 </div>
 <div className="px-3 sm:px-4 py-2 rounded-xl bg-red-950/30">
 <span className="text-xs text-red-400">TTC</span>
 <p className="font-semibold text-sm sm:text-base text-red-400">
 {totals.ttc.toLocaleString()} {settings.currency}
 </p>
 </div>
 </div>
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={onSave}
 className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all"
 >
 Enregistrer la dépense
 </motion.button>
 </div>
 </div>
 </motion.div>

 {/* Liste des dépenses */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="rounded-2xl border border-white/[0.06] bg-white/80 backdrop-blur-xl overflow-hidden"
 >
 <div className="p-5 border-b border-white/[0.06]">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg flex-shrink-0">
 <Receipt className="w-5 h-5 text-white" />
 </div>
 <div className="min-w-0">
 <h3 className="font-semibold text-white">
 Historique des dépenses
 </h3>
 <p className="text-sm text-white/50">
 {expenseList.length} dépense(s) enregistrée(s)
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {selectedExpenses.size > 0 && (
 <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/20 border border-white/[0.06] rounded-xl">
 <span className="text-xs font-medium text-cyan-400">{selectedExpenses.size} select.</span>
 <select
 className="px-2 py-1 border border-cyan-500/30 bg-white/[0.03] text-white/80 rounded-lg text-xs min-w-0 max-w-[140px]"
 defaultValue=""
 onChange={e => {
 if (!e.target.value) return
 const newCat = e.target.value
 selectedExpenses.forEach(id => {
 updateInvoice(id, { expenseCategory: newCat } as any)
 })
 setSelectedExpenses(new Set())
 e.target.value = ''
 }}
 >
 <option value="">Changer categorie...</option>
 {categories.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 <button
 onClick={() => setSelectedExpenses(new Set())}
 className="p-1 text-white/40 hover:text-red-500 transition-colors"
 title="Deselectionner"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 </div>
 <button
 onClick={() => loadFromApi()}
 className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
 title="Rafraîchir depuis le serveur"
 >
 <RefreshCw className="w-4 h-4" />
 <span className="hidden sm:inline">Rafraîchir</span>
 </button>
 </div>
 </div>

 {/* Desktop Table */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-tribal-black border-b border-white/[0.06]">
 <th className="px-2 py-4 w-10">
 <button
 onClick={() => {
 const allIds = expenseList.map(e => e.id)
 setSelectedExpenses(prev => {
 const allSelected = allIds.every(id => prev.has(id))
 if (allSelected) return new Set()
 return new Set(allIds)
 })
 }}
 className={cn(
 'w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors mx-auto',
 expenseList.length > 0 && expenseList.every(e => selectedExpenses.has(e.id))
 ? 'bg-cyan-600 border-cyan-600 text-white'
 : 'border-white/[0.15]',
 )}
 >
 {expenseList.length > 0 && expenseList.every(e => selectedExpenses.has(e.id)) && <Check className="w-3 h-3" />}
 </button>
 </th>
 <th className="px-3 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 N°
 </th>
 <th className="px-3 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 Date
 </th>
 <th className="px-3 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 Catégorie
 </th>
 <th className="px-3 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
 Fournisseur / Description
 </th>
 <th className="px-3 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
 HT
 </th>
 <th className="px-3 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
 TVA
 </th>
 <th className="px-3 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
 TTC
 </th>
 <th className="px-3 py-4 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
 Paiement
 </th>
 <th className="px-3 py-4 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <AnimatePresence>
 {expenseList.map((i, idx) => (
 <motion.tr
 key={i.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ delay: idx * 0.02 }}
 className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
 >
 <td className="px-2 py-4 w-10">
 <button
 onClick={() => {
 setSelectedExpenses(prev => {
 const next = new Set(prev)
 if (next.has(i.id)) next.delete(i.id)
 else next.add(i.id)
 return next
 })
 }}
 className={cn(
 'w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors mx-auto',
 selectedExpenses.has(i.id) ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-white/[0.15]',
 )}
 >
 {selectedExpenses.has(i.id) && <Check className="w-3 h-3" />}
 </button>
 </td>
 <td className="px-3 py-4 text-sm text-white/60 font-medium">
 {expenseList.length - idx}
 </td>
 <td className="px-3 py-4 text-sm text-white font-medium">
 {new Date(i.date).toLocaleDateString('fr-FR')}
 </td>
 <td className="px-3 py-4">
 <CategoryBadge category={i.expenseCategory || 'Autre'} />
 </td>
 <td className="px-3 py-4 text-sm text-white/80">
 <div className="flex flex-col gap-1">
 <span className="font-medium">{i.partnerName || '-'}</span>
 {i.memo && (
 <span className="text-xs text-white/50">
 {i.memo}
 </span>
 )}
 <div className="flex items-center gap-2 flex-wrap">
 {i.isInvestment && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-purple-400">
 <Package className="w-3 h-3" />
 Invest. {i.investmentDuration}ans
 </span>
 )}
 {i.isChargesSociales && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-teal-400">
 <Users className="w-3 h-3" />
 Charges sociales
 </span>
 )}
 </div>
 </div>
 </td>
 <td className="px-3 py-4 text-sm text-right font-medium text-white">
 {i.totals.ht.toLocaleString()}
 </td>
 <td className="px-3 py-4 text-sm text-right text-white/50">
 {i.totals.tva.toLocaleString()}
 </td>
 <td className="px-3 py-4 text-sm text-right font-semibold text-red-400">
 {i.totals.ttc.toLocaleString()} {settings.currency}
 </td>
 <td className="px-3 py-4 text-center">
 {i.paymentMethod ? (
 <span
 className={cn(
 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
 i.paymentMethod === 'WAVE' &&
 ' text-cyan-400',
 i.paymentMethod === 'ORANGE_MONEY' &&
 ' text-orange-400',
 i.paymentMethod === 'MTN_MONEY' &&
 ' text-yellow-400',
 i.paymentMethod === 'CAISSE' &&
 ' text-green-400',
 i.paymentMethod === 'BANQUE' &&
 ' text-blue-400',
 !['WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'CAISSE', 'BANQUE'].includes(
 i.paymentMethod
 ) && 'bg-tribal-black text-white/80'
 )}
 >
 {i.paymentMethod === 'WAVE' && '📱'}
 {i.paymentMethod === 'ORANGE_MONEY' && '🟠'}
 {i.paymentMethod === 'MTN_MONEY' && '🟡'}
 {i.paymentMethod === 'CAISSE' && '💵'}
 {i.paymentMethod === 'BANQUE' && '🏦'}
 {i.paymentMethod === 'WAVE'
 ? 'Wave'
 : i.paymentMethod === 'ORANGE_MONEY'
 ? 'OM'
 : i.paymentMethod === 'MTN_MONEY'
 ? 'MTN'
 : i.paymentMethod === 'CAISSE'
 ? 'Espèces'
 : i.paymentMethod === 'BANQUE'
 ? 'Banque'
 : i.paymentMethod}
 </span>
 ) : (
 <span className="text-xs text-white/50">—</span>
 )}
 </td>
 <td className="px-3 py-4 text-center">
 <div className="flex items-center justify-center gap-1">
 <button
 onClick={() => openEditModal(i)}
 className="p-2 text-blue-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
 title="Modifier"
 >
 <Pencil className="w-4 h-4" />
 </button>
 <button
 onClick={() => {
 const numDepense = expenseList.length - idx
 const confirmMsg = `⚠️ SUPPRIMER cette dépense ?\n\n📄 N°: ${numDepense}\n🏢 Fournisseur: ${i.partnerName || 'N/A'}\n📁 Catégorie: ${i.expenseCategory || 'N/A'}\n💰 Montant: ${i.totals.ttc.toLocaleString()} ${settings.currency}\n📅 Date: ${new Date(i.date).toLocaleDateString('fr-FR')}\n\nCette action est irréversible.`
 if (confirm(confirmMsg)) {
 deleteInvoice(i.id)
 // Rafraîchir depuis l'API après suppression
 setTimeout(() => loadFromApi(), 500)
 }
 }}
 className="p-2 text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
 title="Supprimer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>

 {/* Mobile Cards */}
 <div className="md:hidden divide-y divide-slate-100">
 <AnimatePresence>
 {expenseList.map((i, idx) => (
 <motion.div
 key={i.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ delay: idx * 0.02 }}
 className="p-4 hover:bg-white/[0.06] transition-colors"
 >
 <div className="flex items-start justify-between mb-2">
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <p className="font-medium text-white">
 {i.partnerName || 'Dépense'}
 </p>
 {i.isInvestment && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-purple-400">
 <Package className="w-3 h-3" />
 {i.investmentDuration}ans
 </span>
 )}
 {i.isChargesSociales && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-teal-400">
 <Users className="w-3 h-3" />
 Soc.
 </span>
 )}
 </div>
 <p className="text-sm text-white/50">
 {new Date(i.date).toLocaleDateString('fr-FR')}
 </p>
 </div>
 <CategoryBadge category={i.expenseCategory || 'Autre'} />
 </div>
 <div className="flex items-center justify-between gap-2">
 <div className="text-xs text-white/50 min-w-0 truncate">
 HT: {i.totals.ht.toLocaleString()} • TVA: {i.totals.tva.toLocaleString()}
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <p className="text-base sm:text-lg font-bold text-red-400">
 {i.totals.ttc.toLocaleString()} {settings.currency}
 </p>
 <button
 onClick={() => {
 const numDepense = expenseList.length - idx
 const confirmMsg = `⚠️ SUPPRIMER ?\n\nN°${numDepense} - ${i.partnerName || 'Dépense'}\n${i.totals.ttc.toLocaleString()} ${settings.currency}`
 if (confirm(confirmMsg)) {
 deleteInvoice(i.id)
 setTimeout(() => loadFromApi(), 500)
 }
 }}
 className="p-2 text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
 title="Supprimer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {expenseList.length === 0 && (
 <div className="p-12 text-center">
 <CreditCard className="w-12 h-12 mx-auto text-white/50 mb-4" />
 <p className="text-white/50">Aucune dépense enregistrée</p>
 </div>
 )}
 </motion.div>

 {/* Modal d'édition */}
 <AnimatePresence>
 {editingExpense && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
 onClick={() => setEditingExpense(null)}
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-white/[0.03] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
 <Pencil className="w-5 h-5 text-blue-400" />
 Modifier la dépense
 </h3>
 <button
 onClick={() => setEditingExpense(null)}
 className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-5 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Date
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 type="date"
 value={editDate}
 onChange={e => setEditDate(e.target.value)}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Catégorie
 </label>
 <select
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 value={editCategory}
 onChange={e => setEditCategory(e.target.value)}
 >
 {categories.map(c => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Fournisseur
 </label>
 <SupplierCombobox
 suppliers={supplierPartners}
 supplierId={editSupplierId}
 supplierName={editSupplierName}
 customSupplier={editCustomSupplier}
 onSelect={(id, name) => {
 setEditCustomSupplier(false)
 setEditSupplierId(id)
 setEditSupplierName(name)
 }}
 onCustom={name => {
 setEditCustomSupplier(true)
 setEditSupplierId('')
 setEditSupplierName(name)
 }}
 onClear={() => {
 setEditCustomSupplier(false)
 setEditSupplierId('')
 setEditSupplierName('')
 }}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Description
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 placeholder="Détail de la dépense"
 value={editDescription}
 onChange={e => setEditDescription(e.target.value)}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Montant HT
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl text-right"
 type="number"
 value={editHT}
 onChange={e => setEditHT(parseInt(e.target.value || '0', 10))}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 TVA %
 </label>
 <input
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl text-center"
 type="number"
 step={0.01}
 value={editTvaRate}
 onChange={e => setEditTvaRate(parseFloat(e.target.value || '0'))}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60">
 Mode de paiement
 </label>
 <select
 className="w-full px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] text-white rounded-xl"
 value={editPaymentMethod}
 onChange={e => setEditPaymentMethod(e.target.value)}
 >
 {methods.map(m => (
 <option key={m} value={m}>
 {m.replace('_', ' ')}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="flex items-center gap-4 pt-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={editIsInvestment}
 onChange={e => setEditIsInvestment(e.target.checked)}
 className="w-4 h-4 rounded border-white/[0.08] text-purple-400 focus:border-tribal-accent/40"
 />
 <span className="text-sm text-white/80">
 Investissement
 </span>
 </label>
 {editIsInvestment && (
 <div className="flex items-center gap-2">
 <input
 type="number"
 min={1}
 max={20}
 value={editInvestmentDuration}
 onChange={e =>
 setEditInvestmentDuration(parseInt(e.target.value || '5', 10))
 }
 className="w-16 px-2 py-1 border border-white/[0.06] rounded text-center"
 />
 <span className="text-sm text-white/50">ans</span>
 </div>
 )}
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={editIsChargesSociales}
 onChange={e => setEditIsChargesSociales(e.target.checked)}
 className="w-4 h-4 rounded border-white/[0.08] text-teal-400 focus:ring-teal-500"
 />
 <span className="text-sm text-white/80">
 Charges sociales
 </span>
 </label>
 </div>
 </div>

 <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
 <button
 onClick={() => setEditingExpense(null)}
 className="px-4 py-2 text-white/60 hover:bg-white/[0.06] rounded-xl transition-colors"
 >
 Annuler
 </button>
 <button
 onClick={onSaveEdit}
 className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
 >
 Enregistrer
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}

export default DepensesPage
