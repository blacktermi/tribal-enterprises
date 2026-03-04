import React, { useState, useRef, useEffect } from 'react'
import {
  BarChart3,
  ClipboardList,
  PieChart,
  TrendingUp,
  Settings,
  Receipt,
  BookOpen,
  Plus,
  Building2,
  Building,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Calculator,
  FileSpreadsheet,
  Scale,
  Clock,
  LineChart,
  Users,
  FileText,
} from 'lucide-react'
import { useAccountingStore } from '../store/accounting'
import { Badge } from '../lib/design-system'
import { AnimatePresence, motion } from 'framer-motion'
import { CreateQuoteModal } from '../components/accounting/CreateQuoteModal'

// Pages comptabilité
import { JournalPage } from './accounting/JournalPage'
import { TVAPage } from './accounting/TVAPage'
import { GrandLivrePage } from './accounting/GrandLivrePage'
import { AccountingSettingsPage } from './accounting/AccountingSettingsPage'
import { DepensesPage } from './accounting/DepensesPage'
import { PaymentsPage } from './accounting/PaymentsPage'
import { TresoreriePageV2 } from './accounting/TresoreriePageV2'
import { BalancePage } from './accounting/BalancePage'
import { BalanceAgeePage } from './accounting/BalanceAgeePage'
import { AnalyticsPage } from './accounting/AnalyticsPage'
import { GuidePage } from './accounting/GuidePage'
import { TiersPage } from './accounting/TiersPage'
import { RevenusPage } from './accounting/RevenusPage'
import { CollaborateursPage } from './accounting/CollaborateursPage'
import { UnifiedDashboardPage } from './accounting/UnifiedDashboardPage'
import { FacturesClientsPage } from './accounting/FacturesClientsPage'
import { cn } from '../lib/utils'

// Tab configuration with icons and colors
const TAB_CONFIG = [
  { id: 'unified', label: 'Tableau de bord', icon: TrendingUp, color: 'emerald' },
  { id: 'analytics', label: 'Analytique', icon: LineChart, color: 'cyan' },
  { id: 'revenus', label: 'Revenus', icon: BarChart3, color: 'emerald' },
  { id: 'expenses', label: 'Depenses', icon: PieChart, color: 'red' },
  { id: 'payments', label: 'Encaissements', icon: Banknote, color: 'emerald' },
  { id: 'tresorerie', label: 'Tresorerie', icon: Building, color: 'violet' },
  { id: 'tva', label: 'TVA', icon: Calculator, color: 'amber' },
  { id: 'journal', label: 'Journal', icon: ClipboardList, color: 'slate' },
  { id: 'grandlivre', label: 'Grand-livre', icon: FileSpreadsheet, color: 'blue' },
  { id: 'balance', label: 'Balance', icon: Scale, color: 'purple' },
  { id: 'agee', label: 'Balance agee', icon: Clock, color: 'orange' },
  { id: 'factures', label: 'Factures Clients', icon: FileText, color: 'blue' },
  { id: 'tiers', label: 'Tiers', icon: Users, color: 'violet' },
  { id: 'equipe', label: 'Equipe', icon: Users, color: 'pink' },
  { id: 'guide', label: 'Guide', icon: BookOpen, color: 'blue' },
  { id: 'settings', label: 'Parametres', icon: Settings, color: 'slate' },
] as const

type TabId = (typeof TAB_CONFIG)[number]['id']

// Quick Action Button Component
const QuickActionButton: React.FC<{
  icon: React.ElementType
  title: string
  subtitle: string
  onClick: () => void
  gradient: string
  hoverGradient: string
  iconBg: string
}> = ({ icon: Icon, title, subtitle, onClick, gradient, hoverGradient, iconBg }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'relative overflow-hidden rounded-2xl p-5 text-left w-full',
      'border transition-all duration-300',
      gradient,
      'hover:shadow-xl group'
    )}
  >
    {/* Hover effect */}
    <div
      className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        hoverGradient
      )}
    />

    {/* Decorative blobs */}
    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-500" />
    <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500" />

    <div className="relative flex items-center gap-4">
      <div
        className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', iconBg)}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-semibold text-white text-lg">{title}</p>
        <p className="text-sm text-white/70">{subtitle}</p>
      </div>
    </div>
  </motion.button>
)

