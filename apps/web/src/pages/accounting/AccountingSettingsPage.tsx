import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
 Settings,
 DollarSign,
 Percent,
 Hash,
 FileText,
 Building2,
 CreditCard,
 Wallet,
 Smartphone,
 Banknote,
 Info,
 User,
 Phone,
 Mail,
 MapPin,
 Globe,
 FileCheck,
 Shield,
 ChevronDown,
 ChevronUp,
 Save,
 AlertCircle,
 CheckCircle2,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import {
 PAYMENT_METHODS,
 PAYMENT_METHOD_LABELS,
 FORME_JURIDIQUE_LABELS,
 REGIME_FISCAL_LABELS,
 FNE_TAX_TYPE_LABELS,
 type FormeJuridique,
 type RegimeFiscal,
 type FNETaxType,
 type CompanyInfo,
 type FNESettings,
} from '../../accounting/types'

const typeLabels = {
 sale: { label: 'VENTE', icon: '📤', color: 'emerald' },
 purchase: { label: 'ACHAT', icon: '📥', color: 'blue' },
 expense: { label: 'DEPENSE', icon: '💸', color: 'rose' },
} as const

// Icones et couleurs pour les modes de paiement
const paymentMethodStyles = {
 BANQUE: { icon: Building2, color: 'blue', account: '521' },
 CAISSE: { icon: Banknote, color: 'emerald', account: '571' },
 WAVE: { icon: Wallet, color: 'cyan', account: '585' },
 ORANGE_MONEY: { icon: Smartphone, color: 'orange', account: '585' },
 MTN_MONEY: { icon: Smartphone, color: 'yellow', account: '585' },
 MOOV_MONEY: { icon: Smartphone, color: 'indigo', account: '585' },
 AUTRE: { icon: CreditCard, color: 'slate', account: '571' },
} as const

// Composant Input reutilisable
const FormInput: React.FC<{
 label: string
 value: string | number | undefined
 onChange: (value: string) => void
 type?: 'text' | 'number' | 'email' | 'tel' | 'url'
 placeholder?: string
 icon?: React.ReactNode
 helpText?: string
}> = ({ label, value, onChange, type = 'text', placeholder, icon, helpText }) => (
 <div>
 <label className="block text-sm font-medium text-white/60 mb-1.5">
 <span className="flex items-center gap-1.5">
 {icon}
 {label}
 </span>
 </label>
 <input
 type={type}
 className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all text-sm"
 value={value || ''}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 />
 {helpText && <p className="mt-1 text-xs text-white/50">{helpText}</p>}
 </div>
)

