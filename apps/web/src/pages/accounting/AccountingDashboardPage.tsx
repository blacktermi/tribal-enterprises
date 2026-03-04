import React, { useMemo } from 'react'
import { useAccountingStore } from '../../store/accounting'
import { useAccountingData } from '../../lib/hooks/useAccountingData'
import { AccountingFiltersBar } from '../../components/accounting/AccountingFiltersBar'
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 ResponsiveContainer,
 Tooltip,
 CartesianGrid,
 Legend,
} from 'recharts'

import type { UnifiedRevenue } from '../../lib/hooks/useUnifiedRevenues'

// Calculer le montant HT d'un revenu unifié (sans livraison)
function getRevenueHT(revenue: UnifiedRevenue): number {
 const deliveryFee = Number((revenue.metadata as Record<string, unknown>)?.deliveryFee || 0)
 return Math.max(0, Number(revenue.amount) - deliveryFee)
}

export const AccountingDashboardPage: React.FC = () => {
 const settings = useAccountingStore(s => s.settings)

 // Utiliser le nouveau hook qui gère filtres + chargement automatiquement
 const { data: filteredRevenues, loading, filters } = useAccountingData({ autoSync: false })
 const { selectedYear } = filters

 const formatCurrency = (val: number) =>
 val.toLocaleString('fr-FR', { style: 'currency', currency: settings.currency })

 // Calculer les totaux depuis les revenus filtrés
 const totals = useMemo(() => {
 let ventesHT = 0
 let ventesTTC = 0
 let paiementsHT = 0
 let paiementsTTC = 0
 let acomptesTotal = 0
 let balanceTotal = 0 // Solde impayé total
 let nbVentes = 0
 let nbPaiements = 0
 let nbAcomptes = 0
 let nbImpayees = 0

 // Balance âgée (aging)
 const now = new Date()
 let aging0_30 = 0
 let aging31_60 = 0
 let aging61_90 = 0
 let aging90Plus = 0

 for (const revenue of filteredRevenues) {
 const ht = getRevenueHT(revenue)
 const ttc = ht // TVA désactivée - SARL exonérée

 // Montant réellement payé
 const paidAmount = Number(revenue.paidAmount || 0)
 const remaining = Number(revenue.balance || 0)

 ventesHT += ht
 ventesTTC += ttc
 nbVentes++

 if (revenue.isPaid) {
 paiementsHT += ht
 paiementsTTC += ttc
 nbPaiements++
 } else {
 // Revenu non soldé
 if (paidAmount > 0 && remaining > 0) {
 // Acompte partiel reçu
 acomptesTotal += paidAmount
 nbAcomptes++
 }

 // Calculer le solde impayé et l'ancienneté
 if (remaining > 0) {
 balanceTotal += remaining
 nbImpayees++

 // Calculer l'âge de la créance
 const orderDate = new Date(revenue.invoiceDate || revenue.createdAt || now)
 const ageDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))

 if (ageDays <= 30) {
 aging0_30 += remaining
 } else if (ageDays <= 60) {
 aging31_60 += remaining
 } else if (ageDays <= 90) {
 aging61_90 += remaining
 } else {
 aging90Plus += remaining
 }
 }
 }
 }

 // TVA désactivée - SARL exonérée (CA < 200M FCFA)
 const tvaCollectee = 0

 return {
 ventesHT,
 ventesTTC,
 paiementsHT,
 paiementsTTC,
 acomptesTotal,
 balanceTotal,
 nbVentes,
 nbPaiements,
 nbAcomptes,
 nbImpayees,
 tvaCollectee,
 nbOperations: nbVentes,
 // Balance âgée
 aging: {
 current: aging0_30, // 0-30 jours
 days30: aging31_60, // 31-60 jours
 days60: aging61_90, // 61-90 jours
 days90Plus: aging90Plus, // +90 jours
 },
 }
 }, [filteredRevenues])

 // Ventes par jour
 const byDay = useMemo(() => {
 const map = new Map<string, { date: string; ca: number; tva: number }>()
 for (const revenue of filteredRevenues) {
 const dateStr = (revenue.invoiceDate || revenue.createdAt || '').slice(0, 10)
 if (!dateStr) continue
 const ht = getRevenueHT(revenue)
 const tva = 0 // TVA désactivée
 const v = map.get(dateStr) || { date: dateStr, ca: 0, tva: 0 }
 v.ca += ht
 v.tva += tva
 map.set(dateStr, v)
 }
 return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
 }, [filteredRevenues])

 // Encaissements par jour (revenus soldés)
 const encaissementsByDay = useMemo(() => {
 const map = new Map<string, { date: string; montant: number }>()
 for (const revenue of filteredRevenues) {
 if (!revenue.isPaid) continue
 const dateStr = (revenue.paidAt || revenue.invoiceDate || revenue.createdAt || '').slice(
 0,
 10
 )
 if (!dateStr) continue
 const ttc = getRevenueHT(revenue) // TTC = HT (pas de TVA)
 const v = map.get(dateStr) || { date: dateStr, montant: 0 }
 v.montant += ttc
 map.set(dateStr, v)
 }
 return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
 }, [filteredRevenues])

 // Trésorerie cumulée
 const treasuryData = useMemo(() => {
 let cum = 0
 return encaissementsByDay.map(({ date, montant }) => {
 cum += montant
 return { date, treso: cum }
 })
 }, [encaissementsByDay])

 if (loading && filteredRevenues.length === 0) {
 return (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
 </div>
 )
 }

 return (
 <div className="space-y-4">
 {/* Header avec filtres - composant réutilisable persistant */}
 <AccountingFiltersBar title="Tableau de bord" />

 {/* KPIs - Ligne 1: Principaux indicateurs */}
 <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
 <div className="text-sm text-white/70">Chiffre d'affaires HT</div>
 <div className="text-2xl font-bold">{formatCurrency(totals.ventesHT)}</div>
 <div className="text-xs text-white/60 mt-1">{totals.nbVentes} ventes</div>
 </div>
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white">
 <div className="text-sm text-white/70">Encaissés TTC</div>
 <div className="text-2xl font-bold">{formatCurrency(totals.paiementsTTC)}</div>
 <div className="text-xs text-white/60 mt-1">{totals.nbPaiements} paiements</div>
 </div>
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white">
 <div className="text-sm text-white/70">Acomptes reçus</div>
 <div className="text-2xl font-bold">{formatCurrency(totals.acomptesTotal)}</div>
 <div className="text-xs text-white/60 mt-1">{totals.nbAcomptes} acomptes</div>
 </div>
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 text-white">
 <div className="text-sm text-white/70">Total encaissé</div>
 <div className="text-2xl font-bold">
 {formatCurrency(totals.paiementsTTC + totals.acomptesTotal)}
 </div>
 <div className="text-xs text-white/60 mt-1">Paiements + Acomptes</div>
 </div>
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-rose-500 to-rose-600 p-4 text-white">
 <div className="text-sm text-white/70">Balance (solde dû)</div>
 <div className="text-2xl font-bold">{formatCurrency(totals.balanceTotal)}</div>
 <div className="text-xs text-white/60 mt-1">{totals.nbImpayees} commandes</div>
 </div>
 <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white">
 <div className="text-sm text-white/70">Opérations</div>
 <div className="text-2xl font-bold">{totals.nbOperations}</div>
 <div className="text-xs text-white/60 mt-1">Journal comptable</div>
 </div>
 </div>

 {/* KPIs - Ligne 2: Balance Âgée (Aging) */}
 <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
 <div className="text-sm font-medium text-white/80 mb-3">
 Balance Âgée (Créances clients)
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="rounded-lg bg-green-900/20 p-3 border border-white/[0.06]">
 <div className="text-xs text-green-400">0-30 jours</div>
 <div className="text-lg font-bold text-green-400">
 {formatCurrency(totals.aging.current)}
 </div>
 </div>
 <div className="rounded-lg bg-yellow-900/20 p-3 border border-white/[0.06]">
 <div className="text-xs text-yellow-400">31-60 jours</div>
 <div className="text-lg font-bold text-yellow-400">
 {formatCurrency(totals.aging.days30)}
 </div>
 </div>
 <div className="rounded-lg bg-orange-900/20 p-3 border border-white/[0.06]">
 <div className="text-xs text-orange-400">61-90 jours</div>
 <div className="text-lg font-bold text-orange-400">
 {formatCurrency(totals.aging.days60)}
 </div>
 </div>
 <div className="rounded-lg bg-red-950/30 p-3 border border-white/[0.06]">
 <div className="text-xs text-red-400">+90 jours</div>
 <div className="text-lg font-bold text-red-400">
 {formatCurrency(totals.aging.days90Plus)}
 </div>
 </div>
 </div>
 </div>

 {/* Graphique Ventes par jour */}

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 md:col-span-4 h-64">
 <div className="text-sm text-white/50 mb-2">
 Ventes (HT) par jour - {selectedYear}
 </div>
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={byDay} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
 <XAxis dataKey="date" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
 <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
 <Tooltip formatter={(v: number) => formatCurrency(v)} />
 <Legend />
 <Line
 type="monotone"
 dataKey="ca"
 name="CA HT"
 stroke="#0ea5e9"
 strokeWidth={2}
 dot={false}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Message TVA Exonérée */}
 <div className="rounded-xl border border-white/[0.06] bg-amber-900/20 p-4 h-64 flex flex-col items-center justify-center text-center">
 <div className="text-amber-400 text-4xl mb-3">🏛️</div>
 <div className="text-lg font-semibold text-amber-400">
 TVA non applicable
 </div>
 <div className="text-sm text-amber-400 mt-2">SARL exonérée</div>
 <div className="text-xs text-amber-400 mt-1">
 (CA &lt; 200M FCFA, art. 293 B du CGI)
 </div>
 </div>

 {/* Graphique Trésorerie */}
 <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 md:col-span-3 h-64">
 <div className="text-sm text-white/50 mb-2">
 Trésorerie (encaissements cumulés) - {selectedYear}
 </div>
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={treasuryData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
 <XAxis dataKey="date" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
 <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
 <Tooltip formatter={(v: number) => formatCurrency(v)} />
 <Legend />
 <Line
 type="monotone"
 dataKey="treso"
 name="Trésorerie"
 stroke="#10b981"
 strokeWidth={2}
 dot={false}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 )
}
