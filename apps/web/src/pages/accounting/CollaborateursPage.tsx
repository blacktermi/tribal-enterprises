import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccountingStore } from '../../store/accounting'
import type {
 Collaborator,
 CollaboratorType,
 PaymentFrequency,
 Brand,
 PaymentMethod,
} from '../../accounting/types'
import {
 COLLABORATOR_TYPE_LABELS,
 PAYMENT_FREQUENCY_LABELS,
 BRAND_LABELS,
 BRAND_COLORS,
 PAYMENT_METHOD_LABELS,
 PAYMENT_METHODS,
} from '../../accounting/types'
import {
 Users,
 UserPlus,
 Search,
 Edit2,
 Phone,
 Mail,
 MapPin,
 Briefcase,
 Calendar,
 CreditCard,
 X,
 Save,
 Trash2,
 Building2,
 Clock,
 DollarSign,
 UserCheck,
 UserX,
 Filter,
} from 'lucide-react'

// Types de collaborateurs
const COLLABORATOR_TYPES: CollaboratorType[] = [
 'associe',
 'salarie',
 'freelance',
 'stagiaire',
 'contractuel',
]

// Types de contrats
const CONTRACT_TYPES = [
 { value: 'cdi', label: 'CDI' },
 { value: 'cdd', label: 'CDD' },
 { value: 'freelance', label: 'Freelance' },
 { value: 'stage', label: 'Stage' },
 { value: 'interim', label: 'Intérim' },
] as const

// Fréquences de paiement
const PAYMENT_FREQUENCIES: PaymentFrequency[] = [
 'mensuel',
 'bimensuel',
 'hebdomadaire',
 'journalier',
 'projet',
 'horaire',
]

// Postes courants
const COMMON_POSITIONS = [
 'Designer Graphique',
 'Développeur',
 'Commercial',
 'Community Manager',
 'Photographe',
 'Vidéaste',
 'Rédacteur',
 'Comptable',
 'Assistant(e)',
 'Livreur',
 'Responsable Production',
 'Chef de Projet',
 'Autre',
]

type CollaboratorFormData = Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'>

const emptyForm: CollaboratorFormData = {
 name: '',
 type: 'freelance',
 poste: '',
 brand: undefined,
 phone: '',
 email: '',
 address: '',
 city: 'Abidjan',
 salary: 0,
 paymentFrequency: 'mensuel',
 paymentMethod: 'CAISSE',
 startDate: new Date().toISOString().slice(0, 10),
 endDate: undefined,
 contractType: 'freelance',
 cnpsNumber: '',
 bankAccount: '',
 emergencyContact: '',
 notes: '',
 isActive: true,
}

