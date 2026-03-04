import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types pour les filtres
export type PeriodType = 'all' | 'year' | 'quarter' | 'month' | 'week'
export type PlatformType =
  | 'all'
  | 'tribalprint'
  | 'muslimprint'
  | 'jerichoprint'
  | 'tribalverra'
  | 'tribalagency'

export interface AccountingFiltersState {
  // Filtres
  selectedYear: number | null // null = toutes les années
  selectedPeriod: PeriodType
  selectedMonth: number | null // 0 = janvier, 11 = décembre, null = tous les mois
  selectedPlatform: PlatformType // Filtre par plateforme/marque

  // Actions
  setSelectedYear: (year: number | null) => void
  setSelectedPeriod: (period: PeriodType) => void
  setSelectedMonth: (month: number | null) => void
  setSelectedPlatform: (platform: PlatformType) => void
  resetFilters: () => void
}

// Options de plateformes disponibles
export const PLATFORM_OPTIONS: {
  value: PlatformType
  label: string
  color: string
  emoji: string
}[] = [
  { value: 'all', label: 'Toutes les plateformes', color: 'slate', emoji: '🌐' },
  { value: 'tribalprint', label: 'Tribal Print', color: 'emerald', emoji: '🖨️' },
  { value: 'muslimprint', label: 'Muslim Print', color: 'purple', emoji: '🕌' },
  { value: 'jerichoprint', label: 'Jericho Print', color: 'orange', emoji: '✝️' },
  { value: 'tribalverra', label: 'Tribal Verra', color: 'blue', emoji: '🪞' },
  { value: 'tribalagency', label: 'Tribal Agency', color: 'pink', emoji: '🎨' },
]

// Années disponibles (depuis la création de Tribal en 2023)
const currentYear = new Date().getFullYear()
export const AVAILABLE_YEARS: (number | null)[] = [
  null, // Option "Toutes les années"
  ...Array.from({ length: currentYear - 2022 }, (_, i) => currentYear - i), // [2026, 2025, 2024, 2023]
]

// Labels pour les années (utilisé dans les dropdowns)
export const getYearLabel = (year: number | null): string => {
  if (year === null) return 'Toutes les années'
  return String(year)
}

// Mois disponibles
export const AVAILABLE_MONTHS = [
  { value: 0, label: 'Janvier' },
  { value: 1, label: 'Février' },
  { value: 2, label: 'Mars' },
  { value: 3, label: 'Avril' },
  { value: 4, label: 'Mai' },
  { value: 5, label: 'Juin' },
  { value: 6, label: 'Juillet' },
  { value: 7, label: 'Août' },
  { value: 8, label: 'Septembre' },
  { value: 9, label: 'Octobre' },
  { value: 10, label: 'Novembre' },
  { value: 11, label: 'Décembre' },
]

// Options de période
export const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'year', label: 'Année' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'month', label: 'Mois' },
  { key: 'week', label: 'Semaine' },
]

const STORAGE_KEY = 'tribal-ops-accounting-filters-v3'

// Store avec persistance localStorage
export const useAccountingFilters = create<AccountingFiltersState>()(
  persist(
    set => ({
      // État initial - année courante, filtre année, toutes les plateformes
      selectedYear: currentYear,
      selectedPeriod: 'year',
      selectedMonth: null, // null = mois courant quand period === 'month'
      selectedPlatform: 'all', // Toutes les plateformes par défaut

      // Actions
      setSelectedYear: year => set({ selectedYear: year }),
      setSelectedPeriod: period => set({ selectedPeriod: period }),
      setSelectedMonth: month => set({ selectedMonth: month, selectedPeriod: 'month' }),
      setSelectedPlatform: platform => set({ selectedPlatform: platform }),
      resetFilters: () =>
        set({
          selectedYear: currentYear,
          selectedPeriod: 'year',
          selectedMonth: null,
          selectedPlatform: 'all',
        }),
    }),
    {
      name: STORAGE_KEY,
      // Ne persister que les données de filtre
      partialize: state => ({
        selectedYear: state.selectedYear,
        selectedPeriod: state.selectedPeriod,
        selectedMonth: state.selectedMonth,
        selectedPlatform: state.selectedPlatform,
      }),
    }
  )
)

