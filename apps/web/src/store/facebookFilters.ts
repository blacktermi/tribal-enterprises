import { create } from 'zustand'

export const AVAILABLE_YEARS = [2024, 2025, 2026]
export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface FacebookFiltersState {
  selectedYear: number
  selectedMonth: number | null
  selectedPlatform: string | null
  setSelectedYear: (y: number) => void
  setSelectedMonth: (m: number | null) => void
  setSelectedPlatform: (p: string | null) => void
}

export const useFacebookFilters = create<FacebookFiltersState>((set) => ({
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  selectedPlatform: null,
  setSelectedYear: (selectedYear) => set({ selectedYear }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSelectedPlatform: (selectedPlatform) => set({ selectedPlatform }),
}))
