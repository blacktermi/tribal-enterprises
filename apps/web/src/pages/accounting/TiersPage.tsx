import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAccountingStore } from '../../store/accounting'
import { useAccountingData } from '../../lib/hooks/useAccountingData'
import type { Partner, PartnerType } from '../../accounting/types'
import {
 Users,
 Building2,
 UserPlus,
 Search,
 Edit,
 Phone,
 Mail,
 MapPin,
 FileText,
 CreditCard,
 Clock,
 X,
 Save,
 ChevronDown,
 AlertCircle,
 Trash2,
} from 'lucide-react'

// Régimes fiscaux Côte d'Ivoire
const REGIMES_FISCAUX = [
 { value: 'reel-normal', label: 'Réel Normal' },
 { value: 'reel-simplifie', label: 'Réel Simplifié' },
 { value: 'micro-entreprise', label: 'Micro-entreprise' },
 { value: 'particulier', label: 'Particulier' },
] as const

// Délais de paiement standards
const DELAIS_PAIEMENT = [
 { value: 0, label: 'Comptant' },
 { value: 15, label: '15 jours' },
 { value: 30, label: '30 jours' },
 { value: 45, label: '45 jours' },
 { value: 60, label: '60 jours' },
 { value: 90, label: '90 jours' },
]

type PartnerFormData = Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>

const emptyForm: PartnerFormData = {
 name: '',
 type: 'fournisseur',
 phone: '',
 email: '',
 address: '',
 city: 'Abidjan',
 country:"Côte d'Ivoire",
 compteContribuable: '',
 rccm: '',
 regimeFiscal: 'particulier',
 delaiPaiement: 0,
 plafondCredit: 0,
 notes: '',
 isActive: true,
}

