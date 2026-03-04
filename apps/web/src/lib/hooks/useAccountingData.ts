/**
 * Hook combinant les filtres comptables et le chargement des revenus
 * Centralise la logique de conversion filtres -> dates API
 * et gère automatiquement le rafraîchissement lors des changements de filtres
 */
import { useMemo } from 'react'
import {
  useAccountingFilters,
  filterRevenuesByPlatform,
  type PeriodType,
  type PlatformType,
} from '../../store/accountingFilters'
import {
  useUnifiedRevenues,
  type UnifiedRevenue,
  type UseUnifiedRevenuesOptions,
} from './useUnifiedRevenues'

export interface UseAccountingDataOptions {
  /** Inclure le résumé dans la réponse (défaut: false) */
  includeSummary?: boolean
  /** Synchronisation automatique au premier chargement (défaut: false pour éviter les requêtes inutiles) */
  autoSync?: boolean
  /** Intervalle de rafraîchissement en ms (défaut: 120000) */
  refreshInterval?: number
  /** Activer/désactiver le hook */
  enabled?: boolean
}

export interface UseAccountingDataResult {
  /** Revenus filtrés par date (API) et plateforme (client) */
  data: UnifiedRevenue[]
  /** Tous les revenus de la période (avant filtrage plateforme) */
  allData: UnifiedRevenue[]
  /** Chargement en cours */
  loading: boolean
  /** Erreur éventuelle */
  error: string | null
  /** Forcer le rafraîchissement des données */
  refresh: () => void
  /** Synchroniser les sources de revenus */
  sync: (sources?: ('PRINT' | 'AGENCY' | 'KAUI' | 'QUOTE')[]) => Promise<void>
  /** Filtres actuels */
  filters: {
    selectedYear: number | null
    selectedPeriod: PeriodType
    selectedMonth: number | null
    selectedPlatform: PlatformType
    startDate: string | undefined
    endDate: string | undefined
  }
}

/**
 * Calcule les dates de début et fin basées sur les filtres de période
 */
function computeDateFilters(
  selectedYear: number | null,
  selectedPeriod: PeriodType,
  selectedMonth: number | null
): { startDate: string | undefined; endDate: string | undefined } {
  const now = new Date()

  // Si pas d'année sélectionnée ou période "all", pas de filtre de date
  if (selectedYear === null || selectedPeriod === 'all') {
    return { startDate: undefined, endDate: undefined }
  }

  let startDate: string | undefined
  let endDate: string | undefined

  switch (selectedPeriod) {
    case 'year':
      startDate = `${selectedYear}-01-01`
      endDate = `${selectedYear}-12-31`
      break

    case 'month': {
      // Utiliser le mois sélectionné ou le mois courant
      const month = selectedMonth !== null ? selectedMonth : now.getMonth()
      const monthStr = String(month + 1).padStart(2, '0')
      startDate = `${selectedYear}-${monthStr}-01`
      const lastDay = new Date(selectedYear, month + 1, 0).getDate()
      endDate = `${selectedYear}-${monthStr}-${lastDay}`
      break
    }

    case 'quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const startMonth = currentQuarter * 3
      startDate = `${selectedYear}-${String(startMonth + 1).padStart(2, '0')}-01`
      const endMonth = startMonth + 2
      const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate()
      endDate = `${selectedYear}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`
      break
    }

    case 'week': {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().slice(0, 10)
      endDate = now.toISOString().slice(0, 10)
      break
    }
  }

  return { startDate, endDate }
}

/**
 * Hook principal pour charger les données comptables avec filtres
 *
 * @example
 * ```tsx
 * const { data, loading, refresh, filters } = useAccountingData()
 *
 * // Les données sont automatiquement filtrées par:
 * // - Date (côté serveur via API)
 * // - Plateforme (côté client)
 * ```
 */
export function useAccountingData(options: UseAccountingDataOptions = {}): UseAccountingDataResult {
  const { includeSummary = false, autoSync = false, refreshInterval, enabled = true } = options

  // Récupérer les filtres du store global
  const { selectedYear, selectedPeriod, selectedMonth, selectedPlatform } = useAccountingFilters()

  // Calculer les dates de filtre basées sur les sélections
  // Ce useMemo garantit que les dates ne changent que si les filtres changent
  const dateFilters = useMemo(
    () => computeDateFilters(selectedYear, selectedPeriod, selectedMonth),
    [selectedYear, selectedPeriod, selectedMonth]
  )

  // Options pour le hook useUnifiedRevenues
  // Important: on passe les filtres de date pour que l'API retourne uniquement les données de la période
  const revenueOptions = useMemo<UseUnifiedRevenuesOptions>(
    () => ({
      filters: {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
        limit: 10000,
      },
      includeSummary,
      autoSync,
      refreshInterval,
      enabled,
    }),
    [dateFilters.startDate, dateFilters.endDate, includeSummary, autoSync, refreshInterval, enabled]
  )

  // Charger les revenus avec les filtres de date
  const { data: allData, loading, error, refresh, sync } = useUnifiedRevenues(revenueOptions)

  // Filtrer par plateforme côté client (le filtrage par date est fait côté serveur)
  const filteredData = useMemo(
    () => filterRevenuesByPlatform(allData, selectedPlatform),
    [allData, selectedPlatform]
  )

  return {
    data: filteredData,
    allData,
    loading,
    error,
    refresh,
    sync,
    filters: {
      selectedYear,
      selectedPeriod,
      selectedMonth,
      selectedPlatform,
      startDate: dateFilters.startDate,
      endDate: dateFilters.endDate,
    },
  }
}

/**
 * Hook simplifié pour obtenir uniquement les dates de filtre calculées
 * Utile pour les composants qui n'ont pas besoin des données mais juste des dates
 */
export function useAccountingDateFilters(): {
  startDate: string | undefined
  endDate: string | undefined
  selectedYear: number | null
  selectedPeriod: PeriodType
  selectedMonth: number | null
} {
  const { selectedYear, selectedPeriod, selectedMonth } = useAccountingFilters()

  const dateFilters = useMemo(
    () => computeDateFilters(selectedYear, selectedPeriod, selectedMonth),
    [selectedYear, selectedPeriod, selectedMonth]
  )

  return {
    ...dateFilters,
    selectedYear,
    selectedPeriod,
    selectedMonth,
  }
}