// Hook utilitaire pour filtrer les commandes par date
export function filterOrdersByPeriod<
  T extends { received_at?: string | null; created_at?: string | null },
>(
  orders: T[],
  selectedYear: number | null,
  selectedPeriod: PeriodType,
  selectedMonth?: number | null
): T[] {
  const now = new Date()

  return orders.filter((order: any) => {
    const dateStr = order.received_at || order.created_at
    if (!dateStr) return false
    const orderDate = new Date(dateStr)
    const orderYear = orderDate.getFullYear()

    // Si "toutes les années" (null), pas de filtre par année
    if (selectedYear !== null && selectedPeriod !== 'all' && orderYear !== selectedYear)
      return false

    // Filtre par période
    if (selectedPeriod === 'month' && selectedYear !== null) {
      // Si un mois spécifique est sélectionné, l'utiliser, sinon mois courant
      const targetMonth =
        selectedMonth !== null && selectedMonth !== undefined ? selectedMonth : now.getMonth()
      return orderDate.getMonth() === targetMonth && orderYear === selectedYear
    } else if (selectedPeriod === 'quarter' && selectedYear !== null) {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const orderQuarter = Math.floor(orderDate.getMonth() / 3)
      return orderQuarter === currentQuarter && orderYear === selectedYear
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return orderDate >= weekAgo
    }

    return true
  })
}

// Hook utilitaire pour filtrer les factures/invoices par date (utilise le champ 'date')
export function filterInvoicesByPeriod<T extends { date?: string | null }>(
  invoices: T[],
  selectedYear: number | null,
  selectedPeriod: PeriodType,
  selectedMonth?: number | null
): T[] {
  const now = new Date()

  return invoices.filter((invoice: any) => {
    const dateStr = invoice.date
    if (!dateStr) return false
    const invoiceDate = new Date(dateStr)
    const invoiceYear = invoiceDate.getFullYear()

    // Si "toutes les années" (null), pas de filtre par année
    if (selectedYear !== null && selectedPeriod !== 'all' && invoiceYear !== selectedYear)
      return false

    // Filtre par période
    if (selectedPeriod === 'month' && selectedYear !== null) {
      // Si un mois spécifique est sélectionné, l'utiliser, sinon mois courant
      const targetMonth =
        selectedMonth !== null && selectedMonth !== undefined ? selectedMonth : now.getMonth()
      return invoiceDate.getMonth() === targetMonth && invoiceYear === selectedYear
    } else if (selectedPeriod === 'quarter' && selectedYear !== null) {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3)
      return invoiceQuarter === currentQuarter && invoiceYear === selectedYear
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return invoiceDate >= weekAgo
    }

    return true
  })
}

// Hook utilitaire pour filtrer les revenus unifiés par date (utilise invoiceDate ou createdAt)
export function filterRevenuesByPeriod<
  T extends { invoiceDate?: string | null; createdAt?: string | null },
>(
  revenues: T[],
  selectedYear: number | null,
  selectedPeriod: PeriodType,
  selectedMonth?: number | null
): T[] {
  const now = new Date()

  return revenues.filter(revenue => {
    const dateStr = revenue.invoiceDate || revenue.createdAt
    if (!dateStr) return false
    const revenueDate = new Date(dateStr)
    const revenueYear = revenueDate.getFullYear()

    // Si "toutes les années" (null), pas de filtre par année
    if (selectedYear !== null && selectedPeriod !== 'all' && revenueYear !== selectedYear)
      return false

    // Filtre par période
    if (selectedPeriod === 'month' && selectedYear !== null) {
      const targetMonth =
        selectedMonth !== null && selectedMonth !== undefined ? selectedMonth : now.getMonth()
      return revenueDate.getMonth() === targetMonth && revenueYear === selectedYear
    } else if (selectedPeriod === 'quarter' && selectedYear !== null) {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const revenueQuarter = Math.floor(revenueDate.getMonth() / 3)
      return revenueQuarter === currentQuarter && revenueYear === selectedYear
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return revenueDate >= weekAgo
    }

    return true
  })
}

