import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
 BarChart3,
 TrendingUp,
 Download,
 X,
 Coins,
 Landmark,
 TrendingDown,
 Briefcase,
 Calculator,
 Plus,
 Trash2,
 Building2,
} from 'lucide-react'
import { useAccountingStore } from '../../store/accounting'
import { useUnifiedRevenues } from '../../lib/hooks/useUnifiedRevenues'
import { useAccountingFilters, filterRevenuesByPlatform } from '../../store/accountingFilters'
import { useTresorerie } from '../../lib/hooks/useTresorerie'
import { AccountingFiltersBar } from '../../components/accounting/AccountingFiltersBar'
import { authService } from '../../services/auth.service'
import { Sparkline } from '../../components/charts/Sparkline'
import { BarChart } from '../../components/charts/BarChart'
import { DonutChart } from '../../components/charts/DonutChart'
import { downloadPDF, downloadPDFMulti } from '../../lib/svgExport'

function groupByMonth(dates: Array<{ date: string; value: number }>) {
 const map = new Map<string, number>()
 for (const r of dates) {
 const d = new Date(r.date)
 const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
 map.set(key, (map.get(key) || 0) + r.value)
 }
 const keys = Array.from(map.keys()).sort()
 return keys.map(k => ({ key: k, total: map.get(k)! }))
}

// Calculer le montant HT d'un revenu unifié (sans frais de livraison)
function getRevenueHT(revenue: { amount: number; metadata?: Record<string, unknown> }): number {
 const deliveryFee = Number(revenue.metadata?.deliveryFee || 0)
 return Math.max(0, Number(revenue.amount) - deliveryFee)
}

