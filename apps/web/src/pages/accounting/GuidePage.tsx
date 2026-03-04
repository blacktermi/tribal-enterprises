import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
 BookOpen,
 ChevronRight,
 Lightbulb,
 AlertTriangle,
 CheckCircle2,
 Settings,
 FileText,
 ShoppingCart,
 CreditCard,
 Receipt,
 BookOpenCheck,
 Star,
 Wrench,
 ArrowUp,
 Search,
 Users,
 Building2,
} from 'lucide-react'

const tocItems = [
 { id: 'concepts', label: 'Pré-requis et concepts', icon: Lightbulb, color: 'emerald' },
 { id: 'setup', label: 'Paramétrage', icon: Settings, color: 'sky' },
 { id: 'categories', label: 'Catégories de dépenses', icon: ShoppingCart, color: 'orange' },
 { id: 'equipe', label:"Gestion de l'équipe", icon: Star, color: 'violet' },
 { id: 'tiers', label: 'Clients et fournisseurs', icon: Users, color: 'sky' },
 { id: 'vente', label: 'Facture de vente', icon: FileText, color: 'violet' },
 { id: 'depense', label: 'Dépense (achat)', icon: ShoppingCart, color: 'orange' },
 { id: 'encaissement', label: 'Encaissement', icon: CreditCard, color: 'emerald' },
 { id: 'tva', label: 'TVA', icon: Receipt, color: 'rose' },
 { id: 'livres', label: 'Journal / Grand-livre / Balance', icon: BookOpenCheck, color: 'slate' },
 { id: 'bonnes-pratiques', label: 'Bonnes pratiques', icon: Star, color: 'emerald' },
 { id: 'depannage', label: 'Dépannage', icon: Wrench, color: 'orange' },
]

const colorClasses: Record<
 string,
 { bg: string; border: string; text: string; gradient: string; darkBg: string }
> = {
 emerald: {
 bg: 'bg-emerald-900/20',
 border: 'border-white/[0.06]',
 text: 'text-emerald-400',
 gradient: 'from-emerald-500 to-teal-600',
 darkBg: '',
 },
 sky: {
 bg: 'bg-sky-900/20',
 border: 'border-white/[0.06]',
 text: 'text-sky-400',
 gradient: 'from-sky-500 to-cyan-600',
 darkBg: '',
 },
 violet: {
 bg: 'bg-violet-900/20',
 border: 'border-white/[0.06]',
 text: 'text-violet-400',
 gradient: 'from-violet-500 to-purple-600',
 darkBg: '',
 },
 orange: {
 bg: 'bg-orange-900/20',
 border: 'border-white/[0.06]',
 text: 'text-orange-400',
 gradient: 'from-orange-500 to-amber-600',
 darkBg: '',
 },
 rose: {
 bg: 'bg-rose-900/20',
 border: 'border-white/[0.06]',
 text: 'text-rose-400',
 gradient: 'from-rose-500 to-pink-600',
 darkBg: '',
 },
 slate: {
 bg: 'bg-tribal-black',
 border: 'border-white/[0.06]',
 text: 'text-white/80',
 gradient: 'from-slate-500 to-gray-600',
 darkBg: '',
 },
}