// Composant Select reutilisable
const FormSelect: React.FC<{
 label: string
 value: string | undefined
 onChange: (value: string) => void
 options: { value: string; label: string }[]
 icon?: React.ReactNode
}> = ({ label, value, onChange, options, icon }) => (
 <div>
 <label className="block text-sm font-medium text-white/60 mb-1.5">
 <span className="flex items-center gap-1.5">
 {icon}
 {label}
 </span>
 </label>
 <select
 className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-teal-500 focus:border-transparent transition-all text-sm"
 value={value || ''}
 onChange={e => onChange(e.target.value)}
 >
 <option value="">-- Selectionner --</option>
 {options.map(opt => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 </div>
)

// Section pliable
const CollapsibleSection: React.FC<{
 title: string
 icon: React.ReactNode
 children: React.ReactNode
 defaultOpen?: boolean
 badge?: React.ReactNode
 color?: string
}> = ({ title, icon, children, defaultOpen = false, badge, color = 'teal' }) => {
 const [isOpen, setIsOpen] = useState(defaultOpen)

 const colorClasses: Record<string, string> = {
 teal: ' text-teal-400',
 amber: ' text-amber-400',
 violet: ' text-violet-400',
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-sm overflow-hidden"
 >
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/[0.06] transition-colors"
 >
 <div
 className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
 >
 {icon}
 </div>
 <div className="flex-1">
 <h2 className="font-semibold text-white">{title}</h2>
 </div>
 {badge}
 {isOpen ? (
 <ChevronUp className="w-5 h-5 text-white/50" />
 ) : (
 <ChevronDown className="w-5 h-5 text-white/50" />
 )}
 </button>
 {isOpen && (
 <div className="px-5 pb-5 border-t border-white/[0.04] pt-5">
 {children}
 </div>
 )}
 </motion.div>
 )
}

export const AccountingSettingsPage: React.FC = () => {
 const settings = useAccountingStore(s => s.settings)
 const updateCompanyInfo = useAccountingStore(s => s.updateCompanyInfo)
 const updateFNESettings = useAccountingStore(s => s.updateFNESettings)
 const set = useAccountingStore.setState

 const company: Partial<CompanyInfo> = settings.company || {}
 const fne: Partial<FNESettings> = settings.fne || {}

 const safeSet = (updater: (s: any) => any) => {
 const prev = useAccountingStore.getState()
 const next = updater(prev)
 if (next && next.settings) {
 const a = prev.settings
 const b = next.settings
 if (JSON.stringify(a) === JSON.stringify(b)) return
 }
 set(() => next)
 }

 // Verification si les infos fiscales sont remplies
 const hasFiscalInfo = !!(company.ncc && company.rccm)
 const isFNEReady = fne.enabled && fne.apiKey && hasFiscalInfo

 return (
 <div className="space-y-4 md:space-y-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-2xl glass p-4 md:p-6 text-white shadow-xl"
 >
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJoLThjLTIgMC00IDItNCAyczIgNCAyIDRoOGMyIDAgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

 <div className="relative flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Settings className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl md:text-2xl font-bold font-display">Parametres Comptabilite</h1>
 <p className="text-white/70 text-sm">
 Entreprise, fiscalite, modes de paiement et numerotation
 </p>
 </div>
 </div>
 </motion.div>

 {/* Section Informations Entreprise */}
 <CollapsibleSection
 title="Informations de l'entreprise"
 icon={<Building2 className="w-5 h-5" />}
 defaultOpen={true}
 color="teal"
 badge={
 hasFiscalInfo ? (
 <span className="px-2 py-1 text-xs rounded-full text-emerald-400 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> Formalisee
 </span>
 ) : (
 <span className="px-2 py-1 text-xs rounded-full text-amber-400 flex items-center gap-1">
 <AlertCircle className="w-3 h-3" /> A completer
 </span>
 )
 }
 >
 <div className="space-y-6">
 {/* Identite */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <FileText className="w-4 h-4" /> Identite
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormInput
 label="Raison sociale"
 value={company.raisonSociale}
 onChange={v => updateCompanyInfo({ raisonSociale: v })}
 placeholder="TRIBAL ENTERPRISES SARL"
 icon={<Building2 className="w-4 h-4" />}
 />
 <FormInput
 label="Nom commercial"
 value={company.nomCommercial}
 onChange={v => updateCompanyInfo({ nomCommercial: v })}
 placeholder="Tribal Print"
 />
 <FormSelect
 label="Forme juridique"
 value={company.formeJuridique}
 onChange={v => updateCompanyInfo({ formeJuridique: v as FormeJuridique })}
 options={Object.entries(FORME_JURIDIQUE_LABELS).map(([value, label]) => ({
 value,
 label,
 }))}
 />
 <FormInput
 label="Capital social (FCFA)"
 value={company.capitalSocial}
 onChange={v => updateCompanyInfo({ capitalSocial: parseInt(v) || 0 })}
 type="number"
 placeholder="1000000"
 />
 </div>
 </div>

 {/* Adresse */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <MapPin className="w-4 h-4" /> Adresse
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <FormInput
 label="Adresse complete"
 value={company.adresse}
 onChange={v => updateCompanyInfo({ adresse: v })}
 placeholder="Cocody, Rue des Jardins"
 icon={<MapPin className="w-4 h-4" />}
 />
 </div>
 <FormInput
 label="Ville"
 value={company.ville}
 onChange={v => updateCompanyInfo({ ville: v })}
 placeholder="Abidjan"
 />
 <FormInput
 label="Commune"
 value={company.commune}
 onChange={v => updateCompanyInfo({ commune: v })}
 placeholder="Cocody"
 />
 <FormInput
 label="Pays"
 value={company.pays}
 onChange={v => updateCompanyInfo({ pays: v })}
 placeholder="Cote d'Ivoire"
 icon={<Globe className="w-4 h-4" />}
 />
 </div>
 </div>

 {/* Contact */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <Phone className="w-4 h-4" /> Contact
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormInput
 label="Telephone principal"
 value={company.telephone}
 onChange={v => updateCompanyInfo({ telephone: v })}
 type="tel"
 placeholder="+225 07 XX XX XX XX"
 icon={<Phone className="w-4 h-4" />}
 />
 <FormInput
 label="Telephone secondaire"
 value={company.telephoneSecondaire}
 onChange={v => updateCompanyInfo({ telephoneSecondaire: v })}
 type="tel"
 placeholder="+225 05 XX XX XX XX"
 />
 <FormInput
 label="Email"
 value={company.email}
 onChange={v => updateCompanyInfo({ email: v })}
 type="email"
 placeholder="contact@tribal-print.com"
 icon={<Mail className="w-4 h-4" />}
 />
 <FormInput
 label="Site web"
 value={company.siteWeb}
 onChange={v => updateCompanyInfo({ siteWeb: v })}
 type="url"
 placeholder="https://tribalprint.ci"
 icon={<Globe className="w-4 h-4" />}
 />
 </div>
 </div>

 {/* Informations fiscales DGI */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <Shield className="w-4 h-4" /> Informations fiscales (DGI)
 </h3>
 <div className="p-4 rounded-xl bg-amber-900/20 border border-white/[0.06] mb-4">
 <div className="flex items-start gap-2">
 <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-amber-400">
 <p className="font-medium">
 Ces informations sont necessaires pour la certification FNE
 </p>
 <p className="mt-1 text-amber-400">
 Obtenez-les aupres de la Direction Generale des Impots (DGI) apres formalisation
 de votre entreprise.
 </p>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormInput
 label="NCC (Numero Compte Contribuable)"
 value={company.ncc}
 onChange={v => updateCompanyInfo({ ncc: v })}
 placeholder="CI-ABJ-2024-XXXXXX"
 helpText="Delivre par la DGI lors de l'immatriculation"
 />
 <FormInput
 label="RCCM (Registre du Commerce)"
 value={company.rccm}
 onChange={v => updateCompanyInfo({ rccm: v })}
 placeholder="CI-ABJ-2024-B-12345"
 helpText="Numero d'immatriculation au greffe"
 />
 <FormSelect
 label="Regime fiscal"
 value={company.regimeFiscal}
 onChange={v => updateCompanyInfo({ regimeFiscal: v as RegimeFiscal })}
 options={Object.entries(REGIME_FISCAL_LABELS).map(([value, label]) => ({
 value,
 label,
 }))}
 />
 <FormInput
 label="Centre des impots"
 value={company.centreImpots}
 onChange={v => updateCompanyInfo({ centreImpots: v })}
 placeholder="Centre des impots de Cocody"
 />
 </div>
 </div>

 {/* Co-gerants */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <User className="w-4 h-4" /> Co-gerants / Representants legaux
 </h3>

 {/* Co-gerant 1 */}
 <div className="mb-4">
 <p className="text-xs font-medium text-white/50 mb-2">
 Co-gerant 1
 </p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FormInput
 label="Nom"
 value={company.gerantNom}
 onChange={v => updateCompanyInfo({ gerantNom: v })}
 placeholder="KAKOU"
 />
 <FormInput
 label="Prenom"
 value={company.gerantPrenom}
 onChange={v => updateCompanyInfo({ gerantPrenom: v })}
 placeholder="Joseph"
 />
 <FormInput
 label="Contact"
 value={company.gerantContact}
 onChange={v => updateCompanyInfo({ gerantContact: v })}
 type="tel"
 placeholder="+225 07 XX XX XX XX"
 />
 </div>
 </div>

 {/* Co-gerant 2 */}
 <div>
 <p className="text-xs font-medium text-white/50 mb-2">
 Co-gerant 2
 </p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FormInput
 label="Nom"
 value={company.gerant2Nom}
 onChange={v => updateCompanyInfo({ gerant2Nom: v })}
 placeholder="NOM"
 />
 <FormInput
 label="Prenom"
 value={company.gerant2Prenom}
 onChange={v => updateCompanyInfo({ gerant2Prenom: v })}
 placeholder="Prenom"
 />
 <FormInput
 label="Contact"
 value={company.gerant2Contact}
 onChange={v => updateCompanyInfo({ gerant2Contact: v })}
 type="tel"
 placeholder="+225 07 XX XX XX XX"
 />
 </div>
 </div>
 </div>

 {/* Banque */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
 <Building2 className="w-4 h-4" /> Coordonnees bancaires
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormInput
 label="Nom de la banque"
 value={company.banqueNom}
 onChange={v => updateCompanyInfo({ banqueNom: v })}
 placeholder="NSIA Banque, Ecobank, etc."
 />
 <FormInput
 label="RIB / IBAN"
 value={company.banqueIban}
 onChange={v => updateCompanyInfo({ banqueIban: v })}
 placeholder="CI XX XXXX XXXX XXXX XXXX XXXX XXX"
 />
 </div>
 </div>
 </div>
 </CollapsibleSection>

 {/* Section FNE */}
 <CollapsibleSection
 title="FNE - Facture Normalisee Electronique"
 icon={<FileCheck className="w-5 h-5" />}
 defaultOpen={false}
 color="amber"
 badge={
 isFNEReady ? (
 <span className="px-2 py-1 text-xs rounded-full text-emerald-400 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> Active
 </span>
 ) : fne.enabled ? (
 <span className="px-2 py-1 text-xs rounded-full text-amber-400 flex items-center gap-1">
 <AlertCircle className="w-3 h-3" /> Configuration incomplete
 </span>
 ) : (
 <span className="px-2 py-1 text-xs rounded-full bg-tribal-black text-white/60">
 Desactivee
 </span>
 )
 }
 >
 <div className="space-y-6">
 {/* Info FNE */}
 <div className="p-4 rounded-xl bg-blue-900/20 border border-white/[0.06]">
 <div className="flex items-start gap-2">
 <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-blue-400">
 <p className="font-medium">Qu'est-ce que la FNE ?</p>
 <p className="mt-1 text-blue-400">
 La Facture Normalisee Electronique est obligatoire en Cote d'Ivoire pour les
 entreprises formalisees. Elle permet de certifier vos factures aupres de la DGI.
 </p>
 </div>
 </div>
 </div>

 {/* Activation */}
 <div className="flex items-center justify-between p-4 rounded-xl bg-tribal-black border border-white/[0.06]">
 <div>
 <h4 className="font-medium text-white">
 Activer la certification FNE
 </h4>
 <p className="text-sm text-white/50">
 Permet de certifier vos factures aupres de la DGI
 </p>
 </div>
 <button
 onClick={() => updateFNESettings({ enabled: !fne.enabled })}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 fne.enabled ? 'bg-teal-500' : 'bg-white/[0.1]'
 }`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-full bg-white/[0.03] transition-transform ${
 fne.enabled ? 'translate-x-6' : 'translate-x-1'
 }`}
 />
 </button>
 </div>

 {fne.enabled && (
 <>
 {/* Auto-certification */}
 <div className="flex items-center justify-between p-4 rounded-xl bg-tribal-black border border-white/[0.06]">
 <div>
 <h4 className="font-medium text-white">
 Certification automatique
 </h4>
 <p className="text-sm text-white/50">
 Certifier automatiquement les factures a la creation
 </p>
 </div>
 <button
 onClick={() => updateFNESettings({ autoCertify: !fne.autoCertify })}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 fne.autoCertify ? 'bg-teal-500' : 'bg-white/[0.1]'
 }`}
 >
 <span
 className={`inline-block h-4 w-4 transform rounded-full bg-white/[0.03] transition-transform ${
 fne.autoCertify ? 'translate-x-6' : 'translate-x-1'
 }`}
 />
 </button>
 </div>

 {/* Configuration API */}
 <div>
 <h3 className="text-sm font-semibold text-white/80 mb-3">
 Configuration API DGI
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FormInput
 label="URL de l'API FNE"
 value={fne.apiUrl}
 onChange={v => updateFNESettings({ apiUrl: v })}
 type="url"
 placeholder="http://54.247.95.108/ws"
 helpText="URL de test ou de production fournie par la DGI"
 />
 <FormInput
 label="Cle API / Token JWT"
 value={fne.apiKey}
 onChange={v => updateFNESettings({ apiKey: v })}
 placeholder="eyJhbGciOiJIUzI1NiIs..."
 helpText="Token d'authentification delivre par la DGI"
 />
 <FormSelect
 label="Type de taxe par defaut"
 value={fne.defaultTaxType}
 onChange={v => updateFNESettings({ defaultTaxType: v as FNETaxType })}
 options={Object.entries(FNE_TAX_TYPE_LABELS).map(([value, label]) => ({
 value,
 label,
 }))}
 />
 <FormSelect
 label="Type d'entite"
 value={fne.companyType}
 onChange={v => updateFNESettings({ companyType: v as 'PM' | 'PP' })}
 options={[
 { value: 'PM', label: 'Personne Morale (Societe)' },
 { value: 'PP', label: 'Personne Physique (Individuel)' },
 ]}
 />
 <FormInput
 label="TFE (Taxe Forfaitaire Entreprise)"
 value={fne.tfe}
 onChange={v => updateFNESettings({ tfe: v })}
 placeholder="Numero TFE si applicable"
 helpText="Uniquement pour le regime de taxe forfaitaire"
 />
 </div>
 </div>

 {/* Statut */}
 {!hasFiscalInfo && (
 <div className="p-4 rounded-xl bg-amber-900/20 border border-white/[0.06]">
 <div className="flex items-start gap-2">
 <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-amber-400">
 <p className="font-medium">Configuration incomplete</p>
 <p className="mt-1">
 Pour activer la certification FNE, vous devez remplir les informations
 fiscales de l'entreprise (NCC et RCCM) dans la section ci-dessus.
 </p>
 </div>
 </div>
 </div>
 )}

 {hasFiscalInfo && fne.apiKey && (
 <div className="p-4 rounded-xl bg-emerald-900/20 border border-white/[0.06]">
 <div className="flex items-start gap-2">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-emerald-400">
 <p className="font-medium">Pret pour la certification</p>
 <p className="mt-1">
 Votre configuration FNE est complete. Vous pouvez maintenant certifier vos
 factures.
 </p>
 </div>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 </CollapsibleSection>

 {/* Grille principale - Parametres generaux et Modes de paiement */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
 {/* Parametres generaux */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-sm"
 >
 <div className="flex items-center gap-2 mb-5">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center">
 <DollarSign className="w-4 h-4 text-emerald-400" />
 </div>
 <h2 className="font-semibold text-white">Parametres generaux</h2>
 </div>

 <div className="space-y-4">
 {/* Devise */}
 <div>
 <label className="block text-sm font-medium text-white/60 mb-1.5">
 <span className="flex items-center gap-1.5">
 <Building2 className="w-4 h-4" />
 Devise
 </span>
 </label>
 <select
 className="w-full px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white focus:outline-none focus:ring-emerald-500 focus:border-transparent transition-all"
 value={settings.currency}
 onChange={e =>
 safeSet(s => ({ settings: { ...s.settings, currency: e.target.value as any } }))
 }
 >
 <option value="XOF">🇨🇮 XOF - Franc CFA (UEMOA)</option>
 <option value="EUR">🇪🇺 EUR - Euro</option>
 <option value="USD">🇺🇸 USD - Dollar US</option>
 </select>
 </div>

 {/* TVA - EXONEREE */}
 <div>
 <label className="block text-sm font-medium text-white/60 mb-1.5">
 <span className="flex items-center gap-1.5">
 <Percent className="w-4 h-4" />
 TVA
 </span>
 </label>
 <div className="px-4 py-3 rounded-xl border border-white/[0.06] bg-amber-900/20 text-amber-400">
 <div className="flex items-center gap-2">
 <Info className="w-4 h-4 flex-shrink-0" />
 <span className="text-sm font-medium">TVA non applicable</span>
 </div>
 <p className="mt-1.5 text-xs text-amber-400">
 SARL exoneree (CA &lt; 200M FCFA, art. 293 B du CGI)
 </p>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Modes de paiement */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-sm"
 >
 <div className="flex items-center gap-2 mb-5">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center">
 <CreditCard className="w-4 h-4 text-violet-400" />
 </div>
 <h2 className="font-semibold text-white">Modes de paiement</h2>
 <span className="ml-auto text-xs text-white/50">Plan OHADA</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {PAYMENT_METHODS.map(method => {
 const style = paymentMethodStyles[method]
 const Icon = style.icon
 const colorClasses: Record<string, string> = {
 blue: 'bg-blue-900/20 border-white/[0.06] text-blue-400',
 emerald:
 'bg-emerald-900/20 border-white/[0.06] text-emerald-400',
 cyan: 'bg-cyan-900/20 border-white/[0.06] text-cyan-400',
 orange:
 'bg-orange-900/20 border-white/[0.06] text-orange-400',
 yellow:
 'bg-yellow-900/20 border-white/[0.06] text-yellow-400',
 indigo:
 'bg-indigo-900/20 border-white/[0.06] text-tribal-accent',
 slate:
 'bg-tribal-black border-white/[0.06] text-white/80',
 }
 return (
 <div
 key={method}
 className={`flex items-center gap-3 p-3 rounded-xl border ${colorClasses[style.color]}`}
 >
 <Icon className="w-5 h-5" />
 <div className="flex-1 min-w-0">
 <div className="font-medium text-sm truncate">
 {PAYMENT_METHOD_LABELS[method]}
 </div>
 <div className="text-xs opacity-70">Compte {style.account}</div>
 </div>
 </div>
 )
 })}
 </div>

 <div className="mt-4 p-3 rounded-lg bg-tribal-black text-xs text-white/60">
 <div className="flex items-start gap-2">
 <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <div>
 <strong>Comptes OHADA :</strong> 521 (Banque), 571 (Caisse), 585 (Mobile Money)
 </div>
 </div>
 </div>
 </motion.div>
 </div>

 {/* Numerotation */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-sm"
 >
 <div className="flex items-center gap-2 mb-5">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center">
 <Hash className="w-4 h-4 text-blue-400" />
 </div>
 <h2 className="font-semibold text-white">Numerotation des pieces</h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {(['sale', 'purchase', 'expense'] as const).map((key, idx) => {
 const { label, icon, color } = typeLabels[key]
 const colorClasses = {
 emerald:
 ' text-emerald-400 border-white/[0.06]',
 blue: ' text-blue-400 border-white/[0.06]',
 rose: ' text-rose-400 border-white/[0.06]',
 }
 return (
 <motion.div
 key={key}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.3 + idx * 0.1 }}
 className={`rounded-xl border p-4 ${colorClasses[color]}`}
 >
 <div className="flex items-center gap-2 mb-3">
 <span className="text-lg">{icon}</span>
 <span className="font-semibold text-sm">{label}</span>
 </div>
 <div className="space-y-3">
 <div>
 <label className="block text-xs opacity-80 mb-1">Prefixe</label>
 <input
 className="w-full px-3 py-2 border border-current/20 bg-white/50 rounded-lg text-sm font-mono"
 placeholder="FAC-"
 value={settings.numbering?.[key]?.prefix || ''}
 onChange={e =>
 safeSet(s => ({
 settings: {
 ...s.settings,
 numbering: {
 ...s.settings.numbering!,
 [key]: {
 ...(s.settings.numbering?.[key] || { next: 1, pad: 4 }),
 prefix: e.target.value,
 },
 },
 },
 }))
 }
 />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-xs opacity-80 mb-1">Compteur</label>
 <input
 className="w-full px-3 py-2 border border-current/20 bg-white/50 rounded-lg text-sm font-mono"
 type="number"
 min={1}
 value={settings.numbering?.[key]?.next || 1}
 onChange={e =>
 safeSet(s => ({
 settings: {
 ...s.settings,
 numbering: {
 ...s.settings.numbering!,
 [key]: {
 ...(s.settings.numbering?.[key] || { prefix: '', pad: 4 }),
 next: parseInt(e.target.value || '1', 10),
 },
 },
 },
 }))
 }
 />
 </div>
 <div>
 <label className="block text-xs opacity-80 mb-1">Zeros</label>
 <input
 className="w-full px-3 py-2 border border-current/20 bg-white/50 rounded-lg text-sm font-mono"
 type="number"
 min={1}
 max={10}
 value={settings.numbering?.[key]?.pad || 4}
 onChange={e =>
 safeSet(s => ({
 settings: {
 ...s.settings,
 numbering: {
 ...s.settings.numbering!,
 [key]: {
 ...(s.settings.numbering?.[key] || { prefix: '' }),
 pad: parseInt(e.target.value || '4', 10),
 },
 },
 },
 }))
 }
 />
 </div>
 </div>
 </div>
 {/* Preview */}
 <div className="mt-3 pt-3 border-t border-current/10 text-xs opacity-70">
 Exemple:{' '}
 <span className="font-mono font-semibold">
 {settings.numbering?.[key]?.prefix || ''}
 {String(settings.numbering?.[key]?.next || 1).padStart(
 settings.numbering?.[key]?.pad || 4,
 '0'
 )}
 </span>
 </div>
 </motion.div>
 )
 })}
 </div>
 </motion.div>

 {/* Note info */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.4 }}
 className="rounded-xl bg-blue-900/20 border border-white/[0.06] p-4"
 >
 <div className="flex gap-3">
 <div className="flex-shrink-0">
 <Save className="w-5 h-5 text-blue-400" />
 </div>
 <div>
 <h3 className="font-semibold text-blue-300 text-sm">
 Sauvegarde automatique
 </h3>
 <p className="text-sm text-blue-400 mt-1">
 Les modifications sont sauvegardees automatiquement. La numerotation s'applique aux
 nouvelles pieces sans impacter l'historique existant.
 </p>
 </div>
 </div>
 </motion.div>
 </div>
 )
}

export default AccountingSettingsPage