/**
 * Extrait la plateforme source d'une commande depuis le champ tags.source
 * Format attendu: ["web", "tribalprint"] ou ["tribalprint"] ou "tribalprint"
 */
export function extractPlatformFromOrder(order: {
  tags?: { source?: string | string[] } | null
}): PlatformType | null {
  if (!order.tags?.source) return null

  const sourceTags = Array.isArray(order.tags.source) ? order.tags.source : [order.tags.source]

  // La plateforme est le 2ème élément si présent, sinon le 1er (sauf si c'est "web")
  const platform =
    sourceTags.length > 1 ? sourceTags[1] : sourceTags[0] !== 'web' ? sourceTags[0] : null

  // Vérifier que c'est une plateforme valide
  const validPlatforms: PlatformType[] = [
    'tribalprint',
    'muslimprint',
    'jerichoprint',
    'tribalverra',
    'tribalagency',
  ]
  return validPlatforms.includes(platform as PlatformType) ? (platform as PlatformType) : null
}

/**
 * Filtre les commandes par plateforme source
 * @param orders Liste des commandes à filtrer
 * @param selectedPlatform Plateforme sélectionnée ('all' pour toutes)
 */
export function filterOrdersByPlatform<T extends { tags?: { source?: string | string[] } | null }>(
  orders: T[],
  selectedPlatform: PlatformType
): T[] {
  // Si "toutes les plateformes", pas de filtre
  if (selectedPlatform === 'all') return orders

  return orders.filter(order => {
    const orderPlatform = extractPlatformFromOrder(order)
    return orderPlatform === selectedPlatform
  })
}

/**
 * Combine les filtres de période et de plateforme pour les commandes
 */
export function filterOrders<
  T extends {
    received_at?: string | null
    created_at?: string | null
    tags?: { source?: string | string[] } | null
  },
>(
  orders: T[],
  filters: {
    selectedYear: number | null
    selectedPeriod: PeriodType
    selectedMonth?: number | null
    selectedPlatform: PlatformType
  }
): T[] {
  // Appliquer d'abord le filtre par période
  let filtered = filterOrdersByPeriod(
    orders,
    filters.selectedYear,
    filters.selectedPeriod,
    filters.selectedMonth
  )

  // Puis le filtre par plateforme
  filtered = filterOrdersByPlatform(filtered, filters.selectedPlatform)

  return filtered
}

/**
 * Extrait la plateforme d'un revenu unifié depuis metadata.tenantSlug
 */
export function extractPlatformFromRevenue(revenue: {
  source?: string
  metadata?: { tenantSlug?: string } | null
}): PlatformType | null {
  // Si source === AGENCY, c'est tribalagency
  if (revenue.source === 'AGENCY') return 'tribalagency'

  // Pour PRINT, utiliser metadata.tenantSlug
  const tenantSlug = revenue.metadata?.tenantSlug
  if (!tenantSlug) return null

  // Convertir le tenantSlug en PlatformType
  const mapping: Record<string, PlatformType> = {
    'tribal-print': 'tribalprint',
    'muslim-print': 'muslimprint',
    'jericho-print': 'jerichoprint',
    'tribal-verra': 'tribalverra',
    'tribal-agency': 'tribalagency',
  }

  return mapping[tenantSlug] || null
}

/**
 * Filtre les revenus unifiés par plateforme
 * @param revenues Liste des revenus à filtrer
 * @param selectedPlatform Plateforme sélectionnée ('all' pour toutes)
 */
export function filterRevenuesByPlatform<
  T extends { source?: string; metadata?: { tenantSlug?: string } | null },
>(revenues: T[], selectedPlatform: PlatformType): T[] {
  // Si "toutes les plateformes", pas de filtre
  if (selectedPlatform === 'all') return revenues

  return revenues.filter(revenue => {
    const revenuePlatform = extractPlatformFromRevenue(revenue)
    return revenuePlatform === selectedPlatform
  })
}
