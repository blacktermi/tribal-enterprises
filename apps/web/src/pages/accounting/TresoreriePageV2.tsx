/**
 * TresoreriePageV2 - Nouvelle version utilisant la base de données
 * Remplace progressivement l'ancienne version basée sur localStorage
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 Landmark,
 ArrowRightLeft,
 Plus,
 Wallet,
 TrendingUp,
 TrendingDown,
 AlertTriangle,
 RefreshCw,
 DollarSign,
 PiggyBank,
 Settings,
} from 'lucide-react'
import { useTreasuryPage } from '../../lib/hooks/useTreasury'
import {
 TreasurySummaryCard,
 TransferForm,
 TransferList,
 FeeForm,
 AdjustmentForm,
 FEE_TYPE_LABELS,
 ADJUSTMENT_TYPE_LABELS,
 formatCurrency,
 formatDate,
} from '../../components/treasury'
import { TreasuryMigrationPanel } from '../../components/treasury/TreasuryMigrationPanel'

type TabId = 'soldes' | 'virements' | 'frais' | 'ajustements' | 'migration'

export function TresoreriePageV2() {
 // Hook principal
 const {
 accounts,
 summary,
 transfers,
 fees,
 adjustments,
 isLoading,
 error,
 createTransfer,
 deleteTransfer,
 createFee,
 deleteFee,
 createAdjustment,
 deleteAdjustment,
 refetch,
 } = useTreasuryPage()

 // UI State
 const [activeTab, setActiveTab] = useState<TabId>('soldes')
 const [showTransferForm, setShowTransferForm] = useState(false)
 const [showFeeForm, setShowFeeForm] = useState(false)
 const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
 const [isSubmitting, setIsSubmitting] = useState(false)

 // Handlers
 const handleCreateTransfer = async (data: Parameters<typeof createTransfer>[0]) => {
 setIsSubmitting(true)
 try {
 await createTransfer(data)
 setShowTransferForm(false)
 } catch (err) {
 console.error('Erreur création virement:', err)
 alert('Erreur lors de la création du virement')
 } finally {
 setIsSubmitting(false)
 }
 }

 const handleCreateFee = async (data: Parameters<typeof createFee>[0]) => {
 setIsSubmitting(true)
 try {
 await createFee(data)
 setShowFeeForm(false)
 } catch (err) {
 console.error('Erreur création frais:', err)
 alert('Erreur lors de la création des frais')
 } finally {
 setIsSubmitting(false)
 }
 }

 const handleCreateAdjustment = async (data: Parameters<typeof createAdjustment>[0]) => {
 setIsSubmitting(true)
 try {
 await createAdjustment(data)
 setShowAdjustmentForm(false)
 } catch (err) {
 console.error('Erreur création ajustement:', err)
 alert("Erreur lors de la création de l'ajustement")
 } finally {
 setIsSubmitting(false)
 }
 }

 const tabs = [
 { id: 'soldes' as TabId, label: 'Soldes', icon: Wallet },
 { id: 'virements' as TabId, label: 'Virements', icon: ArrowRightLeft },
 { id: 'frais' as TabId, label: 'Frais', icon: TrendingDown },
 { id: 'ajustements' as TabId, label: 'Ajustements', icon: DollarSign },
 { id: 'migration' as TabId, label: 'Migration', icon: Settings },
 ]

 return (
 <div className="space-y-6">
 {/* En-tête */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
 <Landmark className="w-5 h-5 text-white" />
 </div>
 Trésorerie
 <span className="text-xs px-2 py-0.5 text-emerald-400 rounded-full">
 v2
 </span>
 </h1>
 <p className="text-sm text-white/50 mt-1">
 Vue consolidée de vos soldes et mouvements (données en base)
 </p>
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => refetch()}
 disabled={isLoading}
 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-white/60 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
 Actualiser
 </button>
 </div>
 </div>

 {/* Erreur */}
 {error && (
 <div className="p-4 rounded-xl bg-red-950/30 border border-white/[0.06] text-red-400">
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-5 w-5" />
 <span>Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}</span>
 </div>
 </div>
 )}

 {/* Carte trésorerie totale */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden glass rounded-2xl p-6 text-white"
 >
 <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
 <div className="relative flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2 text-violet-300 text-sm font-medium mb-1">
 <PiggyBank className="w-4 h-4" />
 Trésorerie Totale
 </div>
 <p
 className={`text-2xl sm:text-4xl font-bold mt-2 ${
 (summary?.totalBalance || 0) < 0 ? 'text-red-300' : ''
 }`}
 >
 {formatCurrency(summary?.totalBalance || 0)}
 </p>
 <p className="text-violet-300 text-sm mt-2">
 {summary?.accounts?.length || 0} comptes actifs
 </p>
 </div>
 </div>
 </motion.div>

 {/* Onglets */}
 <div className="flex gap-2 border-b border-white/[0.06] overflow-x-auto">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
 activeTab === tab.id
 ? 'border-tribal-accent text-tribal-accent'
 : 'border-transparent text-white/40 hover:text-white/80'
 }`}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Contenu */}
 <AnimatePresence mode="wait">
 {/* Onglet Soldes */}
 {activeTab === 'soldes' && (
 <motion.div
 key="soldes"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 >
 <TreasurySummaryCard summary={summary} isLoading={isLoading} onRefresh={refetch} />
 </motion.div>
 )}

 {/* Onglet Virements */}
 {activeTab === 'virements' && (
 <motion.div
 key="virements"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-white">
 Virements internes
 </h2>
 <button
 onClick={() => setShowTransferForm(true)}
 className="flex items-center gap-2 px-4 py-2 bg-tribal-accent text-tribal-black font-semibold rounded-xl hover:bg-tribal-accent-light transition-colors"
 >
 <Plus className="w-4 h-4" />
 Nouveau virement
 </button>
 </div>

 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 <TransferList transfers={transfers} onDelete={deleteTransfer} isLoading={isLoading} />
 </div>
 </motion.div>
 )}

 {/* Onglet Frais */}
 {activeTab === 'frais' && (
 <motion.div
 key="frais"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-white">
 Frais bancaires
 </h2>
 <button
 onClick={() => setShowFeeForm(true)}
 className="flex items-center gap-2 px-4 py-2 bg-tribal-accent text-tribal-black font-semibold rounded-xl hover:bg-tribal-accent-light transition-colors"
 >
 <Plus className="w-4 h-4" />
 Nouveaux frais
 </button>
 </div>

 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 {fees.length === 0 ? (
 <div className="text-center p-8 text-white/50">
 <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-20" />
 <p>Aucun frais enregistré</p>
 </div>
 ) : (
 <div className="divide-y">
 {fees.map(fee => (
 <div
 key={fee.id}
 className="flex items-center justify-between py-3 px-4 hover:bg-tribal-black"
 >
 <div className="flex items-center gap-3">
 <TrendingDown className="h-5 w-5 text-red-500" />
 <div>
 <div className="font-medium">{FEE_TYPE_LABELS[fee.type] || fee.type}</div>
 <div className="text-sm text-white/50">
 {formatDate(fee.date)} • {fee.account?.name || 'Compte'}
 {fee.memo && ` • ${fee.memo}`}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="font-semibold text-red-400">
 -{formatCurrency(fee.amount)}
 </div>
 <button
 onClick={() => deleteFee(fee.id)}
 className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors"
 >
 <AlertTriangle className="h-4 w-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </motion.div>
 )}

 {/* Onglet Ajustements */}
 {activeTab === 'ajustements' && (
 <motion.div
 key="ajustements"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-white">
 Ajustements de trésorerie
 </h2>
 <button
 onClick={() => setShowAdjustmentForm(true)}
 className="flex items-center gap-2 px-4 py-2 bg-tribal-accent text-tribal-black font-semibold rounded-xl hover:bg-tribal-accent-light transition-colors"
 >
 <Plus className="w-4 h-4" />
 Nouvel ajustement
 </button>
 </div>

 <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
 {adjustments.length === 0 ? (
 <div className="text-center p-8 text-white/50">
 <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
 <p>Aucun ajustement enregistré</p>
 </div>
 ) : (
 <div className="divide-y">
 {adjustments.map(adj => {
 const isPositive = adj.amount >= 0
 return (
 <div
 key={adj.id}
 className="flex items-center justify-between py-3 px-4 hover:bg-tribal-black"
 >
 <div className="flex items-center gap-3">
 {isPositive ? (
 <TrendingUp className="h-5 w-5 text-green-500" />
 ) : (
 <TrendingDown className="h-5 w-5 text-red-500" />
 )}
 <div>
 <div className="font-medium">
 {ADJUSTMENT_TYPE_LABELS[adj.type] || adj.type}
 {adj.associateName && ` - ${adj.associateName}`}
 </div>
 <div className="text-sm text-white/50">
 {formatDate(adj.date)} • {adj.account?.name || 'Compte'}
 {adj.memo && ` • ${adj.memo}`}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div
 className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}
 >
 {isPositive ? '+' : ''}
 {formatCurrency(adj.amount)}
 </div>
 <button
 onClick={() => deleteAdjustment(adj.id)}
 className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors"
 >
 <AlertTriangle className="h-4 w-4" />
 </button>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 </motion.div>
 )}

 {/* Onglet Migration */}
 {activeTab === 'migration' && (
 <motion.div
 key="migration"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-4"
 >
 <TreasuryMigrationPanel />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Modales */}
 <AnimatePresence>
 {showTransferForm && (
 <TransferForm
 accounts={accounts}
 onSubmit={handleCreateTransfer}
 onClose={() => setShowTransferForm(false)}
 isSubmitting={isSubmitting}
 />
 )}

 {showFeeForm && (
 <FeeForm
 accounts={accounts}
 onSubmit={handleCreateFee}
 onClose={() => setShowFeeForm(false)}
 isSubmitting={isSubmitting}
 />
 )}

 {showAdjustmentForm && (
 <AdjustmentForm
 accounts={accounts}
 onSubmit={handleCreateAdjustment}
 onClose={() => setShowAdjustmentForm(false)}
 isSubmitting={isSubmitting}
 />
 )}
 </AnimatePresence>
 </div>
 )
}

export default TresoreriePageV2
