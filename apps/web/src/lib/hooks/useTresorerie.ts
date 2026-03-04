/**
 * Hook centralisé pour le calcul de la trésorerie
 *
 * MISE À JOUR: Utilise maintenant les données de la base de données
 * via les API Treasury au lieu du localStorage.
 */

import { useMemo } from 'react'
import { useAccountingFilters, type PeriodType } from '../../store/accountingFilters'
import { type PaymentMethod, PAYMENT_METHODS } from '../../accounting/types'
import { useTreasurySummary, useTreasuryHistory } from './useTreasury'

// ===== TYPES =====

export interface TreasuryMovement {
  id: string
  date: string
  type: 'encaissement' | 'depense' | 'virement_in' | 'virement_out' | 'frais' | 'ajustement'
  description: string
  amount: number
  account: PaymentMethod
  source?: string
  ref?: string
}

export interface TresorerieResult {
  balances: Record<PaymentMethod, number>
  totalTresorerie: number
  totalEncaissements: number
  totalDepenses: number
  totalFraisBancaires: number
  totalAjustements: number
  movements: TreasuryMovement[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

// ===== HELPERS =====

/**
 * Mappe les codes de compte DB vers PaymentMethod
 */
function mapAccountCodeToPaymentMethod(code: string): PaymentMethod {
  const map: Record<string, PaymentMethod> = {
    WAVE: 'WAVE',
    MOBILE_MONEY: 'WAVE',
    ORANGE_MONEY: 'ORANGE_MONEY',
    MTN_MONEY: 'MTN_MONEY',
    MOOV_MONEY: 'MOOV_MONEY',
    BANQUE: 'BANQUE',
    CAISSE: 'CAISSE',
  }
  return map[code] || 'CAISSE'
}

/**
 * Retourne les dates de début et fin basées sur les filtres globaux
 */
function getDateRangeFromFilters(
  selectedYear: number,
  selectedPeriod: PeriodType,
  selectedMonth: number | null
): { startDate: string; endDate: string } {
  const now = new Date()

  if (selectedPeriod === 'all') {
    return {
      startDate: '2020-01-01',
      endDate: `${now.getFullYear() + 1}-12-31`,
    }
  }

  if (selectedPeriod === 'year') {
    return {
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
    }
  }

  if (selectedPeriod === 'month') {
    const month = selectedMonth !== null ? selectedMonth : now.getMonth()
    const monthStr = String(month + 1).padStart(2, '0')
    const lastDay = new Date(selectedYear, month + 1, 0).getDate()
    return {
      startDate: `${selectedYear}-${monthStr}-01`,
      endDate: `${selectedYear}-${monthStr}-${lastDay}`,
    }
  }

  if (selectedPeriod === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3)
    const startMonth = currentQuarter * 3
    const endMonth = startMonth + 2
    const startMonthStr = String(startMonth + 1).padStart(2, '0')
    const endMonthStr = String(endMonth + 1).padStart(2, '0')
    const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate()
    return {
      startDate: `${selectedYear}-${startMonthStr}-01`,
      endDate: `${selectedYear}-${endMonthStr}-${lastDay}`,
    }
  }

  if (selectedPeriod === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      startDate: weekAgo.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    }
  }

  return {
    startDate: `${selectedYear}-01-01`,
    endDate: `${selectedYear}-12-31`,
  }
}

// ===== HOOK PRINCIPAL =====

interface UseTresorerieOptions {
  /** Si true, ignore les filtres de période et calcule le solde total depuis le début */
  ignoreFilters?: boolean
}

export function useTresorerie(options?: UseTresorerieOptions): TresorerieResult {
  const { ignoreFilters = false } = options || {}

  // Récupérer les filtres globaux
  const { selectedYear, selectedPeriod, selectedMonth } = useAccountingFilters()

  // Calculer les dates basées sur les filtres globaux
  const dateRange = ignoreFilters
    ? { startDate: '2000-01-01', endDate: new Date().toISOString().slice(0, 10) }
    : getDateRangeFromFilters(selectedYear, selectedPeriod, selectedMonth)

  const { startDate, endDate } = dateRange

  // Utiliser les API Treasury depuis la base de données
  // Le summary calcule les soldes à une date donnée en prenant en compte:
  // - Soldes initiaux des comptes
  // - Virements internes
  // - Frais bancaires
  // - Ajustements (ventes, dépenses, apports, etc.)
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useTreasurySummary(endDate)

  // Récupérer l'historique des mouvements pour la période
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useTreasuryHistory({
    startDate,
    endDate,
    limit: 500,
  })

  // Convertir les données DB en format attendu par les composants
  const result = useMemo(() => {
    // Initialiser les balances à 0
    const balances: Record<PaymentMethod, number> = {} as Record<PaymentMethod, number>
    for (const method of PAYMENT_METHODS) {
      balances[method] = 0
    }

    // Remplir avec les données du summary
    if (summaryData?.accounts) {
      for (const account of summaryData.accounts) {
        const method = mapAccountCodeToPaymentMethod(account.code)
        balances[method] = account.balance
      }
    }

    // Convertir l'historique en mouvements
    const movements: TreasuryMovement[] = []
    let totalEncaissements = 0
    let totalDepenses = 0
    let totalFraisBancaires = 0
    let totalAjustements = 0

    if (historyData?.data) {
      for (const mov of historyData.data) {
        const method = mapAccountCodeToPaymentMethod(mov.accountCode || 'CAISSE')

        // Mapper le type de mouvement
        let type: TreasuryMovement['type'] = 'ajustement'
        if (mov.type === 'TRANSFER_IN') type = 'virement_in'
        else if (mov.type === 'TRANSFER_OUT') type = 'virement_out'
        else if (mov.type === 'FEE') type = 'frais'
        else if (mov.type === 'ADJUSTMENT') type = 'ajustement'

        // Comptabiliser par type
        if (mov.amount > 0) {
          if (type === 'ajustement') totalAjustements += mov.amount
          else totalEncaissements += mov.amount
        } else {
          if (type === 'frais') totalFraisBancaires += Math.abs(mov.amount)
          else if (type === 'ajustement' && mov.amount < 0) totalDepenses += Math.abs(mov.amount)
        }

        movements.push({
          id: mov.id,
          date: mov.date,
          type,
          description: mov.description || '',
          amount: mov.amount,
          account: method,
          source: mov.type,
          ref: mov.reference,
        })
      }
    }

    // Trier par date décroissante
    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Total trésorerie
    const totalTresorerie = summaryData?.totalBalance || 0

    return {
      balances,
      totalTresorerie,
      totalEncaissements,
      totalDepenses,
      totalFraisBancaires,
      totalAjustements,
      movements,
    }
  }, [summaryData, historyData])

  const refresh = () => {
    refetchSummary()
    refetchHistory()
  }

  return {
    ...result,
    isLoading: summaryLoading || historyLoading,
    error: summaryError ? String(summaryError) : null,
    refresh,
  }
}