export const ComptabilitePage: React.FC = () => {
  const invoices = useAccountingStore(s => s.invoices)

  // Modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  // Scroll ref for tabs
  const tabsRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const aPayer = React.useMemo(
    () => invoices.filter(i => i.type === 'sale' && !i.paid).length,
    [invoices]
  )
  const tvaDue = React.useMemo(() => {
    const collectee = invoices
      .filter(i => i.type === 'sale')
      .reduce((s, i) => s + (i.totals?.tva || 0), 0)
    const deductible = invoices
      .filter(i => i.type !== 'sale')
      .reduce((s, i) => s + (i.totals?.tva || 0), 0)
    const net = collectee - deductible
    return Math.max(0, net)
  }, [invoices])

  const [tab, setTab] = useState<TabId>('unified')

  // Check scroll position for tabs
  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(checkScroll, 300)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec glassmorphism - Rule 10 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Decorative orb - Rule 10 */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-tribal-accent/[0.06] blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-14 h-14 bg-white/[0.08] backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/[0.06]"
            >
              <Building2 className="h-7 w-7 text-tribal-accent" />
            </motion.div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-tribal-accent">Gestion financiere</p>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">
                Comptabilite
              </h1>
              <p className="text-white/50 text-sm md:text-base">
                Ventes, achats, TVA, journal et tresorerie
              </p>
            </div>
          </div>

          {/* Quick stats in header */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.06]">
              <p className="text-xs text-white/40">Factures</p>
              <p className="text-lg font-bold text-white">{invoices.length}</p>
            </div>
            {aPayer > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30">
                <p className="text-xs text-amber-200">A encaisser</p>
                <p className="text-lg font-bold text-amber-100">{aPayer}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Actions rapides - Rule 14 cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 md:p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Actions rapides</h2>
            <p className="text-sm text-white/40">
              Acces direct aux operations courantes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={FileText}
            title="Nouveau devis"
            subtitle="Creer un devis client"
            onClick={() => setShowQuoteModal(true)}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400/30"
            hoverGradient="bg-gradient-to-br from-violet-400 to-purple-500"
            iconBg="bg-white/20"
          />
          <QuickActionButton
            icon={Receipt}
            title="Voir revenus"
            subtitle="Consulter les ventes"
            onClick={() => setTab('revenus')}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400/30"
            hoverGradient="bg-gradient-to-br from-purple-400 to-indigo-500"
            iconBg="bg-white/20"
          />
          <QuickActionButton
            icon={PieChart}
            title="Nouvelle depense"
            subtitle="Enregistrer un achat"
            onClick={() => setTab('expenses')}
            gradient="bg-gradient-to-br from-rose-500 to-orange-600 border-rose-400/30"
            hoverGradient="bg-gradient-to-br from-rose-400 to-orange-500"
            iconBg="bg-white/20"
          />
          <QuickActionButton
            icon={Banknote}
            title="Encaissement"
            subtitle="Marquer une facture payee"
            onClick={() => setTab('payments')}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30"
            hoverGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
            iconBg="bg-white/20"
          />
        </div>
      </motion.div>

      {/* Onglets avec scroll horizontal sur mobile - Rule 9 */}
      <div className="relative">
        {/* Scroll buttons */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scrollTabs('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-tribal-gray shadow-lg border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scrollTabs('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-tribal-gray shadow-lg border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={tabsRef}
          onScroll={checkScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1 -mx-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TAB_CONFIG.map((T, idx) => {
            const Icon = T.icon
            const active = tab === T.id
            return (
              <motion.button
                key={T.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setTab(T.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2',
                  active
                    ? 'bg-tribal-accent text-tribal-black border-tribal-accent shadow-lg'
                    : 'bg-white/[0.04] text-white/50 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap font-medium">{T.label}</span>
                {T.id === 'tva' && tvaDue > 0 && (
                  <Badge variant="warning" size="sm">
                    {(tvaDue / 1000).toFixed(0)}k
                  </Badge>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'unified' && <UnifiedDashboardPage />}
          {tab === 'revenus' && <RevenusPage />}
          {tab === 'guide' && <GuidePage />}
          {tab === 'expenses' && <DepensesPage />}
          {tab === 'payments' && <PaymentsPage />}
          {tab === 'tresorerie' && <TresoreriePageV2 />}
          {tab === 'factures' && <FacturesClientsPage />}
          {tab === 'tiers' && <TiersPage />}
          {tab === 'equipe' && <CollaborateursPage />}
          {tab === 'journal' && <JournalPage />}
          {tab === 'tva' && <TVAPage />}
          {tab === 'grandlivre' && <GrandLivrePage />}
          {tab === 'balance' && <BalancePage />}
          {tab === 'agee' && <BalanceAgeePage />}
          {tab === 'analytics' && <AnalyticsPage />}
          {tab === 'settings' && <AccountingSettingsPage />}
        </motion.div>
      </AnimatePresence>

      {/* Modal creation devis */}
      <CreateQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onSuccess={() => {
          // Optionnel: naviguer vers l'onglet revenus pour voir le devis
          setTab('revenus')
        }}
      />
    </div>
  )
}