export const AnalyticsPage: React.FC = () => {
 // Filtres globaux persistants
 const { selectedYear, selectedPeriod, selectedMonth, selectedPlatform } = useAccountingFilters()

 // Calculer les dates de filtre pour useUnifiedRevenues
 const dateFilters = useMemo(() => {
 const now = new Date()
 let startDate: string | undefined
 let endDate: string | undefined

 if (selectedPeriod === 'all') {
 // Pas de filtre de date
 } else if (selectedPeriod === 'year') {
 startDate = `${selectedYear}-01-01`
 endDate = `${selectedYear}-12-31`
 } else if (selectedPeriod === 'month') {
 const month = selectedMonth ?? now.getMonth()
 const monthStr = String(month + 1).padStart(2, '0')
 startDate = `${selectedYear}-${monthStr}-01`
 // Dernier jour du mois
 const lastDay = new Date(selectedYear, month + 1, 0).getDate()
 endDate = `${selectedYear}-${monthStr}-${lastDay}`
 } else if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(now.getMonth() / 3)
 const startMonth = currentQuarter * 3
 startDate = `${selectedYear}-${String(startMonth + 1).padStart(2, '0')}-01`
 const endMonth = startMonth + 2
 const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate()
 endDate = `${selectedYear}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`
 } else if (selectedPeriod === 'week') {
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 startDate = weekAgo.toISOString().slice(0, 10)
 endDate = now.toISOString().slice(0, 10)
 }

 return { startDate, endDate }
 }, [selectedYear, selectedPeriod, selectedMonth])

 // Hook unifié pour les revenus (Print + Agency + Kaui)
 // Limit élevé pour récupérer TOUS les revenus (calcul CA correct)
 const { data: unifiedRevenues } = useUnifiedRevenues({
 filters: {
 startDate: dateFilters.startDate,
 endDate: dateFilters.endDate,
 limit: 10000,
 },
 includeSummary: false,
 })

 // Filtrer les revenus par période (déjà fait côté API, mais on garde pour cohérence locale)
 // Et par plateforme (filtre global)
 const filteredRevenues = useMemo(() => {
 // D'abord filtrer par plateforme
 let filtered = filterRevenuesByPlatform(unifiedRevenues, selectedPlatform)

 // Puis filtrer par période
 return filtered.filter(rev => {
 const revDate = new Date(rev.invoiceDate)
 const revYear = revDate.getFullYear()

 if (selectedPeriod === 'all') return true
 if (revYear !== selectedYear) return false

 if (selectedPeriod === 'month') {
 const targetMonth = selectedMonth ?? new Date().getMonth()
 return revDate.getMonth() === targetMonth
 }

 if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(new Date().getMonth() / 3)
 const revQuarter = Math.floor(revDate.getMonth() / 3)
 return revQuarter === currentQuarter
 }

 if (selectedPeriod === 'week') {
 const now = new Date()
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 return revDate >= weekAgo
 }

 return true // 'year' - déjà filtré par année
 })
 }, [unifiedRevenues, selectedYear, selectedPeriod, selectedMonth, selectedPlatform])

 // Hook pour la trésorerie RÉELLE (sans filtre de période) - pour calcul dividendes
 const { totalTresorerie: tresorerieReelleTotale } = useTresorerie({ ignoreFilters: true })

 // Données store (pour dépenses et settings)
 const storeInvoices = useAccountingStore(s => s.invoices)
 const settings = useAccountingStore(s => s.settings)
 const currency = settings.currency
 const [showCompare, setShowCompare] = useState<boolean>(true)
 const [partnerFilter, setPartnerFilter] = useState<string>('')
 const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('')

 const formatCurrency = (val: number) =>
 val.toLocaleString('fr-FR', { style: 'currency', currency: settings.currency })

 // Filtrer les dépenses du store PAR PÉRIODE
 const filteredExpenses = useMemo(() => {
 return storeInvoices.filter(i => {
 if (i.type !== 'expense' && i.type !== 'purchase') return false

 // Filtre par période globale (année/mois)
 if (selectedPeriod !== 'all') {
 const expenseDate = new Date(i.date)
 const expenseYear = expenseDate.getFullYear()

 // Filtre par année
 if (expenseYear !== selectedYear) return false

 // Filtre par mois si sélectionné
 if (selectedPeriod === 'month') {
 const targetMonth =
 selectedMonth !== null && selectedMonth !== undefined
 ? selectedMonth
 : new Date().getMonth()
 if (expenseDate.getMonth() !== targetMonth) return false
 }

 // Filtre par trimestre
 if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(new Date().getMonth() / 3)
 const expenseQuarter = Math.floor(expenseDate.getMonth() / 3)
 if (expenseQuarter !== currentQuarter) return false
 }

 // Filtre par semaine
 if (selectedPeriod === 'week') {
 const now = new Date()
 const weekAgo = new Date(now)
 weekAgo.setDate(weekAgo.getDate() - 7)
 if (expenseDate < weekAgo) return false
 }
 }

 if (partnerFilter) {
 const pname = i.partnerName || ''
 if (!pname.toLowerCase().includes(partnerFilter.toLowerCase())) return false
 }
 if (expenseCategoryFilter) {
 if ((i.expenseCategory || '').toLowerCase() !== expenseCategoryFilter.toLowerCase())
 return false
 }
 return true
 })
 }, [
 storeInvoices,
 partnerFilter,
 expenseCategoryFilter,
 selectedYear,
 selectedPeriod,
 selectedMonth,
 ])

 // CA mensuel depuis les revenus unifiés (HT, sans frais de livraison)
 const caMonthly = useMemo(
 () =>
 groupByMonth(
 filteredRevenues.map(rev => ({
 date: rev.invoiceDate,
 value: getRevenueHT(rev),
 }))
 ),
 [filteredRevenues]
 )

 // CA N-1 (approximation)
 const caMonthlyPrev = useMemo(() => {
 const lastYear = filteredRevenues.map(rev => ({
 date: new Date(
 new Date(rev.invoiceDate).setFullYear(new Date(rev.invoiceDate).getFullYear() - 1)
 ).toISOString(),
 value: getRevenueHT(rev),
 }))
 const grouped = groupByMonth(lastYear)
 const map = new Map(grouped.map(g => [g.key, g.total]))
 return caMonthly.map(m => map.get(m.key) || 0)
 }, [filteredRevenues, caMonthly])

 // Dépenses mensuelles depuis le store
 const purchasesMonthly = useMemo(
 () =>
 groupByMonth(
 filteredExpenses
 .filter(i => i.type === 'purchase')
 .map(i => ({ date: i.date, value: i.totals?.ttc || 0 }))
 ),
 [filteredExpenses]
 )
 const expensesMonthly = useMemo(
 () =>
 groupByMonth(
 filteredExpenses
 .filter(i => i.type === 'expense')
 .map(i => ({ date: i.date, value: i.totals?.ttc || 0 }))
 ),
 [filteredExpenses]
 )

 // TVA mensuelle - DÉSACTIVÉE (SARL exonérée)
 const tvaMonthly = useMemo(() => {
 // TVA collectée = 0 (désactivée)
 const ventesTva = filteredRevenues.map(rev => ({
 date: rev.invoiceDate,
 value: 0, // TVA désactivée
 }))

 // TVA déductible = 0 (désactivée)
 const depensesTva = filteredExpenses.map(i => ({
 date: i.date,
 value: 0, // TVA désactivée
 }))

 return groupByMonth([...ventesTva, ...depensesTva])
 }, [filteredRevenues, filteredExpenses])

 const tvaMonthlyPrev = useMemo(() => {
 const shifted = filteredRevenues.map(rev => ({
 date: new Date(
 new Date(rev.invoiceDate).setFullYear(new Date(rev.invoiceDate).getFullYear() - 1)
 ).toISOString(),
 value: 0, // TVA désactivée
 }))
 const grouped = groupByMonth(shifted)
 const map = new Map(grouped.map(g => [g.key, g.total]))
 return tvaMonthly.map(m => map.get(m.key) || 0)
 }, [filteredRevenues, tvaMonthly])

 // Tendance trésorerie (encaissements cumulés)
 const tresoTrend = useMemo(() => {
 const map = new Map<string, number>()

 // Encaissements depuis les revenus payés
 for (const rev of filteredRevenues) {
 // Utiliser les paiements si disponibles
 if (rev.payments && rev.payments.length > 0) {
 for (const payment of rev.payments) {
 const paymentDate = new Date(payment.receivedAt).toISOString().slice(0, 10)
 map.set(paymentDate, (map.get(paymentDate) || 0) + payment.amount)
 }
 } else if (rev.isPaid) {
 // Sinon, utiliser le montant payé à la date de facture
 const key = new Date(rev.invoiceDate).toISOString().slice(0, 10)
 map.set(key, (map.get(key) || 0) + rev.paidAmount)
 }
 }

 // Soustraire les dépenses
 for (const expense of filteredExpenses) {
 const key = new Date(expense.date).toISOString().slice(0, 10)
 const ttc = expense.totals?.ttc || 0
 map.set(key, (map.get(key) || 0) - ttc)
 }

 const keys = Array.from(map.keys()).sort()
 let acc = 0
 return keys.map(k => {
 acc += map.get(k)!
 return { date: k, total: acc }
 })
 }, [filteredRevenues, filteredExpenses])

 // Distribution par mode de paiement (depuis les revenus unifiés)
 const payDistribution = useMemo(() => {
 const acc: Record<string, number> = {}

 for (const rev of filteredRevenues) {
 // Si des paiements existent, les utiliser
 if (rev.payments && rev.payments.length > 0) {
 for (const payment of rev.payments) {
 const method = payment.method || 'Autre'
 acc[method] = (acc[method] || 0) + payment.amount
 }
 } else if (rev.isPaid) {
 // Sinon utiliser le mode depuis les metadata
 const metadata = rev.metadata as Record<string, unknown> | undefined
 const method =
 (metadata?.payment_method as string) || (metadata?.paymentMethod as string) || 'Autre'
 acc[method] = (acc[method] || 0) + rev.paidAmount
 }
 }

 const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
 return Object.entries(acc).map(([label, value], i) => ({
 label,
 value,
 color: palette[i % palette.length],
 }))
 }, [filteredRevenues])

 // Calculs globaux
 const totalCA = caMonthly.reduce((s, x) => s + x.total, 0)
 const totalTVA = tvaMonthly.reduce((s, x) => s + x.total, 0)
 const lastTreso = tresoTrend.slice(-1)[0]?.total || 0
 const totalExpenses =
 purchasesMonthly.reduce((s, x) => s + x.total, 0) +
 expensesMonthly.reduce((s, x) => s + x.total, 0)

 // === CALCUL COMPLET DES DIVIDENDES ===

 // Créances clients HT (soldes restants - balance MOINS frais de livraison restants)
 const creancesClients = useMemo(() => {
 return filteredRevenues.reduce((total, rev) => {
 const deliveryFee = Number((rev.metadata as Record<string, unknown>)?.deliveryFee || 0)
 const unpaidRatio = rev.amount > 0 ? rev.balance / rev.amount : 0
 // Frais de livraison non payés proportionnellement
 const deliveryFeeUnpaid = deliveryFee * unpaidRatio
 // Créance HT = balance - frais de livraison non payés
 const balanceHT = Math.max(0, rev.balance - deliveryFeeUnpaid)
 return total + balanceHT
 }, 0)
 }, [filteredRevenues])

 // 3-5. TVA - DÉSACTIVÉE (SARL exonérée)

 // === CALCUL AUTOMATIQUE INVESTISSEMENTS & AMORTISSEMENTS ===
 // Investissements = somme des dépenses marquées isInvestment
 const investissementsAuto = useMemo(() => {
 return filteredExpenses
 .filter(i => i.isInvestment === true)
 .reduce((sum, i) => sum + (i.totals?.ttc || 0), 0)
 }, [filteredExpenses])

 // Amortissements annuels = somme des (investissement / durée)
 const amortissementsAuto = useMemo(() => {
 return Math.round(
 filteredExpenses
 .filter(i => i.isInvestment === true)
 .reduce((sum, i) => {
 const duree = i.investmentDuration || 5 // 5 ans par défaut
 return sum + (i.totals?.ttc || 0) / duree
 }, 0)
 )
 }, [filteredExpenses])

 // Charges sociales = somme des dépenses marquées isChargesSociales
 const chargesSocialesAuto = useMemo(() => {
 return filteredExpenses
 .filter(i => i.isChargesSociales === true)
 .reduce((sum, i) => sum + (i.totals?.ttc || 0), 0)
 }, [filteredExpenses])

 // === PARAMÈTRES FINANCIERS AJUSTABLES (valeurs par défaut CI) ===
 // Les investissements, amortissements et charges sociales sont maintenant calculés automatiquement
 const investissements = investissementsAuto
 const amortissements = amortissementsAuto
 const chargesSociales = chargesSocialesAuto
 const [reserveLegale, setReserveLegale] = useState(10) // % réserve légale obligatoire (10% jusqu'à 1/5 du capital)
 const [reserveStatutaire, setReserveStatutaire] = useState(5) // % réserve statutaire (5% recommandé)
 const [reportANouveau, _setReportANouveau] = useState(0) // Report à nouveau
 const [impotSociete, setImpotSociete] = useState(25) // % IS (25% en CI)
 const [imfPourcent, setImfPourcent] = useState(0.5) // % IMF (Impôt Minimum Forfaitaire = 0.5% du CA TTC)

 // === CALCULS FINANCIERS COMPLETS ===
 // IMPORTANT: Les salaires des gérants sont des charges déductibles de l'IS
 // On doit calculer l'IS en tenant compte de ces salaires

 // D'abord, on calcule les salaires (déplacé ici car nécessaire pour le calcul IS)
 // === RÉMUNÉRATIONS DES GÉRANTS ===
 // Stratégie: Salaire mensuel + Dividendes annuels

 // Type pour l'historique des salaires
 type SalaryEntry = {
 id: string
 dateEffet: string // Format:"YYYY-MM-01"
 montant: number
 motif?: string
 }

 // Périodes recommandées pour les augmentations
 const PERIODES_RECOMMANDEES = [
 {
 mois: 1,
 label: 'Janvier',
 raison:"Début d'exercice fiscal - Idéal pour aligner avec les objectifs annuels",
 },
 {
 mois: 7,
 label: 'Juillet',
 raison: 'Mi-année - Bon moment pour ajuster selon les résultats du S1',
 },
 { mois: 4, label: 'Avril', raison: 'Début Q2 - Après analyse des résultats Q1' },
 { mois: 10, label: 'Octobre', raison: 'Début Q4 - Préparation de la clôture annuelle' },
 ]

 // Clés localStorage
 const salaryHistoryKey = 'tribal_salary_history'
 const cnpsStorageKey = `tribal_cnps_active`

 // État pour l'historique des salaires
 const [salaryHistory, setSalaryHistoryState] = useState<SalaryEntry[]>(() => {
 const stored = localStorage.getItem(salaryHistoryKey)
 if (stored) {
 try {
 return JSON.parse(stored)
 } catch {
 return []
 }
 }
 // Valeur par défaut: salaire initial de 300,000 FCFA
 return [{ id: 'initial', dateEffet: '2026-01-01', montant: 300000, motif: 'Salaire initial' }]
 })

 const [cnpsActive, setCnpsActiveState] = useState(() => {
 const stored = localStorage.getItem(cnpsStorageKey)
 return stored === 'true'
 })

 // État pour le formulaire d'ajout
 const [showSalaryForm, setShowSalaryForm] = useState(false)
 const [newSalaryDate, setNewSalaryDate] = useState(() => {
 const now = new Date()
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
 })
 const [newSalaryAmount, setNewSalaryAmount] = useState(300000)
 const [newSalaryMotif, setNewSalaryMotif] = useState('')

 // Fonction pour sauvegarder l'historique
 const setSalaryHistory = (history: SalaryEntry[]) => {
 setSalaryHistoryState(history)
 localStorage.setItem(salaryHistoryKey, JSON.stringify(history))
 }

 const setCnpsActive = (value: boolean) => {
 setCnpsActiveState(value)
 localStorage.setItem(cnpsStorageKey, String(value))
 }

 // Ajouter une nouvelle entrée de salaire
 const addSalaryEntry = () => {
 if (newSalaryAmount <= 0) return
 const newEntry: SalaryEntry = {
 id: `sal-${Date.now()}`,
 dateEffet: newSalaryDate,
 montant: newSalaryAmount,
 motif: newSalaryMotif || undefined,
 }
 const updated = [...salaryHistory, newEntry].sort(
 (a, b) => new Date(a.dateEffet).getTime() - new Date(b.dateEffet).getTime()
 )
 setSalaryHistory(updated)
 setShowSalaryForm(false)
 setNewSalaryMotif('')
 }

 // Supprimer une entrée de salaire
 const deleteSalaryEntry = (id: string) => {
 if (salaryHistory.length <= 1) return // Garder au moins une entrée
 setSalaryHistory(salaryHistory.filter(s => s.id !== id))
 }

 // Mettre à jour le salaire actuel (dernière entrée de l'historique)
 const updateCurrentSalary = (newAmount: number) => {
 if (salaryHistory.length === 0) {
 // Créer une première entrée
 setSalaryHistory([
 { id: 'initial', dateEffet: '2026-01-01', montant: newAmount, motif: 'Salaire initial' },
 ])
 } else {
 // Mettre à jour la dernière entrée
 const updated = salaryHistory.map((entry, index) =>
 index === salaryHistory.length - 1 ? { ...entry, montant: newAmount } : entry
 )
 setSalaryHistory(updated)
 }
 }

 // Calculer le salaire applicable pour un mois donné
 const getSalaryForMonth = (yearMonth: string): number => {
 // yearMonth format:"YYYY-MM"
 const targetDate = new Date(`${yearMonth}-01`)
 let applicable = salaryHistory[0]?.montant || 300000

 for (const entry of salaryHistory) {
 const entryDate = new Date(entry.dateEffet)
 if (entryDate <= targetDate) {
 applicable = entry.montant
 } else {
 break
 }
 }
 return applicable
 }

 // Calculer le salaire moyen pondéré sur la période filtrée
 const salaireMoyenPeriode = useMemo(() => {
 if (selectedPeriod === 'all') {
 // Pour"all", prendre le dernier salaire
 return salaryHistory[salaryHistory.length - 1]?.montant || 300000
 }

 const now = new Date()
 let startMonth: number
 let endMonth: number
 const year = selectedYear

 if (selectedPeriod === 'month') {
 const month = selectedMonth ?? now.getMonth()
 startMonth = month
 endMonth = month
 } else if (selectedPeriod === 'quarter') {
 const currentQuarter = Math.floor(now.getMonth() / 3)
 startMonth = currentQuarter * 3
 endMonth = startMonth + 2
 } else if (selectedPeriod === 'year') {
 startMonth = 0
 endMonth = 11
 } else {
 // week - prendre le mois courant
 startMonth = now.getMonth()
 endMonth = now.getMonth()
 }

 // Calculer la moyenne pondérée
 let totalSalary = 0
 let monthCount = 0
 for (let m = startMonth; m <= endMonth; m++) {
 const yearMonth = `${year}-${String(m + 1).padStart(2, '0')}`
 totalSalary += getSalaryForMonth(yearMonth)
 monthCount++
 }

 return monthCount > 0 ? Math.round(totalSalary / monthCount) : 300000
 }, [salaryHistory, selectedYear, selectedPeriod, selectedMonth])

 // Salaire actuel (dernier en date)
 const salaireActuel = salaryHistory[salaryHistory.length - 1]?.montant || 300000

 // Utiliser le salaire moyen pour les calculs de la période
 const salaireBrutMensuel = salaireMoyenPeriode

 // Vérifier si c'est une bonne période pour augmenter
 const prochaineperiodeRecommandee = useMemo(() => {
 const now = new Date()
 const currentMonth = now.getMonth() + 1 // 1-12

 // Trouver la prochaine période recommandée
 const sorted = [...PERIODES_RECOMMANDEES].sort((a, b) => {
 const diffA = a.mois >= currentMonth ? a.mois - currentMonth : 12 - currentMonth + a.mois
 const diffB = b.mois >= currentMonth ? b.mois - currentMonth : 12 - currentMonth + b.mois
 return diffA - diffB
 })

 return sorted[0]
 }, [])

 // Taux CNPS Côte d'Ivoire
 const CNPS_TAUX_SALARIAL = 6.3 // Part salariale: 6.3%
 const CNPS_TAUX_PATRONAL = 15.75 // Part patronale: 15.75%

 // Calculs salaires
 const cnpsSalariale = cnpsActive ? Math.round(salaireBrutMensuel * (CNPS_TAUX_SALARIAL / 100)) : 0
 const cnpsPatronale = cnpsActive ? Math.round(salaireBrutMensuel * (CNPS_TAUX_PATRONAL / 100)) : 0
 const salaireNet = salaireBrutMensuel - cnpsSalariale
 const coutEmployeurParGerant = salaireBrutMensuel + cnpsPatronale

 // Nombre de gérants
 const nombreGerants = 2

 // Totaux mensuels
 const masseSalarialeMensuelle = salaireBrutMensuel * nombreGerants
 const totalCnpsSalarialeMensuelle = cnpsSalariale * nombreGerants
 const totalCnpsPatronaleMensuelle = cnpsPatronale * nombreGerants
 const totalNetMensuel = salaireNet * nombreGerants
 const coutTotalEmployeurMensuel = coutEmployeurParGerant * nombreGerants

 // Nombre de mois dans la période filtrée
 const nombreMoisPeriode = useMemo(() => {
 if (selectedPeriod === 'month') return 1
 if (selectedPeriod === 'quarter') return 3
 if (selectedPeriod === 'year') return 12
 if (selectedPeriod === 'week') return 0.25
 return 12 // 'all' - on prend l'année
 }, [selectedPeriod])

 // Totaux sur la période (coût employeur = ce qui est déductible)
 const masseSalarialePeriode = Math.round(masseSalarialeMensuelle * nombreMoisPeriode)
 const coutTotalEmployeurPeriode = Math.round(coutTotalEmployeurMensuel * nombreMoisPeriode)

 // === CALCULS FISCAUX ===
 // Capital social de la SARL (pour calcul plafond réserve légale)
 const capitalSocial = 100000 // 100 000 FCFA
 const plafondReserveLegale = capitalSocial / 5 // 1/5 du capital = 20 000 FCFA

 // Résultat d'exploitation AVANT salaires gérants = CA HT - Charges - Amortissements
 const resultatExploitationBrut = totalCA - totalExpenses - amortissements

 // Résultat avant impôt SANS salaires gérants (pour comparaison)
 const resultatAvantImpotSansSalaires = resultatExploitationBrut - chargesSociales

 // Résultat avant impôt AVEC salaires gérants (le vrai calcul)
 // Le coût employeur total (salaires bruts + CNPS patronale) est déductible
 const resultatAvantImpot = resultatAvantImpotSansSalaires - coutTotalEmployeurPeriode

 // === IMPÔT MINIMUM FORFAITAIRE (IMF) ===
 // L'IMF se calcule sur l'année entière (0.5% du CA annuel), minimum 3M FCFA
 // Il est payé une seule fois par an, pas mensuellement
 // Note: CA TTC = CA HT car TVA désactivée (SARL exonérée)
 const caHT = totalCA

 // Pour l'affichage, on calcule l'IMF annuel
 // Si on est sur une période partielle, on affiche une estimation proratisée
 const isFullYear = selectedPeriod === 'year' || selectedPeriod === 'all'
 const caAnnuelEstime = isFullYear ? caHT : caHT * (12 / nombreMoisPeriode)
 const montantIMFAnnuel = Math.max(
 Math.round(caAnnuelEstime * (imfPourcent / 100)),
 0 // Minimum IMF = 3M en théorie, mais pour une petite entreprise on simplifie
 )
 // IMF proratisé pour la période affichée (pour comparaison)
 const montantIMF = isFullYear
 ? montantIMFAnnuel
 : Math.round(montantIMFAnnuel * (nombreMoisPeriode / 12))

 // === IMPÔT SUR LES SOCIÉTÉS (IS) ===
 // IS = 25% du résultat fiscal (après déduction des charges dont salaires)
 // On paie le MAX entre l'IS calculé et l'IMF

 // IS calculé sur le résultat (avec salaires déduits)
 const montantISCalcule = Math.max(0, Math.round(resultatAvantImpot * (impotSociete / 100)))

 // IS SANS salaires gérants (pour montrer l'économie)
 const montantISCalculeSansSalaires = Math.max(
 0,
 Math.round(resultatAvantImpotSansSalaires * (impotSociete / 100))
 )

 // L'impôt effectivement dû = MAX(IS calculé, IMF)
 const montantIS = Math.max(montantISCalcule, montantIMF)
 const montantISSansSalaires = Math.max(montantISCalculeSansSalaires, montantIMF)

 // Type d'impôt payé (pour affichage)
 const typeImpot = montantISCalcule >= montantIMF ? 'IS' : 'IMF'

 // Économie IS réelle grâce aux salaires
 const economieIS = Math.max(0, montantISSansSalaires - montantIS)

 // Bénéfice net après impôt
 const beneficeNet = Math.max(0, resultatAvantImpot - montantIS)

 // === RÉSERVES OBLIGATOIRES ===
 // Réserve légale: 10% du bénéfice net, MAIS plafonnée à 1/5 du capital social
 // Une fois le plafond atteint, on ne provisionne plus
 // TODO: Stocker le cumul des réserves légales déjà constituées
 const reserveLegaleCumulee = 0 // À récupérer depuis la base de données
 const reserveLegaleRestante = Math.max(0, plafondReserveLegale - reserveLegaleCumulee)
 const montantReserveLegaleCalcule = Math.round(beneficeNet * (reserveLegale / 100))
 const montantReserveLegale = Math.min(montantReserveLegaleCalcule, reserveLegaleRestante)

 // Réserve statutaire: selon les statuts (5% par défaut), pas de plafond légal
 const montantReserveStatutaire = Math.round(beneficeNet * (reserveStatutaire / 100))

 const totalReserves = montantReserveLegale + montantReserveStatutaire

 // Trésorerie disponible (cash réel en banque - via hook centralisé)
 // Le hook prend en compte: soldes initiaux, acomptes, tous comptes (mobiles, banque, caisse),
 // transactions Print, paiements Agency, dépenses, virements internes, frais bancaires
 const tresorerieReelle = tresorerieReelleTotale // Trésorerie réelle totale SANS FILTRE (pour dividendes/CCA)

 // Pour les KPI affichés, utiliser la trésorerie RÉELLE (solde actuel en banque)
 const tresorerieDisponible = tresorerieReelle

 // === TRÉSORERIE APRÈS CHARGES PRÉVISIONNELLES ===
 // Salaires du mois à provisionner (si pas encore versés)
 const salairesAVerser = coutTotalEmployeurMensuel // Coût employeur mensuel total (2 gérants)
 const tresorerieApresSalaires = tresorerieReelle - salairesAVerser

 // Marge de sécurité recommandée (3 mois de charges fixes)
 const chargesFixesMensuelles = salairesAVerser // Pour l'instant, juste les salaires
 const margeSecuriteRecommandee = chargesFixesMensuelles * 3
 const tresorerieExcedentaire = Math.max(0, tresorerieApresSalaires - margeSecuriteRecommandee)

 // Bénéfice distribuable = Bénéfice net - Réserves + Report à nouveau
 const beneficeDistribuable = beneficeNet - totalReserves + reportANouveau

 // Dividendes distribuables = MIN(bénéfice distribuable, trésorerie RÉELLE)
 const dividendesDistribuables = Math.max(0, Math.min(beneficeDistribuable, tresorerieReelle))

 // === PLANNING DIVIDENDES ===
 // En Côte d'Ivoire: AG annuelle dans les 6 mois suivant la clôture (avant le 30 juin)
 // Meilleure période: Avril-Juin (après clôture des comptes)

 type DividendPeriod = {
 mois: number
 label: string
 isIdeal: boolean
 raison: string
 }

 const PERIODES_DIVIDENDES: DividendPeriod[] = [
 {
 mois: 4,
 label: 'Avril',
 isIdeal: true,
 raison: 'Idéal - Comptes N-1 clôturés, trésorerie post-saison visible',
 },
 {
 mois: 5,
 label: 'Mai',
 isIdeal: true,
 raison: 'Excellent - AG annuelle typique, bilan finalisé',
 },
 {
 mois: 6,
 label: 'Juin',
 isIdeal: true,
 raison:"Dernier mois légal - Limite pour l'AG annuelle",
 },
 {
 mois: 12,
 label: 'Décembre',
 isIdeal: false,
 raison:"Acompte possible - Si trésorerie excédentaire en fin d'année",
 },
 ]

 // Calculer le statut des dividendes et les alertes
 const dividendesStatus = useMemo(() => {
 const now = new Date()
 const currentMonth = now.getMonth() + 1 // 1-12
 const currentYear = now.getFullYear()

 // Seuils pour les alertes
 const seuilMinDistribution = 500000 // 500k FCFA minimum pour distribuer
 const seuilConfortTresorerie = 1000000 // 1M FCFA de sécurité en trésorerie
 const dividendesParGerant = dividendesDistribuables / nombreGerants

 // Déterminer si on est dans une période favorable
 const periodeActuelle = PERIODES_DIVIDENDES.find(p => p.mois === currentMonth)
 const estPeriodeFavorable = periodeActuelle?.isIdeal ?? false

 // Prochaine période de distribution
 const prochaineperiodeDividende = [...PERIODES_DIVIDENDES]
 .filter(p => p.isIdeal)
 .sort((a, b) => {
 const diffA = a.mois >= currentMonth ? a.mois - currentMonth : 12 - currentMonth + a.mois
 const diffB = b.mois >= currentMonth ? b.mois - currentMonth : 12 - currentMonth + b.mois
 return diffA - diffB
 })[0]

 // Calculer les mois restants avant la prochaine période
 const moisRestants = prochaineperiodeDividende
 ? prochaineperiodeDividende.mois >= currentMonth
 ? prochaineperiodeDividende.mois - currentMonth
 : 12 - currentMonth + prochaineperiodeDividende.mois
 : 0

 // Générer les alertes
 type AlertType = 'success' | 'warning' | 'info' | 'error'
 const alertes: Array<{ type: AlertType; message: string; detail?: string }> = []

 // Alerte période favorable
 if (estPeriodeFavorable && dividendesDistribuables >= seuilMinDistribution) {
 alertes.push({
 type: 'success',
 message: `C'est le bon moment pour distribuer des dividendes!`,
 detail: `${periodeActuelle?.raison}`,
 })
 }

 // Alerte dividendes disponibles
 if (dividendesDistribuables >= seuilMinDistribution) {
 alertes.push({
 type: 'info',
 message: `${formatCurrency(dividendesParGerant)} disponibles par gérant`,
 detail: `Soit ${formatCurrency(dividendesDistribuables)} au total pour les ${nombreGerants} gérants`,
 })
 } else if (dividendesDistribuables > 0) {
 alertes.push({
 type: 'warning',
 message: `Montant faible: ${formatCurrency(dividendesDistribuables)}`,
 detail: `Seuil recommandé: ${formatCurrency(seuilMinDistribution)} minimum`,
 })
 } else {
 alertes.push({
 type: 'error',
 message: 'Aucun dividende distribuable',
 detail:
 beneficeNet <= 0
 ? 'Bénéfice net insuffisant'
 : tresorerieReelle <= seuilConfortTresorerie
 ? 'Trésorerie insuffisante'
 : 'Réserves à constituer en priorité',
 })
 }

 // Alerte trésorerie
 if (
 tresorerieReelle > 0 &&
 tresorerieReelle < dividendesDistribuables + seuilConfortTresorerie
 ) {
 alertes.push({
 type: 'warning',
 message: 'Attention à la trésorerie résiduelle',
 detail: `Après distribution, il restera ${formatCurrency(tresorerieReelle - dividendesDistribuables)}. Prévoir ${formatCurrency(seuilConfortTresorerie)} de sécurité.`,
 })
 }

 // Planning de l'année
 const planningAnnuel = PERIODES_DIVIDENDES.map(p => ({
 ...p,
 estPassee: p.mois < currentMonth,
 estCourante: p.mois === currentMonth,
 montantEstime: dividendesParGerant,
 }))

 return {
 currentMonth,
 currentYear,
 estPeriodeFavorable,
 periodeActuelle,
 prochaineperiodeDividende,
 moisRestants,
 dividendesParGerant,
 alertes,
 planningAnnuel,
 peutDistribuer: dividendesDistribuables >= seuilMinDistribution,
 seuilMinDistribution,
 }
 }, [dividendesDistribuables, tresorerieReelle, beneficeNet, nombreGerants])

 // Récupérer les avatars des cogérants depuis les utilisateurs
 const [usersAvatars, setUsersAvatars] = useState<Record<string, string>>({})

 React.useEffect(() => {
 const fetchUsers = async () => {
 try {
 const response = await authService.getAllUsers()
 if (response.success && response.data) {
 const avatars: Record<string, string> = {}
 for (const user of response.data) {
 const name = user.name?.toLowerCase() || ''
 if (name.includes('joseph') || name.includes('kakou')) {
 avatars['Joseph KAKOU'] = (user as any).avatar || ''
 }
 if (name.includes('souka') || name.includes('bondes')) {
 avatars['Souka BONDES'] = (user as any).avatar || ''
 }
 }
 setUsersAvatars(avatars)
 }
 } catch (e) {
 console.log('Avatars non chargés')
 }
 }
 fetchUsers()
 }, [])

 // Cogérants avec leur part et avatar
 const cogerants = [
 { nom: 'Joseph KAKOU', part: 50, avatar: usersAvatars['Joseph KAKOU'] || null },
 { nom: 'Souka BONDES', part: 50, avatar: usersAvatars['Souka BONDES'] || null },
 ]

 // Répartition des dépenses par catégorie
 const expenseByCategoryData = useMemo(() => {
 const acc: Record<string, number> = {}
 for (const exp of filteredExpenses) {
 if (exp.type !== 'expense') continue
 const cat = exp.expenseCategory || 'Frais généraux'
 acc[cat] = (acc[cat] || 0) + (exp.totals?.ttc || 0)
 }
 const categoryColors: Record<string, string> = {
 'Salaires': '#8b5cf6',
 'Remuneration Associes': '#10b981',
"Main d'œuvre (Atelier)": '#f97316',
 'Sous-traitance Impression': '#0ea5e9',
 'Sous-traitance Fabrication': '#14b8a6',
 'Fournitures': '#f59e0b',
 'Matériel': '#eab308',
 'Loyer': '#a855f7',
 'Marketing': '#ec4899',
 'Abonnements & Logiciels': '#6366f1',
 'Hébergement & Domaines': '#06b6d4',
 'Déplacements': '#3b82f6',
 'Livraison (Reprise)': '#f97316',
 'Services': '#f43f5e',
 'Frais généraux': '#64748b',
 'Autre': '#94a3b8',
 }
 const fallbackColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6']
 let ci = 0
 return Object.entries(acc)
 .sort((a, b) => b[1] - a[1])
 .map(([label, value]) => ({
 label,
 value,
 color: categoryColors[label] || fallbackColors[ci++ % fallbackColors.length],
 }))
 }, [filteredExpenses])

 // Dépenses par fournisseur (toutes catégories) avec détail catégorie
 const expenseBySupplierData = useMemo(() => {
 const suppliers: Record<string, { total: number; categories: Record<string, number>; count: number }> = {}
 for (const exp of filteredExpenses) {
 if (exp.type !== 'expense') continue
 const name = exp.partnerName || 'Non renseigné'
 const cat = exp.expenseCategory || 'Frais généraux'
 const amount = exp.totals?.ttc || 0
 if (!suppliers[name]) suppliers[name] = { total: 0, categories: {}, count: 0 }
 suppliers[name].total += amount
 suppliers[name].categories[cat] = (suppliers[name].categories[cat] || 0) + amount
 suppliers[name].count++
 }
 return Object.entries(suppliers)
 .map(([name, data]) => ({
 name,
 total: data.total,
 count: data.count,
 mainCategory: Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
 categories: data.categories,
 }))
 .sort((a, b) => b.total - a.total)
 }, [filteredExpenses])

 // Filtre par catégorie pour la vue fournisseurs
 const [supplierCatFilter, setSupplierCatFilter] = useState<string>('all')

 const filteredSupplierData = useMemo(() => {
 if (supplierCatFilter === 'all') return expenseBySupplierData
 return expenseBySupplierData
 .map(s => {
 const catAmount = s.categories[supplierCatFilter] || 0
 if (catAmount === 0) return null
 return { ...s, total: catAmount, count: s.count }
 })
 .filter(Boolean) as typeof expenseBySupplierData
 }, [expenseBySupplierData, supplierCatFilter])

 // Catégories uniques présentes dans les dépenses (pour le filtre)
 const supplierFilterCategories = useMemo(() => {
 const cats = new Set<string>()
 for (const s of expenseBySupplierData) {
 Object.keys(s.categories).forEach(c => cats.add(c))
 }
 return Array.from(cats).sort()
 }, [expenseBySupplierData])

 const hasFilters = partnerFilter || expenseCategoryFilter

 // Données pour graphique répartition financière (inclure salaires gérants)
 const repartitionFinanciere = [
 { label: 'Bénéfice net', value: beneficeNet, color: '#10b981' },
 { label: 'Salaires gérants', value: coutTotalEmployeurPeriode, color: '#6366f1' },
 { label: 'Impôts', value: montantIS, color: '#ef4444' },
 { label: 'Réserves', value: totalReserves, color: '#f59e0b' },
 { label: 'Autres charges', value: totalExpenses - coutTotalEmployeurPeriode, color: '#8b5cf6' },
 ].filter(x => x.value > 0)

 return (
 <div className="space-y-6">
 {/* Header avec filtres globaux */}
 <AccountingFiltersBar title="Analytique" />

 {/* === HEADER MODERNE === */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden rounded-3xl glass p-6 text-white shadow-2xl"
 >
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
 <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />

 <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
 {/* Titre */}
 <div>
 <div className="flex items-center gap-3 mb-2">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
 <BarChart3 className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-2xl font-bold font-display">Tableau de bord financier</h1>
 <p className="text-white/60 text-sm">Vue globale de votre activité</p>
 </div>
 </div>
 </div>

 {/* Export */}
 <div className="flex flex-wrap items-center gap-3">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => {
 const nodes = Array.from(
 document.querySelectorAll('[data-analytics] svg')
 ) as SVGSVGElement[]
 if (nodes.length)
 downloadPDFMulti(nodes, 'analytics.pdf', {
 pageSize: 'A4',
 orientation: 'landscape',
 margin: 16,
 scale: 2,
 })
 }}
 className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
 >
 <Download className="w-4 h-4" />
 Exporter PDF
 </motion.button>
 </div>
 </div>

 {/* === KPIs PRINCIPAUX === */}
 <div className="relative grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
 {/* Chiffre d'affaires */}
 <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="w-5 h-5 text-emerald-400" />
 <span className="text-xs text-emerald-300 font-medium">Chiffre d'affaires</span>
 </div>
 <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400 truncate">
 {formatCurrency(totalCA)}
 </div>
 <div className="text-xs text-white/50 mt-1">Hors taxes</div>
 </div>

 {/* Bénéfice net */}
 <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
 <div className="flex items-center gap-2 mb-2">
 <Calculator className="w-5 h-5 text-blue-400" />
 <span className="text-xs text-blue-300 font-medium">Bénéfice net</span>
 </div>
 <div
 className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${beneficeNet >= 0 ? 'text-blue-400' : 'text-rose-400'}`}
 >
 {formatCurrency(beneficeNet)}
 </div>
 <div className="text-xs text-white/50 mt-1">Après impôts</div>
 </div>

 {/* Trésorerie */}
 <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20">
 <div className="flex items-center gap-2 mb-2">
 <Landmark className="w-5 h-5 text-cyan-400" />
 <span className="text-xs text-cyan-300 font-medium">Trésorerie</span>
 </div>
 <div
 className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${tresorerieDisponible >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}
 >
 {formatCurrency(tresorerieDisponible)}
 </div>
 <div className="text-xs text-white/50 mt-1">Disponible</div>
 </div>

 {/* Dépenses */}
 <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20">
 <div className="flex items-center gap-2 mb-2">
 <TrendingDown className="w-5 h-5 text-rose-400" />
 <span className="text-xs text-rose-300 font-medium">Dépenses</span>
 </div>
 <div className="text-lg sm:text-xl lg:text-2xl font-bold text-rose-400 truncate">
 {formatCurrency(totalExpenses)}
 </div>
 <div className="text-xs text-white/50 mt-1">Charges totales</div>
 </div>

 {/* Dividendes */}
 <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 border-2 border-amber-500/40 col-span-2 lg:col-span-1">
 <div className="flex items-center gap-2 mb-2">
 <Coins className="w-5 h-5 text-amber-400" />
 <span className="text-xs text-amber-300 font-medium">Dividendes</span>
 </div>
 <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-400 truncate">
 {formatCurrency(dividendesDistribuables)}
 </div>
 <div className="text-xs text-white/50 mt-1">Distribuables</div>
 </div>
 </div>
 </motion.div>

 {/* === GRAPHIQUES PRINCIPAUX === */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Évolution du chiffre d'affaires */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-white">
 Évolution du chiffre d'affaires
 </h3>
 <p className="text-sm text-white/50">
 Montant hors taxes par mois
 </p>
 </div>
 <div className="flex items-center gap-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={showCompare}
 onChange={e => setShowCompare(e.target.checked)}
 className="sr-only"
 />
 <div
 className={`w-9 h-5 rounded-full transition-colors ${showCompare ? 'bg-tribal-accent' : 'bg-white/[0.1]'}`}
 >
 <div
 className={`absolute top-0.5 w-4 h-4 bg-white/[0.03] rounded-full shadow transition-transform ${showCompare ? 'translate-x-4' : 'translate-x-0.5'}`}
 />
 </div>
 <span className="text-xs text-white/50">Comparer N-1</span>
 </label>
 <button
 onClick={() => {
 const el = document.querySelector('[data-analytics=ca] svg') as SVGSVGElement
 if (el) downloadPDF(el, 'ca-mensuel.pdf')
 }}
 className="p-2 text-white/50 hover:text-white/60 hover:bg-white/[0.06] rounded-lg transition-colors"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div data-analytics="ca" className="h-64">
 <BarChart
 data={caMonthly.map(x => x.total)}
 labels={caMonthly.map(x => x.key)}
 compare={showCompare ? caMonthlyPrev : undefined}
 />
 </div>
 </motion.div>

 {/* Répartition des encaissements */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-lg font-semibold text-white">
 Encaissements
 </h3>
 <p className="text-sm text-white/50">Par méthode de paiement</p>
 </div>
 </div>
 <div data-analytics="pay" className="flex justify-center mb-4">
 <DonutChart data={payDistribution} />
 </div>
 <div className="space-y-2">
 {payDistribution.map(s => (
 <div key={s.label} className="flex items-center gap-2 text-sm">
 <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
 <span className="flex-1 text-white/60 truncate">{s.label}</span>
 <span className="font-semibold text-white">
 {formatCurrency(s.value)}
 </span>
 </div>
 ))}
 </div>
 </motion.div>
 </div>

 {/* === SECTION DIVIDENDES MODERNE === */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="rounded-2xl bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-yellow-900/20 border-2 border-white/[0.06] p-6 shadow-lg"
 >
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
 <Coins className="w-6 h-6 text-white" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-white">
 Calcul des dividendes
 </h2>
 <p className="text-sm text-white/50">
 Répartition entre cogérants
 </p>
 </div>
 </div>
 {creancesClients > 0 && (
 <div className="px-3 py-1.5 rounded-full text-blue-400 text-sm font-medium">
 {formatCurrency(creancesClients)} créances en attente
 </div>
 )}
 </div>

 {/* Paramètres financiers */}
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6 p-4 rounded-xl bg-white/[0.06] border border-white/[0.06]">
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Amortissements <span className="text-[10px] opacity-60">(auto)</span>
 </label>
 <div className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.06] bg-tribal-black text-white font-medium">
 {amortissements.toLocaleString()} {currency}
 </div>
 </div>
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Investissements <span className="text-[10px] opacity-60">(auto)</span>
 </label>
 <div className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.06] bg-purple-900/20 text-purple-400 font-medium">
 {investissements.toLocaleString()} {currency}
 </div>
 </div>
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Charges sociales <span className="text-[10px] opacity-60">(auto)</span>
 </label>
 <div className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.06] bg-teal-900/20 text-teal-400 font-medium">
 {chargesSociales.toLocaleString()} {currency}
 </div>
 </div>
 <div>
 <label className="text-xs text-tribal-accent block mb-1 font-medium">
 Salaire brut/gérant
 </label>
 <input
 type="number"
 value={salaireActuel}
 onChange={e => updateCurrentSalary(Number(e.target.value) || 0)}
 className="w-full px-3 py-2 text-sm rounded-lg border-2 border-white/[0.08] bg-indigo-900/20 text-white focus:outline-none focus:ring-tribal-accent/40 focus:outline-none"
 min="0"
 step="10000"
 placeholder="300000"
 />
 </div>
 <div>
 <label className="text-xs text-amber-400 block mb-1 font-medium">
 Réserve légale %
 </label>
 <input
 type="number"
 value={reserveLegale}
 onChange={e => setReserveLegale(Number(e.target.value) || 0)}
 className="w-full px-3 py-2 text-sm rounded-lg border-2 border-white/[0.08] bg-amber-900/20 text-white focus:outline-none focus:border-tribal-accent/40"
 placeholder="10"
 min="0"
 max="100"
 />
 </div>
 <div>
 <label className="text-xs text-purple-400 block mb-1 font-medium">
 Réserve statutaire %
 </label>
 <input
 type="number"
 value={reserveStatutaire}
 onChange={e => setReserveStatutaire(Number(e.target.value) || 0)}
 className="w-full px-3 py-2 text-sm rounded-lg border-2 border-white/[0.08] bg-purple-900/20 text-white focus:outline-none focus:border-tribal-accent/40"
 placeholder="5"
 min="0"
 max="100"
 />
 </div>
 <div>
 <label className="text-xs text-rose-400 block mb-1 font-medium">
 Impôt société (IS) %
 </label>
 <input
 type="number"
 value={impotSociete}
 onChange={e => setImpotSociete(Number(e.target.value) || 0)}
 className="w-full px-3 py-2 text-sm rounded-lg border-2 border-white/[0.08] bg-rose-900/20 text-white focus:outline-none focus:border-tribal-accent/40"
 placeholder="25"
 min="0"
 max="100"
 />
 </div>
 <div>
 <label className="text-xs text-orange-400 block mb-1 font-medium">
 Impôt minimum (IMF) %
 </label>
 <input
 type="number"
 value={imfPourcent}
 onChange={e => setImfPourcent(Number(e.target.value) || 0)}
 step="0.1"
 className="w-full px-3 py-2 text-sm rounded-lg border-2 border-white/[0.08] bg-orange-900/20 text-white focus:outline-none focus:border-tribal-accent/40"
 placeholder="0.5"
 min="0"
 max="100"
 />
 </div>
 </div>

 {/* Info CNPS */}
 <div className="mb-4 p-3 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <Calculator className="w-5 h-5 text-tribal-accent flex-shrink-0" />
 <div className="text-sm text-tribal-accent">
 {cnpsActive ? (
 <>
 CNPS activée : <span className="font-semibold">{CNPS_TAUX_SALARIAL}%</span>{' '}
 salariale + <span className="font-semibold">{CNPS_TAUX_PATRONAL}%</span> patronale
 </>
 ) : (
 <>
 CNPS non activée{' '}
 <span className="text-tribal-accent">
 (en cours de formalisation)
 </span>
 </>
 )}
 </div>
 </div>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={cnpsActive}
 onChange={e => setCnpsActive(e.target.checked)}
 className="w-4 h-4 rounded border-white/[0.08] text-tribal-accent focus:ring-tribal-accent/40"
 />
 <span className="text-xs text-tribal-accent font-medium">
 Activer CNPS
 </span>
 </label>
 </div>

 {/* Résumé financier */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-emerald-400 font-medium mb-1">
 Chiffre d'affaires HT
 </div>
 <div className="text-base sm:text-lg font-bold text-emerald-400 truncate">
 {formatCurrency(totalCA)}
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-rose-400 font-medium mb-1">
 Impôt ({typeImpot === 'IS' ? 'Société 25%' : 'Minimum 0.5%'})
 </div>
 <div className="text-base sm:text-lg font-bold text-rose-400 truncate">
 {formatCurrency(montantIS)}
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-blue-400 font-medium mb-1">
 Bénéfice net
 </div>
 <div
 className={`text-base sm:text-lg font-bold truncate ${beneficeNet >= 0 ? 'text-blue-400' : 'text-rose-400'}`}
 >
 {formatCurrency(beneficeNet)}
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-amber-400 font-medium mb-1">
 Réserves totales
 </div>
 <div className="text-base sm:text-lg font-bold text-amber-400 truncate">
 {formatCurrency(montantReserveLegale + montantReserveStatutaire)}
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-cyan-400 font-medium mb-1">
 Trésorerie réelle
 </div>
 <div
 className={`text-base sm:text-lg font-bold truncate ${tresorerieReelle >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}
 >
 {formatCurrency(tresorerieReelle)}
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-violet-400 font-medium mb-1">
 Après salaires du mois
 </div>
 <div
 className={`text-base sm:text-lg font-bold truncate ${tresorerieApresSalaires >= 0 ? 'text-violet-400' : 'text-rose-400'}`}
 >
 {formatCurrency(tresorerieApresSalaires)}
 </div>
 <div className="text-[10px] text-violet-400 mt-1">
 -{formatCurrency(salairesAVerser)} salaires
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-teal-400 font-medium mb-1">
 Excédent distribuable
 </div>
 <div
 className={`text-base sm:text-lg font-bold truncate ${tresorerieExcedentaire > 0 ? 'text-teal-400' : 'text-white/50'}`}
 >
 {formatCurrency(tresorerieExcedentaire)}
 </div>
 <div className="text-[10px] text-teal-500 mt-1">
 Après 3 mois de réserve
 </div>
 </div>
 <div className="p-4 rounded-xl bg-gradient-to-br from-amber-800/50 to-orange-800/50 border-2 border-tribal-accent/30">
 <div className="text-xs text-amber-400 font-bold mb-1">
 DIVIDENDES DISTRIBUABLES
 </div>
 <div className="text-lg sm:text-xl font-bold text-amber-400 truncate">
 {formatCurrency(dividendesDistribuables)}
 </div>
 </div>
 </div>

 {/* Cartes cogérants */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {cogerants.map((cogerant, idx) => (
 <motion.div
 key={cogerant.nom}
 initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.3 + idx * 0.1 }}
 className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border-2 border-white/[0.06] shadow-sm"
 >
 <div className="flex items-center gap-4">
 {cogerant.avatar ? (
 <img
 src={cogerant.avatar}
 alt={cogerant.nom}
 className="w-14 h-14 rounded-full object-cover ring-4 ring-tribal-accent/30 shadow-lg"
 />
 ) : (
 <div
 className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
 idx === 0
 ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
 : 'bg-gradient-to-br from-purple-500 to-pink-600'
 }`}
 >
 {cogerant.nom
 .split(' ')
 .map(n => n[0])
 .join('')}
 </div>
 )}
 <div>
 <div className="text-lg font-semibold text-white">
 {cogerant.nom}
 </div>
 <div className="text-sm text-white/50">
 Part : {cogerant.part}%
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-sm text-white/50 mb-1">Dividendes</div>
 <div
 className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${dividendesDistribuables > 0 ? 'text-amber-400' : 'text-white/50'}`}
 >
 {formatCurrency(dividendesDistribuables * (cogerant.part / 100))}
 </div>
 </div>
 </motion.div>
 ))}
 </div>

 {dividendesDistribuables <= 0 && (
 <div className="mt-4 p-3 rounded-xl text-rose-400 text-sm text-center font-medium">
 Pas de dividendes distribuables -{' '}
 {beneficeNet <= 0
 ? 'Bénéfice net nul ou négatif'
 : beneficeDistribuable <= 0
 ? `Bénéfice absorbé par les réserves (${formatCurrency(totalReserves)})`
 : tresorerieReelle <= 0
 ? 'Trésorerie insuffisante'
 : 'Bénéfice distribuable insuffisant'}
 </div>
 )}

 {/* === PLANNING DIVIDENDES === */}
 <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-white/[0.06]">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
 <Coins className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">
 Planning Dividendes {dividendesStatus.currentYear}
 </h3>
 <p className="text-xs text-white/50">
 Meilleures périodes pour la distribution
 </p>
 </div>
 </div>

 {/* Alertes */}
 <div className="space-y-2 mb-4">
 {dividendesStatus.alertes.map((alerte, idx) => (
 <div
 key={idx}
 className={`p-3 rounded-lg flex items-start gap-3 ${
 alerte.type === 'success'
 ? ' border border-white/[0.06]'
 : alerte.type === 'warning'
 ? ' border border-white/[0.06]'
 : alerte.type === 'error'
 ? ' border border-white/[0.06]'
 : ' border border-white/[0.06]'
 }`}
 >
 <div
 className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
 alerte.type === 'success'
 ? 'bg-emerald-500'
 : alerte.type === 'warning'
 ? 'bg-amber-500'
 : alerte.type === 'error'
 ? 'bg-rose-500'
 : 'bg-blue-500'
 }`}
 >
 {alerte.type === 'success' ? (
 <TrendingUp className="w-3.5 h-3.5 text-white" />
 ) : alerte.type === 'warning' ? (
 <span className="text-white text-xs font-bold">!</span>
 ) : alerte.type === 'error' ? (
 <X className="w-3.5 h-3.5 text-white" />
 ) : (
 <Coins className="w-3.5 h-3.5 text-white" />
 )}
 </div>
 <div>
 <div
 className={`text-sm font-medium ${
 alerte.type === 'success'
 ? 'text-emerald-400'
 : alerte.type === 'warning'
 ? 'text-amber-300'
 : alerte.type === 'error'
 ? 'text-rose-400'
 : 'text-blue-400'
 }`}
 >
 {alerte.message}
 </div>
 {alerte.detail && (
 <div
 className={`text-xs mt-0.5 ${
 alerte.type === 'success'
 ? 'text-emerald-400'
 : alerte.type === 'warning'
 ? 'text-amber-400'
 : alerte.type === 'error'
 ? 'text-rose-400'
 : 'text-blue-400'
 }`}
 >
 {alerte.detail}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Timeline des périodes */}
 <div className="relative">
 <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-800/50" />
 <div className="space-y-3">
 {dividendesStatus.planningAnnuel.map((periode, idx) => (
 <div key={idx} className="relative pl-10">
 <div
 className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
 periode.estCourante
 ? 'bg-amber-500 border-tribal-accent/30 ring-4 ring-tribal-accent/30'
 : periode.estPassee
 ? 'bg-white/[0.1] border-white/[0.15]'
 : periode.isIdeal
 ? ' border-emerald-500'
 : ' border-blue-500'
 }`}
 >
 {periode.estCourante && <div className="w-2 h-2 rounded-full bg-white/[0.03]" />}
 </div>
 <div
 className={`p-3 rounded-lg ${
 periode.estCourante
 ? 'bg-white/[0.03] border-2 border-white/[0.08] shadow-sm'
 : periode.estPassee
 ? 'bg-tribal-black opacity-60'
 : 'bg-white/[0.06] border border-white/[0.06]'
 }`}
 >
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span
 className={`font-semibold ${
 periode.estCourante
 ? 'text-amber-400'
 : 'text-white/80'
 }`}
 >
 {periode.label}
 </span>
 {periode.isIdeal && !periode.estPassee && (
 <span className="text-[10px] px-1.5 py-0.5 rounded text-emerald-400 font-medium">
 RECOMMANDÉ
 </span>
 )}
 {periode.estCourante && (
 <span className="text-[10px] px-1.5 py-0.5 rounded text-amber-400 font-medium animate-pulse">
 MAINTENANT
 </span>
 )}
 </div>
 <p className="text-xs text-white/50 mt-0.5">
 {periode.raison}
 </p>
 </div>
 {!periode.estPassee && dividendesStatus.peutDistribuer && (
 <div className="text-right">
 <div className="text-xs text-white/50">
 Par gérant
 </div>
 <div className="font-semibold text-amber-400">
 {formatCurrency(dividendesStatus.dividendesParGerant)}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Prochaine échéance */}
 {!dividendesStatus.estPeriodeFavorable && dividendesStatus.prochaineperiodeDividende && (
 <div className="mt-4 p-3 rounded-lg bg-white/80 border border-white/[0.06]">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-sm font-medium text-white/80">
 Prochaine période favorable
 </div>
 <div className="text-lg font-bold text-amber-400">
 {dividendesStatus.prochaineperiodeDividende.label}{' '}
 {dividendesStatus.moisRestants > 0 && (
 <span className="text-sm font-normal text-white/50">
 (dans {dividendesStatus.moisRestants} mois)
 </span>
 )}
 </div>
 </div>
 <div className="text-right">
 <div className="text-xs text-white/50">Estimation totale</div>
 <div className="text-lg font-bold text-emerald-400">
 {formatCurrency(dividendesDistribuables)}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </motion.div>

 {/* === SECTION RÉMUNÉRATIONS DES GÉRANTS === */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.25 }}
 className="rounded-2xl bg-gradient-to-br from-indigo-900/20 via-violet-900/20 to-purple-900/20 border-2 border-white/[0.06] p-6 shadow-lg"
 >
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
 <Briefcase className="w-6 h-6 text-white" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-white">
 Rémunérations des gérants
 </h2>
 <p className="text-sm text-white/50">
 Stratégie: Salaire mensuel + Dividendes annuels
 </p>
 </div>
 </div>
 <div className="px-4 py-2 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-tribal-accent font-medium">
 Coût employeur/mois
 </div>
 <div className="text-lg font-bold text-tribal-accent">
 {formatCurrency(coutTotalEmployeurMensuel)}
 </div>
 </div>
 </div>

 {/* Paramètre salaire et historique */}
 <div className="mb-6 p-4 rounded-xl bg-white/[0.06] border border-white/[0.06]">
 {/* En-tête avec salaire actuel et CNPS */}
 <div className="flex flex-wrap items-center gap-4 mb-4">
 <div>
 <label className="text-sm text-white/60 block mb-1">
 Salaire actuel (par gérant)
 </label>
 <div className="text-2xl font-bold text-tribal-accent">
 {salaireActuel.toLocaleString()} {currency}
 </div>
 {selectedPeriod !== 'all' && salaireActuel !== salaireBrutMensuel && (
 <div className="text-xs text-white/50 mt-1">
 Moyenne période: {salaireBrutMensuel.toLocaleString()} {currency}
 </div>
 )}
 </div>
 <div className="flex items-center gap-3 ml-auto">
 <label className="flex items-center gap-2 cursor-pointer bg-tribal-black px-3 py-2 rounded-lg">
 <input
 type="checkbox"
 checked={cnpsActive}
 onChange={e => setCnpsActive(e.target.checked)}
 className="w-4 h-4 rounded border-white/[0.08] text-tribal-accent focus:ring-tribal-accent/40"
 />
 <span className="text-sm text-white/80">Charges CNPS</span>
 </label>
 {!cnpsActive && (
 <span className="text-xs text-amber-400 px-2 py-1 rounded">
 En cours de formalisation
 </span>
 )}
 </div>
 </div>

 {/* Prochaine période recommandée */}
 {prochaineperiodeRecommandee && (
 <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-white/[0.06]">
 <div className="flex items-center gap-2 text-sm text-emerald-400">
 <TrendingUp className="w-4 h-4" />
 <span className="font-medium">
 Prochaine période d'augmentation recommandée: {prochaineperiodeRecommandee.label}
 </span>
 </div>
 <p className="text-xs text-emerald-400 mt-1 ml-6">
 {prochaineperiodeRecommandee.raison}
 </p>
 </div>
 )}

 {/* Historique des salaires */}
 <div className="mb-4">
 <div className="flex items-center justify-between mb-2">
 <h4 className="text-sm font-semibold text-white/80">
 Historique des salaires
 </h4>
 <button
 onClick={() => setShowSalaryForm(!showSalaryForm)}
 className="text-xs px-3 py-1.5 rounded-lg text-tribal-accent hover:bg-tribal-accent/20 transition-colors flex items-center gap-1"
 >
 {showSalaryForm ? (
 <>
 <X className="w-3 h-3" /> Annuler
 </>
 ) : (
 <>
 <Plus className="w-3 h-3" /> Nouvelle entrée
 </>
 )}
 </button>
 </div>

 {/* Formulaire d'ajout */}
 {showSalaryForm && (
 <div className="mb-3 p-3 rounded-lg bg-indigo-900/20 border border-white/[0.06]">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Date d'effet
 </label>
 <input
 type="month"
 value={newSalaryDate.substring(0, 7)}
 onChange={e => setNewSalaryDate(`${e.target.value}-01`)}
 className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:ring-tribal-accent/40"
 />
 </div>
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Montant brut
 </label>
 <input
 type="number"
 value={newSalaryAmount}
 onChange={e => setNewSalaryAmount(Number(e.target.value) || 0)}
 className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:ring-tribal-accent/40"
 min="0"
 step="10000"
 placeholder="300000"
 />
 </div>
 <div>
 <label className="text-xs text-white/60 block mb-1">
 Motif (optionnel)
 </label>
 <input
 type="text"
 value={newSalaryMotif}
 onChange={e => setNewSalaryMotif(e.target.value)}
 className="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:ring-tribal-accent/40"
 placeholder="Augmentation annuelle"
 />
 </div>
 </div>
 <div className="flex justify-end mt-3">
 <button
 onClick={addSalaryEntry}
 className="px-4 py-2 text-sm rounded-lg bg-tribal-accent text-white hover:bg-tribal-accent-light transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Ajouter
 </button>
 </div>
 </div>
 )}

 {/* Tableau historique */}
 <div className="overflow-x-auto rounded-lg border border-white/[0.04]">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-indigo-900/20 border-b border-white/[0.04]">
 <th className="px-3 py-2 text-left text-xs font-semibold text-white/60">
 Date d'effet
 </th>
 <th className="px-3 py-2 text-right text-xs font-semibold text-white/60">
 Montant
 </th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-white/60">
 Motif
 </th>
 <th className="px-3 py-2 text-center text-xs font-semibold text-white/60 w-16">
 Action
 </th>
 </tr>
 </thead>
 <tbody>
 {salaryHistory.map((entry, index) => (
 <tr
 key={entry.id}
 className="border-b border-indigo-50 last:border-0 hover:bg-indigo-900/20/50"
 >
 <td className="px-3 py-2 text-white/80">
 {new Date(entry.dateEffet).toLocaleDateString('fr-FR', {
 year: 'numeric',
 month: 'long',
 })}
 </td>
 <td className="px-3 py-2 text-right font-semibold text-tribal-accent">
 {entry.montant.toLocaleString()} {currency}
 </td>
 <td className="px-3 py-2 text-white/50 text-xs">
 {entry.motif || '-'}
 </td>
 <td className="px-3 py-2 text-center">
 {index > 0 ? (
 <button
 onClick={() => deleteSalaryEntry(entry.id)}
 className="p-1 rounded text-rose-500 hover: transition-colors"
 title="Supprimer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 ) : (
 <span className="text-xs text-white/50">
 Initial
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Tableau récapitulatif */}
 <div className="overflow-x-auto mb-6">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-white/[0.06]">
 <th className="px-4 py-3 text-left font-semibold text-white/80">
 Élément
 </th>
 <th className="px-4 py-3 text-right font-semibold text-white/80">
 Par gérant
 </th>
 <th className="px-4 py-3 text-right font-semibold text-tribal-accent">
 Total (×{nombreGerants})
 </th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-white/[0.04] bg-white/50">
 <td className="px-4 py-3 font-medium text-white">
 Salaire brut
 </td>
 <td className="px-4 py-3 text-right text-white/60">
 {formatCurrency(salaireBrutMensuel)}
 </td>
 <td className="px-4 py-3 text-right font-semibold text-white">
 {formatCurrency(masseSalarialeMensuelle)}
 </td>
 </tr>
 <tr className="border-b border-white/[0.04]">
 <td className="px-4 py-3 text-white/60">
 CNPS salariale ({CNPS_TAUX_SALARIAL}%)
 {!cnpsActive && (
 <span className="ml-2 text-xs text-amber-400">(non activée)</span>
 )}
 </td>
 <td className="px-4 py-3 text-right text-rose-400">
 -{formatCurrency(cnpsSalariale)}
 </td>
 <td className="px-4 py-3 text-right text-rose-400">
 -{formatCurrency(totalCnpsSalarialeMensuelle)}
 </td>
 </tr>
 <tr className="border-b border-white/[0.06] bg-emerald-900/20/50">
 <td className="px-4 py-3 font-semibold text-emerald-400">
 Net à payer
 </td>
 <td className="px-4 py-3 text-right font-semibold text-emerald-400">
 {formatCurrency(salaireNet)}
 </td>
 <td className="px-4 py-3 text-right font-bold text-emerald-400">
 {formatCurrency(totalNetMensuel)}
 </td>
 </tr>
 <tr className="border-b border-white/[0.04]">
 <td className="px-4 py-3 text-white/60">
 CNPS patronale ({CNPS_TAUX_PATRONAL}%)
 {!cnpsActive && (
 <span className="ml-2 text-xs text-amber-400">(non activée)</span>
 )}
 </td>
 <td className="px-4 py-3 text-right text-white/50">
 +{formatCurrency(cnpsPatronale)}
 </td>
 <td className="px-4 py-3 text-right text-white/50">
 +{formatCurrency(totalCnpsPatronaleMensuelle)}
 </td>
 </tr>
 <tr className="border-t border-white/[0.06]">
 <td className="px-4 py-3 font-bold text-tribal-accent">
 Coût employeur
 </td>
 <td className="px-4 py-3 text-right font-semibold text-tribal-accent">
 {formatCurrency(coutEmployeurParGerant)}
 </td>
 <td className="px-4 py-3 text-right font-bold text-tribal-accent">
 {formatCurrency(coutTotalEmployeurMensuel)}
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Récapitulatif annuel */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-tribal-accent font-medium mb-1">
 Masse salariale annuelle
 </div>
 <div className="text-lg font-bold text-tribal-accent">
 {formatCurrency((masseSalarialePeriode * 12) / nombreMoisPeriode)}
 </div>
 <div className="text-xs text-tribal-accent mt-1">
 Charge déductible de l'IS
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-emerald-400 font-medium mb-1">
 Économie IS estimée
 </div>
 <div className="text-lg font-bold text-emerald-400">
 {formatCurrency((economieIS * 12) / nombreMoisPeriode)}
 </div>
 <div className="text-xs text-emerald-400 mt-1">
 {impotSociete}% de la masse salariale
 </div>
 </div>
 <div className="p-4 rounded-xl border border-white/[0.06]">
 <div className="text-xs text-violet-400 font-medium mb-1">
 Revenus nets annuels/gérant
 </div>
 <div className="text-lg font-bold text-violet-400">
 {formatCurrency(salaireNet * 12)}
 </div>
 <div className="text-xs text-violet-400 mt-1">
 + dividendes en fin d'année
 </div>
 </div>
 </div>

 {/* Cartes des gérants */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {cogerants.map((cogerant, idx) => (
 <motion.div
 key={cogerant.nom}
 initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.35 + idx * 0.1 }}
 className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border-2 border-white/[0.06] shadow-sm"
 >
 <div className="flex items-center gap-4">
 {cogerant.avatar ? (
 <img
 src={cogerant.avatar}
 alt={cogerant.nom}
 className="w-14 h-14 rounded-full object-cover ring-4 ring-indigo-200 shadow-lg"
 />
 ) : (
 <div
 className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
 idx === 0
 ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
 : 'bg-gradient-to-br from-purple-500 to-pink-600'
 }`}
 >
 {cogerant.nom
 .split(' ')
 .map(n => n[0])
 .join('')}
 </div>
 )}
 <div>
 <div className="text-lg font-semibold text-white">
 {cogerant.nom}
 </div>
 <div className="text-sm text-white/50">
 Gérant - {cogerant.part}%
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-sm text-white/50 mb-1">
 Salaire net/mois
 </div>
 <div className="text-xl font-bold text-tribal-accent">
 {formatCurrency(salaireNet)}
 </div>
 <div className="text-xs text-white/50 mt-1">
 + {formatCurrency(dividendesDistribuables * (cogerant.part / 100))} dividendes
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>

 {/* === GRAPHIQUES SECONDAIRES === */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Évolution TVA */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.25 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-lg font-semibold text-white">TVA nette</h3>
 <p className="text-sm text-white/50">
 Collectée moins déductible
 </p>
 </div>
 <button
 onClick={() => {
 const el = document.querySelector('[data-analytics=tva] svg') as SVGSVGElement
 if (el) downloadPDF(el, 'tva.pdf')
 }}
 className="p-2 text-white/50 hover:text-white/60 rounded-lg hover:bg-white/[0.06]"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 <div data-analytics="tva">
 <Sparkline
 data={tvaMonthly.map(x => x.total)}
 labels={tvaMonthly.map(x => x.key)}
 showDots
 compare={showCompare ? tvaMonthlyPrev : undefined}
 />
 </div>
 <div className="mt-4 flex justify-between text-sm">
 <span className="text-white/50">Total période</span>
 <span className={`font-semibold ${totalTVA >= 0 ? 'text-amber-400' : 'text-sky-400'}`}>
 {formatCurrency(totalTVA)}
 </span>
 </div>
 </motion.div>

 {/* Évolution trésorerie */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-lg font-semibold text-white">Trésorerie</h3>
 <p className="text-sm text-white/50">Évolution sur la période</p>
 </div>
 <button
 onClick={() => {
 const el = document.querySelector('[data-analytics=treso] svg') as SVGSVGElement
 if (el) downloadPDF(el, 'tresorerie.pdf')
 }}
 className="p-2 text-white/50 hover:text-white/60 rounded-lg hover:bg-white/[0.06]"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 <div data-analytics="treso">
 <Sparkline
 data={tresoTrend.map(x => x.total)}
 labels={tresoTrend.map(x => x.date)}
 stroke="#06b6d4"
 showDots
 />
 </div>
 <div className="mt-4 flex justify-between text-sm">
 <span className="text-white/50">Solde actuel</span>
 <span className={`font-semibold ${lastTreso >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
 {formatCurrency(lastTreso)}
 </span>
 </div>
 </motion.div>

 {/* Répartition financière */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.35 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="mb-4">
 <h3 className="text-lg font-semibold text-white">
 Répartition financière
 </h3>
 <p className="text-sm text-white/50">
 Utilisation du chiffre d'affaires
 </p>
 </div>
 <div data-analytics="repartition" className="flex justify-center mb-4">
 <DonutChart data={repartitionFinanciere} />
 </div>
 <div className="space-y-2">
 {repartitionFinanciere.map(s => (
 <div key={s.label} className="flex items-center gap-2 text-sm">
 <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
 <span className="flex-1 text-white/60">{s.label}</span>
 <span className="font-semibold text-white">
 {formatCurrency(s.value)}
 </span>
 </div>
 ))}
 </div>
 </motion.div>
 </div>

 {/* === RÉPARTITION DES DÉPENSES PAR CATÉGORIE === */}
 {expenseByCategoryData.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.38 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-white">
 Dépenses par catégorie
 </h3>
 <p className="text-sm text-white/50">
 Répartition des charges d'exploitation
 </p>
 </div>
 <div className="text-right">
 <div className="text-sm text-white/50">Total</div>
 <div className="text-lg font-bold text-rose-400">
 {formatCurrency(expenseByCategoryData.reduce((s, x) => s + x.value, 0))}
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div data-analytics="expense-cat" className="flex justify-center">
 <DonutChart data={expenseByCategoryData} />
 </div>
 <div className="space-y-2 max-h-72 overflow-y-auto">
 {expenseByCategoryData.map(s => {
 const total = expenseByCategoryData.reduce((sum, x) => sum + x.value, 0)
 const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0'
 return (
 <div key={s.label} className="flex items-center gap-2 text-sm">
 <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
 <span className="flex-1 text-white/60 truncate">{s.label}</span>
 <span className="text-xs text-white/40">{pct}%</span>
 <span className="font-semibold text-white whitespace-nowrap">
 {formatCurrency(s.value)}
 </span>
 </div>
 )
 })}
 </div>
 </div>
 </motion.div>
 )}

 {/* === DÉPENSES PAR FOURNISSEUR === */}
 {filteredSupplierData.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.39 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
 <Building2 className="w-5 h-5 text-white" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-white">
 Dépenses par fournisseur
 </h3>
 <p className="text-sm text-white/50">
 {filteredSupplierData.length} fournisseur{filteredSupplierData.length > 1 ? 's' : ''} — {formatCurrency(filteredSupplierData.reduce((s, x) => s + x.total, 0))} total
 </p>
 </div>
 </div>
 <select
 value={supplierCatFilter}
 onChange={e => setSupplierCatFilter(e.target.value)}
 className="px-3 py-2 text-sm border border-white/[0.06] rounded-xl bg-white/[0.03] text-white font-medium"
 >
 <option value="all">Toutes catégories</option>
 {supplierFilterCategories.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-white/[0.06]">
 <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Fournisseur</th>
 <th className="px-3 py-2.5 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Catégorie principale</th>
 <th className="px-3 py-2.5 text-center text-xs font-semibold text-white/50 uppercase tracking-wider">Nb</th>
 <th className="px-3 py-2.5 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Montant</th>
 <th className="px-3 py-2.5 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Part</th>
 </tr>
 </thead>
 <tbody>
 {filteredSupplierData.map((supplier, idx) => {
 const grandTotal = filteredSupplierData.reduce((s, x) => s + x.total, 0)
 const pct = grandTotal > 0 ? ((supplier.total / grandTotal) * 100) : 0
 return (
 <tr key={supplier.name} className="border-b border-white/[0.04] hover:bg-white/[0.06] transition-colors">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/60 flex-shrink-0">
 {idx + 1}
 </div>
 <span className="font-medium text-white truncate">{supplier.name}</span>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <span className="text-xs text-white/50">{supplier.mainCategory}</span>
 </td>
 <td className="px-3 py-2.5 text-center">
 <span className="text-xs text-white/50">{supplier.count}</span>
 </td>
 <td className="px-3 py-2.5 text-right">
 <span className="font-semibold text-white">{formatCurrency(supplier.total)}</span>
 </td>
 <td className="px-3 py-2.5 text-right">
 <div className="flex items-center justify-end gap-2">
 <div className="w-16 h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
 <div
 className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
 style={{ width: `${Math.min(pct, 100)}%` }}
 />
 </div>
 <span className="text-xs text-white/50 w-10 text-right">{pct.toFixed(1)}%</span>
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </motion.div>
 )}

 {/* === DÉPENSES DÉTAILLÉES === */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm"
 >
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-white">
 Achats et dépenses
 </h3>
 <p className="text-sm text-white/50">
 Évolution mensuelle des sorties
 </p>
 </div>
 <div className="flex items-center gap-4">
 <input
 value={partnerFilter}
 onChange={e => setPartnerFilter(e.target.value)}
 placeholder="Filtrer par partenaire..."
 className="px-3 py-2 text-sm border border-white/[0.06] rounded-lg bg-white/[0.03] text-white"
 />
 {hasFilters && (
 <button
 onClick={() => {
 setPartnerFilter('')
 setExpenseCategoryFilter('')
 }}
 className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-400 bg-rose-900/20 rounded-lg"
 >
 <X className="w-3 h-3" /> Réinitialiser
 </button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="w-4 h-4 rounded-full bg-amber-500"></span>
 <span className="text-sm font-medium text-white/80">Achats</span>
 <span className="ml-auto font-semibold text-amber-400">
 {formatCurrency(purchasesMonthly.reduce((s, x) => s + x.total, 0))}
 </span>
 </div>
 <BarChart
 data={purchasesMonthly.map(x => x.total)}
 labels={purchasesMonthly.map(x => x.key)}
 color="#f59e0b"
 />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="w-4 h-4 rounded-full bg-rose-500"></span>
 <span className="text-sm font-medium text-white/80">
 Dépenses
 </span>
 <span className="ml-auto font-semibold text-rose-400">
 {formatCurrency(expensesMonthly.reduce((s, x) => s + x.total, 0))}
 </span>
 </div>
 <BarChart
 data={expensesMonthly.map(x => x.total)}
 labels={expensesMonthly.map(x => x.key)}
 color="#ef4444"
 />
 </div>
 </div>
 </motion.div>

 {/* Empty state */}
 {filteredRevenues.length === 0 && filteredExpenses.length === 0 && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="text-center py-16 text-white/50"
 >
 <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
 <p className="text-lg font-medium">Aucune donnée à afficher</p>
 <p className="text-sm">Les ventes et dépenses apparaîtront ici automatiquement</p>
 </motion.div>
 )}
 </div>
 )
}

export default AnalyticsPage
