/**
 * Hook pour calculer les dates de filtre basées sur le store accountingFilters
 * Utilisé par toutes les pages de comptabilité pour un comportement cohérent
 */
import { useMemo } from 'react'
import { useAccountingFilters } from '../../store/accountingFilters'

export interface DateFiltersResult {
  startDate: string | undefined
  endDate: string | undefined
  selectedYear: number
  selectedPeriod: 'all' | 'year' | 'quarter' | 'month' | 'week'
  selectedMonth: number | null
}

export function useDateFilters(): DateFiltersResult {
  const { selectedYear, selectedPeriod, selectedMonth } = useAccountingFilters()

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

  return {
    ...dateFilters,
    selectedYear,
    selectedPeriod,
    selectedMonth,
  }
}