// Badge de type
const TypeBadge: React.FC<{ type: CollaboratorType }> = ({ type }) => {
 const colors: Record<CollaboratorType, string> = {
 associe: ' text-tribal-accent',
 salarie: ' text-blue-400',
 freelance: ' text-purple-400',
 stagiaire: ' text-amber-400',
 contractuel: ' text-teal-400',
 }

 return (
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors[type]}`}
 >
 <Briefcase className="w-3 h-3" />
 {COLLABORATOR_TYPE_LABELS[type]}
 </span>
 )
}

// Badge de statut
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
 return isActive ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400">
 <UserCheck className="w-3 h-3" />
 Actif
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-tribal-black text-white/60">
 <UserX className="w-3 h-3" />
 Inactif
 </span>
 )
}

export const CollaborateursPage: React.FC = () => {
 const collaborators = useAccountingStore(s => s.collaborators)
 const addCollaborator = useAccountingStore(s => s.addCollaborator)
 const updateCollaborator = useAccountingStore(s => s.updateCollaborator)
 const deleteCollaborator = useAccountingStore(s => s.deleteCollaborator)
 const settings = useAccountingStore(s => s.settings)
 const currency = settings.currency

 // États
 const [filterType, setFilterType] = useState<'all' | CollaboratorType>('all')
 const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
 const [search, setSearch] = useState('')
 const [showForm, setShowForm] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [form, setForm] = useState<CollaboratorFormData>(emptyForm)
 const [expandedId, setExpandedId] = useState<string | null>(null)

 // Stats
 const stats = useMemo(() => {
 const active = collaborators.filter(c => c.isActive !== false)
 const salaries = active.filter(c => c.type === 'salarie')
 const freelances = active.filter(c => c.type === 'freelance')
 const totalSalaries = salaries.reduce((s, c) => s + (c.salary || 0), 0)
 const totalFreelance = freelances.reduce((s, c) => s + (c.salary || 0), 0)
 return {
 total: collaborators.length,
 active: active.length,
 salaries: salaries.length,
 freelances: freelances.length,
 stagiaires: active.filter(c => c.type === 'stagiaire').length,
 masseSalariale: totalSalaries,
 chargesFreelance: totalFreelance,
 }
 }, [collaborators])

 // Filtrage
 const filteredCollaborators = useMemo(() => {
 return collaborators
 .filter(c => {
 if (filterType !== 'all' && c.type !== filterType) return false
 if (filterStatus === 'active' && c.isActive === false) return false
 if (filterStatus === 'inactive' && c.isActive !== false) return false
 if (search) {
 const s = search.toLowerCase()
 const matchName = c.name.toLowerCase().includes(s)
 const matchPoste = c.poste?.toLowerCase().includes(s)
 const matchEmail = c.email?.toLowerCase().includes(s)
 const matchPhone = c.phone?.includes(s)
 return matchName || matchPoste || matchEmail || matchPhone
 }
 return true
 })
 .sort((a, b) => {
 // Actifs en premier, puis par nom
 if (a.isActive !== false && b.isActive === false) return -1
 if (a.isActive === false && b.isActive !== false) return 1
 return a.name.localeCompare(b.name)
 })
 }, [collaborators, filterType, filterStatus, search])

 // Handlers
 const handleSubmit = () => {
 if (!form.name || !form.poste) {
 alert('Veuillez remplir le nom et le poste')
 return
 }

 if (editingId) {
 updateCollaborator(editingId, form)
 } else {
 addCollaborator(form)
 }

 setForm(emptyForm)
 setShowForm(false)
 setEditingId(null)
 }

 const handleEdit = (c: Collaborator) => {
 setForm({
 name: c.name,
 type: c.type,
 poste: c.poste,
 brand: c.brand,
 phone: c.phone || '',
 email: c.email || '',
 address: c.address || '',
 city: c.city || 'Abidjan',
 salary: c.salary || 0,
 paymentFrequency: c.paymentFrequency || 'mensuel',
 paymentMethod: c.paymentMethod || 'CAISSE',
 startDate: c.startDate || '',
 endDate: c.endDate,
 contractType: c.contractType || 'freelance',
 cnpsNumber: c.cnpsNumber || '',
 bankAccount: c.bankAccount || '',
 emergencyContact: c.emergencyContact || '',
 notes: c.notes || '',
 isActive: c.isActive !== false,
 })
 setEditingId(c.id)
 setShowForm(true)
 }

 const handleDelete = (id: string) => {
 if (confirm('Supprimer ce collaborateur ?')) {
 deleteCollaborator(id)
 }
 }

 const handleToggleStatus = (c: Collaborator) => {
 updateCollaborator(c.id, { isActive: c.isActive === false })
 }

 return (
 <div className="space-y-6">
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
 <Users className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Équipe</h1>
 <p className="text-white/70 text-sm">
 Gérez vos salariés, freelances, stagiaires et contractuels
 </p>
 </div>
 </div>

 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => {
 setForm(emptyForm)
 setEditingId(null)
 setShowForm(true)
 }}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] backdrop-blur-sm rounded-xl transition-colors self-start md:self-auto"
 >
 <UserPlus className="w-4 h-4" />
 <span className="text-sm font-medium">Ajouter</span>
 </motion.button>
 </div>

 {/* Stats rapides */}
 <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
 <div className="text-center">
 <div className="text-2xl font-bold">{stats.active}</div>
 <div className="text-xs text-white/70">Actifs</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold">{stats.salaries}</div>
 <div className="text-xs text-white/70">Salariés</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold">{stats.freelances}</div>
 <div className="text-xs text-white/70">Freelances</div>
 </div>
 <div className="text-center">
 <div className="text-lg font-bold">{stats.masseSalariale.toLocaleString()}</div>
 <div className="text-xs text-white/70">Masse salariale</div>
 </div>
 </div>
 </motion.div>

 {/* Toolbar */}
 <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
 {/* Filtres type */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setFilterType('all')}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
 filterType === 'all'
 ? 'bg-tribal-black text-white'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 Tous ({stats.total})
 </button>
 {COLLABORATOR_TYPES.map(t => (
 <button
 key={t}
 onClick={() => setFilterType(t)}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
 filterType === t
 ? 'bg-tribal-black text-white'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 {COLLABORATOR_TYPE_LABELS[t]}
 </button>
 ))}
 </div>

 <div className="h-6 w-px bg-white/[0.1] hidden md:block" />

 {/* Filtre statut */}
 <div className="flex items-center gap-2">
 <Filter className="w-4 h-4 text-white/50" />
 <select
 value={filterStatus}
 onChange={e => setFilterStatus(e.target.value as any)}
 className="px-3 py-1.5 text-sm rounded-lg border border-white/[0.06] bg-white/[0.03]"
 >
 <option value="all">Tous statuts</option>
 <option value="active">Actifs</option>
 <option value="inactive">Inactifs</option>
 </select>
 </div>

 {/* Recherche */}
 <div className="flex-1 min-w-[200px]">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
 <input
 type="text"
 placeholder="Rechercher..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm"
 />
 </div>
 </div>
 </div>

 {/* Modal formulaire */}
 <AnimatePresence>
 {showForm && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
 onClick={() => setShowForm(false)}
 >
 <motion.div
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.9, opacity: 0 }}
 onClick={e => e.stopPropagation()}
 className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/[0.03] rounded-2xl shadow-2xl"
 >
 <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.03]">
 <h2 className="text-lg font-semibold text-white">
 {editingId ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
 </h2>
 <button
 onClick={() => setShowForm(false)}
 className="p-2 rounded-lg hover:bg-white/[0.06]"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 space-y-4">
 {/* Infos de base */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Nom complet *
 </label>
 <input
 type="text"
 value={form.name}
 onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 placeholder="Ex: Kouassi Jean-Marc"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Type *
 </label>
 <select
 value={form.type}
 onChange={e =>
 setForm(f => ({ ...f, type: e.target.value as CollaboratorType }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 {COLLABORATOR_TYPES.map(t => (
 <option key={t} value={t}>
 {COLLABORATOR_TYPE_LABELS[t]}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Poste *
 </label>
 <select
 value={COMMON_POSITIONS.includes(form.poste) ? form.poste : 'Autre'}
 onChange={e =>
 setForm(f => ({
 ...f,
 poste: e.target.value === 'Autre' ? '' : e.target.value,
 }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 <option value="">-- Sélectionner --</option>
 {COMMON_POSITIONS.map(p => (
 <option key={p} value={p}>
 {p}
 </option>
 ))}
 </select>
 {(!COMMON_POSITIONS.includes(form.poste) || form.poste === '') && (
 <input
 type="text"
 value={form.poste}
 onChange={e => setForm(f => ({ ...f, poste: e.target.value }))}
 placeholder="Précisez le poste..."
 className="w-full mt-2 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 )}
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Pôle / Marque
 </label>
 <select
 value={form.brand || ''}
 onChange={e =>
 setForm(f => ({ ...f, brand: (e.target.value as Brand) || undefined }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 <option value="">-- Aucun --</option>
 {(Object.keys(BRAND_LABELS) as Brand[]).map(b => (
 <option key={b} value={b}>
 {BRAND_LABELS[b]}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Contact */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Téléphone
 </label>
 <input
 type="tel"
 value={form.phone}
 onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
 placeholder="+225 07 00 00 00"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Email
 </label>
 <input
 type="email"
 value={form.email}
 onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
 placeholder="email@exemple.com"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Ville
 </label>
 <input
 type="text"
 value={form.city}
 onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
 placeholder="Abidjan"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 </div>

 {/* Rémunération */}
 <div className="p-4 rounded-xl bg-tribal-black space-y-4">
 <h3 className="font-medium text-white flex items-center gap-2">
 <DollarSign className="w-4 h-4" />
 Rémunération
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Montant ({currency})
 </label>
 <input
 type="number"
 value={form.salary || ''}
 onChange={e =>
 setForm(f => ({ ...f, salary: Number(e.target.value) || 0 }))
 }
 placeholder="0"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Fréquence
 </label>
 <select
 value={form.paymentFrequency}
 onChange={e =>
 setForm(f => ({
 ...f,
 paymentFrequency: e.target.value as PaymentFrequency,
 }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 {PAYMENT_FREQUENCIES.map(pf => (
 <option key={pf} value={pf}>
 {PAYMENT_FREQUENCY_LABELS[pf]}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Mode de paiement
 </label>
 <select
 value={form.paymentMethod}
 onChange={e =>
 setForm(f => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 {PAYMENT_METHODS.map(pm => (
 <option key={pm} value={pm}>
 {PAYMENT_METHOD_LABELS[pm]}
 </option>
 ))}
 </select>
 </div>
 </div>
 </div>

 {/* Contrat */}
 <div className="p-4 rounded-xl bg-tribal-black space-y-4">
 <h3 className="font-medium text-white flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 Contrat
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Type de contrat
 </label>
 <select
 value={form.contractType}
 onChange={e =>
 setForm(f => ({ ...f, contractType: e.target.value as any }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 >
 {CONTRACT_TYPES.map(ct => (
 <option key={ct.value} value={ct.value}>
 {ct.label}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Date de début
 </label>
 <input
 type="date"
 value={form.startDate || ''}
 onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Date de fin (si CDD)
 </label>
 <input
 type="date"
 value={form.endDate || ''}
 onChange={e =>
 setForm(f => ({ ...f, endDate: e.target.value || undefined }))
 }
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 </div>
 </div>

 {/* Infos légales */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 N° CNPS
 </label>
 <input
 type="text"
 value={form.cnpsNumber}
 onChange={e => setForm(f => ({ ...f, cnpsNumber: e.target.value }))}
 placeholder="Numéro CNPS"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 RIB / IBAN
 </label>
 <input
 type="text"
 value={form.bankAccount}
 onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
 placeholder="Compte bancaire"
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
 />
 </div>
 </div>

 {/* Notes */}
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-white/60">
 Notes
 </label>
 <textarea
 value={form.notes}
 onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
 placeholder="Informations complémentaires..."
 rows={3}
 className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] resize-none"
 />
 </div>

 {/* Statut actif */}
 <div className="flex items-center gap-3">
 <input
 type="checkbox"
 id="isActive"
 checked={form.isActive !== false}
 onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
 className="w-4 h-4 rounded border-white/[0.08]"
 />
 <label htmlFor="isActive" className="text-sm text-white/60">
 Collaborateur actif
 </label>
 </div>
 </div>

 <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-white/[0.06] bg-white/[0.03]">
 <button
 onClick={() => setShowForm(false)}
 className="px-4 py-2 rounded-xl border border-white/[0.06] text-white/60 hover:bg-white/[0.06]"
 >
 Annuler
 </button>
 <button
 onClick={handleSubmit}
 className="px-4 py-2 rounded-xl bg-tribal-accent text-white hover:bg-tribal-accent-light flex items-center gap-2"
 >
 <Save className="w-4 h-4" />
 {editingId ? 'Modifier' : 'Ajouter'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Liste des collaborateurs */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {filteredCollaborators.map((c, idx) => (
 <motion.div
 key={c.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.05 }}
 className={`rounded-2xl border p-4 transition-all ${
 c.isActive === false
 ? 'bg-tribal-black border-white/[0.06] opacity-60'
 : 'bg-white/[0.03] border-white/[0.06] hover:shadow-lg'
 }`}
 >
 {/* En-tête */}
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-3">
 <div
 className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
 c.type === 'associe'
 ? 'bg-tribal-accent'
 : c.type === 'salarie'
 ? 'bg-blue-500'
 : c.type === 'freelance'
 ? 'bg-purple-500'
 : c.type === 'stagiaire'
 ? 'bg-amber-500'
 : 'bg-teal-500'
 }`}
 >
 {c.name
 .split(' ')
 .map(n => n[0])
 .join('')
 .slice(0, 2)
 .toUpperCase()}
 </div>
 <div>
 <h3 className="font-semibold text-white">{c.name}</h3>
 <p className="text-sm text-white/50">{c.poste}</p>
 </div>
 </div>
 <StatusBadge isActive={c.isActive !== false} />
 </div>

 {/* Badges */}
 <div className="flex flex-wrap items-center gap-2 mb-3">
 <TypeBadge type={c.type} />
 {c.brand && (
 <span
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BRAND_COLORS[c.brand]?.bg} ${BRAND_COLORS[c.brand]?.text}`}
 >
 <Building2 className="w-3 h-3" />
 {BRAND_LABELS[c.brand]}
 </span>
 )}
 </div>

 {/* Infos de contact */}
 <div className="space-y-1.5 text-sm mb-3">
 {c.phone && (
 <div className="flex items-center gap-2 text-white/60">
 <Phone className="w-4 h-4" />
 <span>{c.phone}</span>
 </div>
 )}
 {c.email && (
 <div className="flex items-center gap-2 text-white/60">
 <Mail className="w-4 h-4" />
 <span className="truncate">{c.email}</span>
 </div>
 )}
 {c.salary && c.salary > 0 && (
 <div className="flex items-center gap-2 text-white/60">
 <DollarSign className="w-4 h-4" />
 <span>
 {c.salary.toLocaleString()} {currency} /{' '}
 {PAYMENT_FREQUENCY_LABELS[c.paymentFrequency || 'mensuel']}
 </span>
 </div>
 )}
 {c.startDate && (
 <div className="flex items-center gap-2 text-white/60">
 <Clock className="w-4 h-4" />
 <span>Depuis le {new Date(c.startDate).toLocaleDateString('fr-FR')}</span>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
 <button
 onClick={() => handleEdit(c)}
 className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-tribal-black text-white/60 hover:bg-white/[0.06] text-sm"
 >
 <Edit2 className="w-4 h-4" />
 Modifier
 </button>
 <button
 onClick={() => handleToggleStatus(c)}
 className={`px-3 py-2 rounded-lg text-sm ${
 c.isActive === false
 ? ' text-emerald-400 hover:bg-emerald-900/30'
 : 'bg-tribal-black text-white/60 hover:bg-white/[0.06]'
 }`}
 >
 {c.isActive === false ? (
 <UserCheck className="w-4 h-4" />
 ) : (
 <UserX className="w-4 h-4" />
 )}
 </button>
 <button
 onClick={() => handleDelete(c.id)}
 className="px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/40"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 ))}
 </div>

 {/* Empty state */}
 {filteredCollaborators.length === 0 && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
 <Users className="w-16 h-16 mx-auto mb-4 text-white/50" />
 <h3 className="text-lg font-medium text-white mb-2">
 Aucun collaborateur
 </h3>
 <p className="text-white/50 mb-4">
 {search || filterType !== 'all' || filterStatus !== 'all'
 ? 'Aucun résultat pour ces filtres'
 : 'Commencez par ajouter vos premiers collaborateurs'}
 </p>
 {!search && filterType === 'all' && filterStatus === 'all' && (
 <button
 onClick={() => {
 setForm(emptyForm)
 setEditingId(null)
 setShowForm(true)
 }}
 className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tribal-accent text-white hover:bg-tribal-accent-light"
 >
 <UserPlus className="w-4 h-4" />
 Ajouter un collaborateur
 </button>
 )}
 </motion.div>
 )}
 </div>
 )
}