export const TiersPage: React.FC = () => {
 const rawPartners = useAccountingStore(s => s.partners)
 const invoices = useAccountingStore(s => s.invoices)
 const addPartner = useAccountingStore(s => s.addPartner)
 const updatePartner = useAccountingStore(s => s.updatePartner)
 const deletePartner = useAccountingStore(s => s.deletePartner)
 const clearPartners = useAccountingStore(s => s.clearPartners)
 const settings = useAccountingStore(s => s.settings)
 const currency = settings.currency

 // Revenus API pour calculer les creances clients reelles
 const { data: apiRevenues } = useAccountingData({ autoSync: false })

 // Normaliser les partenaires pour garantir que chaque partenaire a un type
 const partners = useMemo(() => {
 return rawPartners.map(p => ({
 ...p,
 type: p.type || ('client' as const),
 }))
 }, [rawPartners])

 // États
 const [filterType, setFilterType] = useState<'all' | PartnerType>('all')
 const [search, setSearch] = useState('')
 const [showForm, setShowForm] = useState(false)
 const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
 const [form, setForm] = useState<PartnerFormData>(emptyForm)
 const [expandedId, setExpandedId] = useState<string | null>(null)

 // Filtrage
 const filteredPartners = useMemo(() => {
 return partners
 .filter(p => {
 // Le type est garanti par la normalisation ci-dessus
 if (filterType !== 'all' && p.type !== filterType) return false
 if (search) {
 const q = search.toLowerCase()
 return (
 p.name.toLowerCase().includes(q) ||
 p.phone?.toLowerCase().includes(q) ||
 p.email?.toLowerCase().includes(q) ||
 p.compteContribuable?.toLowerCase().includes(q) ||
 p.rccm?.toLowerCase().includes(q)
 )
 }
 return true
 })
 .sort((a, b) => a.name.localeCompare(b.name))
 }, [partners, filterType, search])

 // Calcul du solde par partenaire (match par partnerId OU partnerName)
 const getPartnerBalance = (partnerId: string, partnerName: string) => {
 const partnerInvoices = invoices.filter(
 inv => inv.partnerId === partnerId || inv.partnerName === partnerName
 )
 let total = 0
 partnerInvoices.forEach(inv => {
 if (inv.type === 'sale') {
 total += inv.paid ? 0 : inv.totals.ttc // Créance client
 } else if (inv.type === 'purchase' || inv.type === 'expense') {
 total -= inv.paid ? 0 : inv.totals.ttc // Dette fournisseur
 }
 })
 return total
 }

 // Stats - les partenaires sont déjà normalisés
 // Creances calculees depuis les revenus API (plus fiable que le store local)
 const apiCreances = useMemo(() => {
 let total = 0
 for (const rev of apiRevenues) {
 if (!rev.isPaid && rev.balance > 0) {
 total += rev.balance
 }
 }
 return total
 }, [apiRevenues])

 const stats = useMemo(() => {
 const clients = partners.filter(p => p.type === 'client')
 const fournisseurs = partners.filter(p => p.type === 'fournisseur')
 const dettes = fournisseurs.reduce(
 (sum, f) => sum + Math.abs(Math.min(0, getPartnerBalance(f.id, f.name))),
 0
 )
 return {
 totalClients: clients.length,
 totalFournisseurs: fournisseurs.length,
 creances: apiCreances,
 dettes,
 }
 }, [partners, invoices, apiCreances])

 // Handlers
 const openNewForm = (type: PartnerType) => {
 setForm({ ...emptyForm, type })
 setEditingPartner(null)
 setShowForm(true)
 }

 const openEditForm = (partner: Partner) => {
 setForm({
 name: partner.name,
 type: partner.type,
 phone: partner.phone || '',
 email: partner.email || '',
 address: partner.address || '',
 city: partner.city || 'Abidjan',
 country: partner.country ||"Côte d'Ivoire",
 compteContribuable: partner.compteContribuable || '',
 rccm: partner.rccm || '',
 regimeFiscal: partner.regimeFiscal || 'particulier',
 delaiPaiement: partner.delaiPaiement || 0,
 plafondCredit: partner.plafondCredit || 0,
 notes: partner.notes || '',
 isActive: partner.isActive !== false,
 })
 setEditingPartner(partner)
 setShowForm(true)
 }

 const handleSave = () => {
 if (!form.name.trim()) return

 if (editingPartner?.id) {
 // Mode édition : mettre à jour
 updatePartner(editingPartner.id, {
 ...form,
 updatedAt: new Date().toISOString(),
 })
 } else {
 // Mode création : ajouter
 const partnerData: Omit<Partner, 'id'> & { id?: string } = {
 ...form,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 }
 addPartner(partnerData)
 }

 setShowForm(false)
 setForm(emptyForm)
 setEditingPartner(null)
 }

 const handleCancel = () => {
 setShowForm(false)
 setForm(emptyForm)
 setEditingPartner(null)
 }

 // Historique des factures pour un partenaire (match par partnerId OU partnerName)
 const getPartnerInvoices = (partnerId: string, partnerName: string) => {
 return invoices
 .filter(inv => inv.partnerId === partnerId || inv.partnerName === partnerName)
 .sort((a, b) => b.date.localeCompare(a.date))
 .slice(0, 5) // 5 dernières
 }

 return (
 <div className="space-y-6">
 {/* Header descriptif */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
 <div className="relative flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Tiers</h1>
 <p className="text-white/70 text-sm">
 Gérez votre carnet d’adresses : clients, fournisseurs et partenaires avec leurs
 coordonnées
 </p>
 </div>
 </div>
 </motion.div>

 {/* Header Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
 <div className="flex items-center gap-2 mb-1">
 <Users className="w-5 h-5 opacity-80" />
 <span className="text-sm opacity-80">Clients</span>
 </div>
 <div className="text-2xl font-bold">{stats.totalClients}</div>
 </div>
 <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
 <div className="flex items-center gap-2 mb-1">
 <Building2 className="w-5 h-5 opacity-80" />
 <span className="text-sm opacity-80">Fournisseurs</span>
 </div>
 <div className="text-2xl font-bold">{stats.totalFournisseurs}</div>
 </div>
 <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
 <div className="flex items-center gap-2 mb-1">
 <CreditCard className="w-5 h-5 opacity-80" />
 <span className="text-sm opacity-80">Créances clients</span>
 </div>
 <div className="text-xl font-bold">
 {stats.creances.toLocaleString()} {currency}
 </div>
 </div>
 <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white">
 <div className="flex items-center gap-2 mb-1">
 <AlertCircle className="w-5 h-5 opacity-80" />
 <span className="text-sm opacity-80">Dettes fournisseurs</span>
 </div>
 <div className="text-xl font-bold">
 {stats.dettes.toLocaleString()} {currency}
 </div>
 </div>
 </div>

 {/* Toolbar */}
 <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
 {/* Filtres */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setFilterType('all')}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
 filterType === 'all'
 ? 'bg-tribal-black text-white'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 Tous ({partners.length})
 </button>
 <button
 onClick={() => setFilterType('client')}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
 filterType === 'client'
 ? 'bg-tribal-accent text-white'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 <Users className="w-4 h-4 inline mr-1" />
 Clients ({stats.totalClients})
 </button>
 <button
 onClick={() => setFilterType('fournisseur')}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
 filterType === 'fournisseur'
 ? 'bg-orange-600 text-white'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 <Building2 className="w-4 h-4 inline mr-1" />
 Fournisseurs ({stats.totalFournisseurs})
 </button>
 </div>

 {/* Recherche */}
 <div className="flex-1 min-w-[200px]">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher par nom, téléphone, NCC, RCCM..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/40"
 />
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2">
 {partners.length > 0 && (
 <button
 onClick={() => {
 if (
 confirm(`Êtes-vous sûr de vouloir supprimer tous les ${partners.length} tiers ?`)
 ) {
 clearPartners()
 }
 }}
 className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition"
 >
 <Trash2 className="w-4 h-4" />
 Vider tout
 </button>
 )}
 <button
 onClick={() => openNewForm('client')}
 className="flex items-center gap-2 px-4 py-2 bg-tribal-accent hover:bg-tribal-accent-light text-white rounded-lg font-medium transition"
 >
 <UserPlus className="w-4 h-4" />
 Nouveau Client
 </button>
 <button
 onClick={() => openNewForm('fournisseur')}
 className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
 >
 <Building2 className="w-4 h-4" />
 Nouveau Fournisseur
 </button>
 </div>
 </div>

 {/* Liste des tiers */}
 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 {filteredPartners.length === 0 ? (
 <div className="p-8 text-center text-white/50">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p>Aucun tiers trouvé</p>
 <p className="text-sm mt-1">Commencez par ajouter un client ou un fournisseur</p>
 </div>
 ) : (
 <div className="divide-y divide-white/[0.06]">
 {filteredPartners.map(partner => {
 const balance = getPartnerBalance(partner.id, partner.name)
 const isExpanded = expandedId === partner.id
 const partnerInvoices = isExpanded ? getPartnerInvoices(partner.id, partner.name) : []

 return (
 <div
 key={partner.id}
 className="hover:bg-white/[0.06] transition"
 >
 {/* Ligne principale */}
 <div
 className="p-4 flex items-center gap-4 cursor-pointer"
 onClick={() => setExpandedId(isExpanded ? null : partner.id)}
 >
 {/* Avatar/Icône */}
 <div
 className={`w-12 h-12 rounded-xl flex items-center justify-center ${
 partner.type === 'client'
 ? ' text-blue-400'
 : ' text-orange-400'
 }`}
 >
 {partner.type === 'client' ? (
 <Users className="w-6 h-6" />
 ) : (
 <Building2 className="w-6 h-6" />
 )}
 </div>

 {/* Infos principales */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-white truncate">
 {partner.name}
 </h3>
 <span
 className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 partner.type === 'client'
 ? ' text-blue-400'
 : ' text-orange-400'
 }`}
 >
 {partner.type === 'client' ? 'Client' : 'Fournisseur'}
 </span>
 {partner.isActive === false && (
 <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-tribal-black text-white/50">
 Inactif
 </span>
 )}
 </div>
 <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
 {partner.phone && (
 <span className="flex items-center gap-1">
 <Phone className="w-3 h-3" /> {partner.phone}
 </span>
 )}
 {partner.email && (
 <span className="flex items-center gap-1">
 <Mail className="w-3 h-3" /> {partner.email}
 </span>
 )}
 {partner.city && (
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3" /> {partner.city}
 </span>
 )}
 </div>
 </div>

 {/* Solde */}
 <div className="text-right">
 <div
 className={`text-lg font-bold ${
 balance > 0
 ? 'text-emerald-400'
 : balance < 0
 ? 'text-rose-400'
 : 'text-white/50'
 }`}
 >
 {balance.toLocaleString()} {currency}
 </div>
 <div className="text-xs text-white/50">
 {balance > 0 ? 'À recevoir' : balance < 0 ? 'À payer' : 'Soldé'}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
 <button
 onClick={() => openEditForm(partner)}
 className="p-2 hover:bg-white/[0.06] rounded-lg transition"
 title="Modifier"
 >
 <Edit className="w-4 h-4 text-white/50" />
 </button>
 <button
 onClick={() => {
 if (
 confirm(
 `Supprimer ${partner.type === 'client' ? 'le client' : 'le fournisseur'}"${partner.name}" ?`
 )
 ) {
 deletePartner(partner.id)
 }
 }}
 className="p-2 hover: rounded-lg transition"
 title="Supprimer"
 >
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 <ChevronDown
 className={`w-5 h-5 text-white/50 transition ${isExpanded ? 'rotate-180' : ''}`}
 />
 </div>
 </div>

 {/* Détails expandés */}
 {isExpanded && (
 <div className="px-4 pb-4 bg-tribal-black border-t border-white/[0.04]">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
 {/* Infos fiscales */}
 <div className="space-y-3">
 <h4 className="font-medium text-white/80 flex items-center gap-2">
 <FileText className="w-4 h-4" /> Informations fiscales
 </h4>
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div className="text-white/50">
 N° Compte Contribuable:
 </div>
 <div className="font-medium text-white">
 {partner.compteContribuable || '-'}
 </div>
 <div className="text-white/50">RCCM:</div>
 <div className="font-medium text-white">
 {partner.rccm || '-'}
 </div>
 <div className="text-white/50">Régime fiscal:</div>
 <div className="font-medium text-white">
 {REGIMES_FISCAUX.find(r => r.value === partner.regimeFiscal)?.label ||
 '-'}
 </div>
 </div>
 </div>

 {/* Conditions commerciales */}
 <div className="space-y-3">
 <h4 className="font-medium text-white/80 flex items-center gap-2">
 <Clock className="w-4 h-4" /> Conditions commerciales
 </h4>
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div className="text-white/50">
 Délai de paiement:
 </div>
 <div className="font-medium text-white">
 {partner.delaiPaiement
 ? `${partner.delaiPaiement} jours`
 : 'Comptant'}
 </div>
 <div className="text-white/50">
 Plafond crédit:
 </div>
 <div className="font-medium text-white">
 {partner.plafondCredit
 ? `${partner.plafondCredit.toLocaleString()} ${currency}`
 : 'Non défini'}
 </div>
 <div className="text-white/50">Adresse:</div>
 <div className="font-medium text-white">
 {partner.address || '-'}
 </div>
 </div>
 </div>
 </div>

 {/* Dernières factures */}
 {partnerInvoices.length > 0 && (
 <div className="mt-4 pt-4 border-t border-white/[0.06]">
 <h4 className="font-medium text-white/80 mb-3">
 Dernières factures
 </h4>
 <div className="space-y-2">
 {partnerInvoices.map(inv => (
 <div
 key={inv.id}
 className="flex items-center justify-between text-sm p-2 bg-white/[0.03] rounded-lg"
 >
 <span className="font-mono text-white/60">
 {inv.id}
 </span>
 <span className="text-white/50">
 {new Date(inv.date).toLocaleDateString('fr-FR')}
 </span>
 <span className="font-medium">
 {inv.totals.ttc.toLocaleString()} {currency}
 </span>
 <span
 className={`px-2 py-0.5 rounded-full text-xs ${
 inv.paid
 ? ' text-emerald-400'
 : ' text-amber-400'
 }`}
 >
 {inv.paid ? 'Payée' : 'En attente'}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Notes */}
 {partner.notes && (
 <div className="mt-4 pt-4 border-t border-white/[0.06]">
 <h4 className="font-medium text-white/80 mb-2">
 Notes
 </h4>
 <p className="text-sm text-white/60">
 {partner.notes}
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 )
 })}
 </div>
 )}
 </div>

 {/* Modal Formulaire */}
 {showForm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white/[0.03] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 {/* Header */}
 <div
 className={`p-6 border-b border-white/[0.06] ${
 form.type === 'client'
 ? 'bg-blue-900/20'
 : 'bg-orange-900/20'
 }`}
 >
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-white flex items-center gap-3">
 {form.type === 'client' ? (
 <Users className="w-6 h-6 text-blue-400" />
 ) : (
 <Building2 className="w-6 h-6 text-orange-400" />
 )}
 {editingPartner ? 'Modifier' : 'Nouveau'}{' '}
 {form.type === 'client' ? 'Client' : 'Fournisseur'}
 </h2>
 <button
 onClick={handleCancel}
 className="p-2 hover:bg-white/[0.06] rounded-lg"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Form */}
 <div className="p-6 space-y-6">
 {/* Type */}
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setForm(f => ({ ...f, type: 'client' }))}
 className={`flex-1 p-4 rounded-xl border-2 transition ${
 form.type === 'client'
 ? 'border-blue-500 bg-blue-900/20'
 : 'border-white/[0.06] hover:border-white/[0.08]'
 }`}
 >
 <Users
 className={`w-6 h-6 mx-auto mb-2 ${form.type === 'client' ? 'text-blue-400' : 'text-white/50'}`}
 />
 <div
 className={`font-medium ${form.type === 'client' ? 'text-blue-400' : 'text-white/50'}`}
 >
 Client
 </div>
 </button>
 <button
 type="button"
 onClick={() => setForm(f => ({ ...f, type: 'fournisseur' }))}
 className={`flex-1 p-4 rounded-xl border-2 transition ${
 form.type === 'fournisseur'
 ? 'border-orange-500 bg-orange-900/20'
 : 'border-white/[0.06] hover:border-white/[0.08]'
 }`}
 >
 <Building2
 className={`w-6 h-6 mx-auto mb-2 ${form.type === 'fournisseur' ? 'text-orange-400' : 'text-white/50'}`}
 />
 <div
 className={`font-medium ${form.type === 'fournisseur' ? 'text-orange-400' : 'text-white/50'}`}
 >
 Fournisseur
 </div>
 </button>
 </div>

 {/* Infos principales */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-white/80 mb-1">
 Nom / Raison sociale *
 </label>
 <input
 type="text"
 value={form.name}
 onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="Ex: TRIBAL PRINT SARL"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Téléphone
 </label>
 <input
 type="tel"
 value={form.phone}
 onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="+225 07 XX XX XX XX"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Email
 </label>
 <input
 type="email"
 value={form.email}
 onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="contact@exemple.ci"
 />
 </div>
 </div>

 {/* Adresse */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-white/80 mb-1">
 Adresse
 </label>
 <input
 type="text"
 value={form.address}
 onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="Cocody, Rue des Jardins"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Ville
 </label>
 <input
 type="text"
 value={form.city}
 onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="Abidjan"
 />
 </div>
 </div>

 {/* Infos fiscales OHADA */}
 <div className="p-4 bg-tribal-black rounded-xl space-y-4">
 <h3 className="font-medium text-white/80 flex items-center gap-2">
 <FileText className="w-4 h-4" /> Informations fiscales (OHADA)
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 N° Compte Contribuable (NCC)
 </label>
 <input
 type="text"
 value={form.compteContribuable}
 onChange={e => setForm(f => ({ ...f, compteContribuable: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="CI-ABJ-XXXX-XXXX"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 RCCM
 </label>
 <input
 type="text"
 value={form.rccm}
 onChange={e => setForm(f => ({ ...f, rccm: e.target.value }))}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="CI-ABJ-2024-B-XXXXX"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-white/80 mb-1">
 Régime fiscal
 </label>
 <select
 value={form.regimeFiscal}
 onChange={e =>
 setForm(f => ({
 ...f,
 regimeFiscal: e.target.value as Partner['regimeFiscal'],
 }))
 }
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 >
 {REGIMES_FISCAUX.map(r => (
 <option key={r.value} value={r.value}>
 {r.label}
 </option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* Conditions commerciales */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Délai de paiement
 </label>
 <select
 value={form.delaiPaiement}
 onChange={e =>
 setForm(f => ({ ...f, delaiPaiement: parseInt(e.target.value) }))
 }
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 >
 {DELAIS_PAIEMENT.map(d => (
 <option key={d.value} value={d.value}>
 {d.label}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Plafond de crédit ({currency})
 </label>
 <input
 type="number"
 value={form.plafondCredit || ''}
 onChange={e =>
 setForm(f => ({ ...f, plafondCredit: parseInt(e.target.value) || 0 }))
 }
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white"
 placeholder="0"
 />
 </div>
 </div>

 {/* Notes */}
 <div>
 <label className="block text-sm font-medium text-white/80 mb-1">
 Notes
 </label>
 <textarea
 value={form.notes}
 onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
 rows={3}
 className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white resize-none"
 placeholder="Informations complémentaires..."
 />
 </div>

 {/* Statut */}
 <label className="flex items-center gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={form.isActive !== false}
 onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
 className="w-5 h-5 rounded border-white/[0.08] text-emerald-400 focus:ring-emerald-500"
 />
 <span className="text-sm text-white/80">Tiers actif</span>
 </label>
 </div>

 {/* Footer */}
 <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3">
 <button
 onClick={handleCancel}
 className="px-6 py-2.5 rounded-lg border border-white/[0.08] text-white/80 hover:bg-white/[0.06] transition"
 >
 Annuler
 </button>
 <button
 onClick={handleSave}
 disabled={!form.name.trim()}
 className="px-6 py-2.5 rounded-lg bg-tribal-accent hover:bg-tribal-accent-light disabled:bg-white/[0.1] disabled:cursor-not-allowed text-white font-medium transition flex items-center gap-2"
 >
 <Save className="w-4 h-4" />
 {editingPartner ? 'Mettre à jour' : 'Créer'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