const Callout: React.FC<{ type: 'tip' | 'warn'; title: string; children: React.ReactNode }> = ({
 type,
 title,
 children,
}) => (
 <motion.div
 initial={{ opacity: 0, x: -10 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className={`rounded-xl p-4 border flex gap-3 ${
 type === 'tip'
 ? 'bg-emerald-900/20 border-white/[0.06] text-emerald-400'
 : 'bg-amber-900/20 border-white/[0.06] text-amber-300'
 }`}
 >
 <div className="flex-shrink-0 mt-0.5">
 {type === 'tip' ? (
 <CheckCircle2 className="w-5 h-5 text-emerald-400" />
 ) : (
 <AlertTriangle className="w-5 h-5 text-amber-400" />
 )}
 </div>
 <div>
 <div className="font-semibold mb-1">{title}</div>
 <div className="text-sm opacity-90">{children}</div>
 </div>
 </motion.div>
)

const SectionCard: React.FC<{
 title: string
 color: 'emerald' | 'sky' | 'violet' | 'orange' | 'rose' | 'slate'
 index: number
 icon: React.ElementType
 children: React.ReactNode
}> = ({ title, color, index, icon: Icon, children }) => {
 const classes = colorClasses[color]
 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-50px' }}
 transition={{ duration: 0.4, delay: index * 0.05 }}
 className={`rounded-2xl border shadow-sm overflow-hidden ${classes.bg} ${classes.darkBg} ${classes.border}`}
 >
 <div className={`bg-gradient-to-r ${classes.gradient} px-5 py-3 flex items-center gap-3`}>
 <div className="w-8 h-8 rounded-lg bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
 <Icon className="w-4 h-4 text-white" />
 </div>
 <span className="text-white font-bold text-sm uppercase tracking-wide">{title}</span>
 </div>
 <div className="p-5 space-y-3 text-white text-[15px] leading-6">
 {children}
 </div>
 </motion.div>
 )
}

export const GuidePage: React.FC = () => {
 const [searchTerm, setSearchTerm] = useState('')
 const [activeSection, setActiveSection] = useState<string | null>(null)
 const [showScrollTop, setShowScrollTop] = useState(false)

 React.useEffect(() => {
 const handleScroll = () => {
 setShowScrollTop(window.scrollY > 300)
 }
 window.addEventListener('scroll', handleScroll)
 return () => window.removeEventListener('scroll', handleScroll)
 }, [])

 const scrollToSection = (id: string) => {
 setActiveSection(id)
 const el = document.getElementById(id)
 if (el) {
 el.scrollIntoView({ behavior: 'smooth', block: 'start' })
 }
 }

 const scrollToTop = () => {
 window.scrollTo({ top: 0, behavior: 'smooth' })
 }

 return (
 <div className="space-y-6 relative">
 {/* En-tête moderne glassmorphism */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden glass rounded-2xl p-6 text-white"
 >
 <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

 <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center shadow-lg">
 <BookOpen className="h-7 w-7 text-white" />
 </div>
 <div className="flex-1">
 <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight">
 Guide de la comptabilité
 </h1>
 <p className="text-white/80 mt-1">
 Étapes simples pour démarrer et maîtriser l'outil comptable
 </p>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-sm rounded-xl">
 <span className="text-sm font-medium">12 sections</span>
 <div className="w-px h-4 bg-white/30" />
 <span className="text-sm text-white/80">~10 min lecture</span>
 </div>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="relative mt-5"
 >
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
 <input
 type="text"
 placeholder="Rechercher dans le guide..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:outline-none focus:ring-white/30"
 />
 </motion.div>
 </motion.div>

 {/* Sommaire interactif */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
 >
 <div className="flex items-center gap-2 mb-4">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
 <BookOpenCheck className="w-4 h-4 text-white" />
 </div>
 <span className="font-bold text-white">Sommaire</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
 {tocItems.map((item, idx) => {
 const classes = colorClasses[item.color]
 return (
 <motion.button
 key={item.id}
 onClick={() => scrollToSection(item.id)}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
 activeSection === item.id
 ? `${classes.bg} ${classes.border} ${classes.darkBg}`
 : 'border-transparent hover:bg-white/[0.06]'
 }`}
 >
 <span
 className={`w-6 h-6 rounded-md bg-gradient-to-br ${classes.gradient} flex items-center justify-center text-xs font-bold text-white`}
 >
 {idx + 1}
 </span>
 <span className="text-sm font-medium text-white/80 flex-1 truncate">
 {item.label}
 </span>
 <ChevronRight className="w-4 h-4 text-white/50" />
 </motion.button>
 )
 })}
 </div>
 </motion.div>

 {/* Sections */}
 <div id="concepts">
 <SectionCard
 title="1. Pré-requis et concepts simples"
 color="emerald"
 index={0}
 icon={Lightbulb}
 >
 <ul className="list-disc list-inside space-y-1">
 <li>
 Une <strong>vente</strong> crée HT, TVA et TTC.
 </li>
 <li>
 Une <strong>dépense</strong> (achat) fonctionne pareil côté fournisseur.
 </li>
 <li>
 Un <strong>encaissement</strong> est un paiement reçu (ou un règlement fournisseur).
 </li>
 <li>
 La <strong>TVA nette</strong> = collectée (ventes) − déductible (achats).
 </li>
 </ul>
 </SectionCard>
 </div>

 <div id="setup">
 <SectionCard title="2. Paramétrer l'outil" color="sky" index={1} icon={Settings}>
 <ol className="list-decimal list-inside space-y-1">
 <li>
 Ouvrez <em>Comptabilité → Paramètres</em>.
 </li>
 <li>
 Choisissez la <strong>devise</strong> (XOF, EUR, USD).
 </li>
 <li>
 Réglez le <strong>taux de TVA par défaut</strong> (18% pour la Côte d'Ivoire).
 </li>
 <li>
 Configurez la <strong>numérotation</strong> VENTE/ACHAT/DÉPENSE (préfixe, compteur,
 zéros).
 </li>
 </ol>

 <div className="mt-4 p-4 rounded-xl bg-tribal-black space-y-2">
 <div className="font-semibold text-white/80">
 💳 Modes de paiement disponibles :
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>🏦</span> <strong>Banque</strong>{' '}
 <code className="text-xs text-sky-400">521</code>
 </div>
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>💵</span> <strong>Caisse</strong>{' '}
 <code className="text-xs text-sky-400">571</code>
 </div>
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>📱</span> <strong>Wave</strong>{' '}
 <code className="text-xs text-sky-400">585</code>
 </div>
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>🟠</span> <strong>Orange Money</strong>{' '}
 <code className="text-xs text-sky-400">585</code>
 </div>
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>🟡</span> <strong>MTN Money</strong>{' '}
 <code className="text-xs text-sky-400">585</code>
 </div>
 <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
 <span>🔵</span> <strong>Moov Money</strong>{' '}
 <code className="text-xs text-sky-400">585</code>
 </div>
 </div>
 </div>

 <Callout type="tip" title="Astuce">
 Vous pouvez modifier ces paramètres à tout moment sans impacter l'historique existant.
 Les modifications sont sauvegardées automatiquement.
 </Callout>
 </SectionCard>
 </div>

 <div id="categories">
 <SectionCard title="3. Catégories de dépenses" color="orange" index={2} icon={ShoppingCart}>
 <div className="space-y-4">
 <p className="font-medium text-white/60">
 Chaque catégorie correspond à un compte OHADA :
 </p>

 <div className="space-y-2">
 <div className="font-semibold text-emerald-400 flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
 Charges de Personnel
 </div>
 <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>
 <strong>Salaires</strong> (CDI, CDD)
 </span>
 <code className="text-emerald-400 font-mono">661</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>
 <strong>Main d'œuvre (Atelier)</strong>
 </span>
 <code className="text-emerald-400 font-mono">662</code>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <div className="font-semibold text-violet-400 flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-violet-500"></span>
 Sous-traitance Externe
 </div>
 <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>
 <strong>Sous-traitance Impression</strong>
 </span>
 <code className="text-violet-400 font-mono">621</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>
 <strong>Sous-traitance Fabrication</strong>
 </span>
 <code className="text-violet-400 font-mono">621</code>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <div className="font-semibold text-sky-400 flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-sky-500"></span>
 Achats & Charges
 </div>
 <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Fournitures</span>
 <code className="text-sky-400 font-mono">604</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Matériel</span>
 <code className="text-sky-400 font-mono">605</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Loyer</span>
 <code className="text-sky-400 font-mono">622</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Marketing</span>
 <code className="text-sky-400 font-mono">627</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Déplacements</span>
 <code className="text-sky-400 font-mono">61</code>
 </div>
 <div className="flex justify-between items-center bg-tribal-black rounded-lg px-3 py-2">
 <span>Services</span>
 <code className="text-sky-400 font-mono">628</code>
 </div>
 </div>
 </div>

 <Callout type="tip" title="Conseil">
 La catégorie choisie détermine automatiquement le compte OHADA dans le Journal
 comptable.
 </Callout>
 </div>
 </SectionCard>
 </div>

 <div id="equipe">
 <SectionCard title="4. Gestion de l'équipe" color="violet" index={3} icon={Star}>
 <div className="space-y-4">
 <p className="text-white/60">
 L'onglet <strong>Équipe</strong> permet de gérer vos collaborateurs :
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="p-3 rounded-xl bg-indigo-900/20 border border-white/[0.06]">
 <div className="font-semibold text-tribal-accent mb-2">
 🔵 Associé / Gérant
 </div>
 <p className="text-sm text-tribal-accent">
 Propriétaires, gérants de l'entreprise
 </p>
 </div>
 <div className="p-3 rounded-xl bg-green-900/20 border border-white/[0.06]">
 <div className="font-semibold text-green-400 mb-2">
 🟢 Salarié
 </div>
 <p className="text-sm text-green-400">
 Employé permanent avec contrat de travail
 </p>
 </div>
 <div className="p-3 rounded-xl bg-amber-900/20 border border-white/[0.06]">
 <div className="font-semibold text-amber-400 mb-2">
 🟡 Contractuel
 </div>
 <p className="text-sm text-amber-400">
 Ex: Léo (menuisier) - paiement bimensuel
 </p>
 </div>
 <div className="p-3 rounded-xl bg-purple-900/20 border border-white/[0.06]">
 <div className="font-semibold text-purple-400 mb-2">
 🟣 Stagiaire
 </div>
 <p className="text-sm text-purple-400">
 Ex: Apprentis de Léo - en formation
 </p>
 </div>
 </div>

 <div className="mt-4 p-4 rounded-xl bg-tribal-black space-y-2">
 <div className="font-semibold text-white/80">
 💡 Workflow recommandé :
 </div>
 <ol className="list-decimal list-inside text-sm space-y-1 text-white/60">
 <li>
 <strong>Léo + apprentis</strong> → Équipe (Contractuel) + Dépenses → Main d'œuvre
 (Atelier)
 </li>
 <li>
 <strong>Imprimeurs</strong> → Tiers (Fournisseur) + Dépenses → Sous-traitance
 Impression
 </li>
 <li>
 <strong>Fabricant châssis</strong> → Tiers (Fournisseur) + Dépenses →
 Sous-traitance Fabrication
 </li>
 <li>
 <strong>Gérants</strong> → Équipe (Associé / Gérant)
 </li>
 </ol>
 </div>

 <Callout type="warn" title="Important">
 <strong>Interne</strong> (Léo, apprentis) = Main d'œuvre (662)
 <br />
 <strong>Externe</strong> (imprimeurs, fabricants) = Sous-traitance (621)
 </Callout>
 </div>
 </SectionCard>
 </div>

 <div id="tiers">
 <SectionCard title="5. Clients et fournisseurs (Tiers)" color="sky" index={4} icon={Users}>
 <p className="text-white/60 mb-4">
 La page <strong>Tiers</strong> vous permet de gérer votre carnet d'adresses
 professionnel : clients et fournisseurs avec leurs informations fiscales.
 </p>

 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="p-3 rounded-xl bg-blue-900/20 border border-white/[0.06]">
 <div className="font-semibold text-blue-400 flex items-center gap-2">
 <Users className="w-4 h-4" /> Clients
 </div>
 <p className="text-sm text-blue-400">
 Vos acheteurs et prospects
 </p>
 </div>
 <div className="p-3 rounded-xl bg-orange-900/20 border border-white/[0.06]">
 <div className="font-semibold text-orange-400 flex items-center gap-2">
 <Building2 className="w-4 h-4" /> Fournisseurs
 </div>
 <p className="text-sm text-orange-400">
 Vos prestataires et vendeurs
 </p>
 </div>
 </div>

 <div className="font-semibold text-white/80">
 🔍 Filtrer la liste :
 </div>
 <p className="text-sm text-white/60">
 Utilisez les boutons <strong>Clients</strong> ou <strong>Fournisseurs</strong> pour
 afficher uniquement le type souhaité. La barre de recherche filtre par nom, téléphone,
 email, NCC ou RCCM.
 </p>

 <div className="font-semibold text-white/80">
 📋 Ajouter un client/fournisseur :
 </div>
 <ol className="list-decimal list-inside space-y-1 text-sm text-white/60">
 <li>
 Cliquez sur <strong>Nouveau Client</strong> ou <strong>Nouveau Fournisseur</strong>
 </li>
 <li>Renseignez le nom, téléphone, email</li>
 <li>Ajoutez les infos fiscales : N° Compte Contribuable, RCCM, Régime fiscal</li>
 <li>Définissez les conditions : délai de paiement, plafond crédit</li>
 <li>
 Validez avec le bouton <strong>Enregistrer</strong>
 </li>
 </ol>

 <div className="font-semibold text-white/80 mt-4">
 ✏️ Modifier un tiers :
 </div>
 <p className="text-sm text-white/60">
 Cliquez sur l'icône <strong>crayon</strong> à droite de la ligne pour modifier les
 informations.
 </p>

 <div className="font-semibold text-white/80 mt-4">
 🗑️ Supprimer un tiers :
 </div>
 <p className="text-sm text-white/60">
 Cliquez sur l'icône <strong>corbeille</strong> (rouge) à droite de la ligne. Une
 confirmation vous sera demandée.
 </p>

 <Callout type="tip" title="Astuce">
 Cliquez sur une ligne pour afficher les détails : informations fiscales, conditions
 commerciales, et dernières factures liées.
 </Callout>

 <Callout type="warn" title="Attention">
 Les clients sont créés automatiquement lors de la synchronisation des commandes. Vous
 pouvez les compléter ensuite avec leurs infos fiscales.
 </Callout>
 </div>
 </SectionCard>
 </div>

 <div id="vente">
 <SectionCard title="6. Créer une facture de vente" color="violet" index={5} icon={FileText}>
 <ol className="list-decimal list-inside space-y-1">
 <li>
 Allez dans <em>Comptabilité → Factures</em>.
 </li>
 <li>
 Sélectionnez <strong>Vente</strong>, choisissez la date et le partenaire.
 </li>
 <li>Ajoutez des lignes (Qté, PU HT, TVA). Les totaux se mettent à jour.</li>
 <li>Enregistrez puis exportez si besoin (CSV/PDF).</li>
 </ol>
 </SectionCard>
 </div>

 <div id="depense">
 <SectionCard
 title="7. Enregistrer une dépense (achat)"
 color="orange"
 index={6}
 icon={ShoppingCart}
 >
 <ol className="list-decimal list-inside space-y-1">
 <li>
 Rendez-vous dans <em>Comptabilité → Dépenses</em>.
 </li>
 <li>Renseignez date, fournisseur, catégorie et montants HT/TVA.</li>
 <li>Validez. Le paiement peut être immédiat ou ultérieur.</li>
 </ol>
 <Callout type="warn" title="Attention">
 Vérifiez la catégorie de dépense pour vos analyses (par ex. Fournitures, Transport,
 etc.).
 </Callout>
 </SectionCard>
 </div>

 <div id="encaissement">
 <SectionCard title="8. Saisir un encaissement" color="emerald" index={7} icon={CreditCard}>
 <ol className="list-decimal list-inside space-y-1">
 <li>
 Ouvrez <em>Comptabilité → Encaissements</em>.
 </li>
 <li>
 Choisissez la facture à marquer <em>payée</em> et le{' '}
 <strong>compte de paiement</strong>.
 </li>
 <li>Validez: l'écriture -PAY- est générée et la facture bascule en Payée.</li>
 </ol>
 </SectionCard>
 </div>

 <div id="tva">
 <SectionCard title="9. Suivre la TVA" color="rose" index={8} icon={Receipt}>
 <ol className="list-decimal list-inside space-y-1">
 <li>
 Consultez <em>Comptabilité → TVA</em>.
 </li>
 <li>
 Vérifiez la <strong>collectée</strong>, la <strong>déductible</strong> et le{' '}
 <strong>solde</strong>.
 </li>
 <li>
 Exportez en <strong>CSV</strong> pour la déclaration.
 </li>
 </ol>
 </SectionCard>
 </div>

 <div id="livres">
 <SectionCard
 title="10. Journal, Grand-livre, Balance"
 color="slate"
 index={9}
 icon={BookOpenCheck}
 >
 <ul className="list-disc list-inside space-y-1">
 <li>
 <strong>Journal</strong> — écritures détaillées (débit/crédit, libellés, comptes).
 </li>
 <li>
 <strong>Grand-livre</strong> — soldes par compte.
 </li>
 <li>
 <strong>Balance</strong> — synthèse des comptes (débit/crédit/solde).
 </li>
 </ul>
 </SectionCard>
 </div>

 <div id="bonnes-pratiques">
 <SectionCard title="11. Bonnes pratiques" color="emerald" index={10} icon={Star}>
 <ul className="list-disc list-inside space-y-1">
 <li>Numérotez et datez systématiquement vos factures/dépenses.</li>
 <li>Enregistrez les encaissements dès qu'ils arrivent.</li>
 <li>
 Exportez chaque fin de mois vos <strong>Factures (CSV/PDF)</strong> et la{' '}
 <strong>TVA (CSV)</strong>.
 </li>
 <li>Revoyez vos paramètres (devise/TVA) en cas de changement de contexte.</li>
 </ul>
 </SectionCard>
 </div>

 <div id="depannage">
 <SectionCard title="12. Dépannage rapide" color="orange" index={11} icon={Wrench}>
 <ul className="list-disc list-inside space-y-1">
 <li>
 Facture manquante? Vérifiez le <strong>filtre</strong> (type/date) dans Factures.
 </li>
 <li>
 TVA incohérente? Confirmez le <strong>taux par défaut</strong> ou la TVA ligne par
 ligne.
 </li>
 <li>
 Paiement introuvable? Cherchez l'écriture <em>-PAY-</em> dans Journal.
 </li>
 </ul>
 <p className="text-sm text-white/50 mt-3">
 Commencez simple: ventes → encaissements → dépenses; puis explorez
 Journal/Grand-livre/Balance.
 </p>
 </SectionCard>
 </div>

 {/* Bouton retour en haut */}
 {showScrollTop && (
 <motion.button
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.8 }}
 onClick={scrollToTop}
 className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-50"
 >
 <ArrowUp className="w-5 h-5" />
 </motion.button>
 )}
 </div>
 )
}

export default GuidePage
