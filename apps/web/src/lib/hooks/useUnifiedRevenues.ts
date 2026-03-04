/**
 * Hook pour récupérer les revenus unifiés (Print, Agency, Kaui)
 * Appelle GET /api/accounting/unified-revenues et /unified-revenues/summary
 */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { resolveApiBase } from '../../utils/api'

// Types
export type RevenueSource = 'KAUI' | 'AGENCY' | 'PRINT' | 'QUOTE'
export type RevenueType = 'SUBSCRIPTION' | 'PROJECT' | 'PRODUCT'
export type PaymentType = 'DEPOSIT' | 'PAYMENT' | 'BALANCE' | 'REFUND'

export interface UnifiedPaymentRecord {
  id: string
  revenueId: string
  amount: number
  method: string
  type: PaymentType
  reference?: string
  receivedAt: string
  notes?: string
  createdAt: string
}

export interface UnifiedRevenue {
  id: string
  source: RevenueSource
  type: RevenueType
  sourceId: string
  sourceRef?: string
  amount: number
  currency: string
  paidAmount: number
  balance: number
  isPaid: boolean
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  description?: string
  invoiceDate: string
  dueDate?: string
  paidAt?: string
  isRecurring: boolean
  periodStart?: string
  periodEnd?: string
  mrr?: number
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  payments?: UnifiedPaymentRecord[]
}

export type PrintTenantSlug =
  | 'tribal-print'
  | 'jericho-print'
  | 'muslim-print'
  | 'tribal-verra'
  | 'unknown'

export interface PrintTenantStats {
  revenue: number
  paid: number
  pending: number
  count: number
  name: string
}

export interface UnifiedRevenuesSummary {
  totals: {
    revenue: number
    paid: number
    deposits: number
    pending: number
    count: number
    paidCount: number
    depositsCount: number
    pendingCount: number
  }
  bySource: {
    KAUI: { revenue: number; paid: number; pending: number; count: number }
    AGENCY: { revenue: number; paid: number; pending: number; count: number }
    PRINT: { revenue: number; paid: number; pending: number; count: number }
    QUOTE?: { revenue: number; paid: number; pending: number; count: number }
  }
  byPrintTenant?: Record<PrintTenantSlug, PrintTenantStats>
  mrr: number
  arr: number
  pendingRevenues: UnifiedRevenue[]
}

export interface UnifiedRevenuesFilters {
  source?: RevenueSource
  type?: RevenueType
  isPaid?: boolean
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface UnifiedRevenuesPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UnifiedRevenuesState {
  loading: boolean
  error: string | null
  data: UnifiedRevenue[]
  pagination: UnifiedRevenuesPagination | null
  summary: UnifiedRevenuesSummary | null
  lastUpdated: Date | null
}

const DEFAULT_LIMIT = 100 // Réduit de 2000 pour améliorer les performances
const DEFAULT_REFRESH_INTERVAL = 120_000 // 2 minutes (était 1 min)

// Fonction pour récupérer les revenus
async function fetchRevenues(
  filters: UnifiedRevenuesFilters = {},
  signal?: AbortSignal
): Promise<{ data: UnifiedRevenue[]; pagination: UnifiedRevenuesPagination }> {
  const params = new URLSearchParams()

  if (filters.source) params.set('source', filters.source)
  if (filters.type) params.set('type', filters.type)
  if (filters.isPaid !== undefined) params.set('isPaid', String(filters.isPaid))
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  // Toujours envoyer le limit (utilise DEFAULT_LIMIT si non spécifié)
  params.set('limit', String(filters.limit || DEFAULT_LIMIT))

  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues?${params.toString()}`

  const response = await fetch(url, { signal, credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour récupérer le résumé
async function fetchSummary(
  filters?: { startDate?: string; endDate?: string },
  signal?: AbortSignal
): Promise<UnifiedRevenuesSummary> {
  const params = new URLSearchParams()

  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)

  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues/summary?${params.toString()}`

  const response = await fetch(url, { signal, credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour synchroniser les sources
export async function syncRevenues(
  sources: RevenueSource[] = ['PRINT', 'AGENCY', 'KAUI']
): Promise<{ success: boolean; synced: Record<string, number>; total: number; errors?: string[] }> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues/sync`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour enregistrer un paiement
export async function recordPayment(
  revenueId: string,
  payment: {
    amount: number
    method: string
    type?: PaymentType
    reference?: string
    receivedAt: string
    notes?: string
  }
): Promise<UnifiedPaymentRecord> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues/${revenueId}/payments`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour marquer un revenu comme payé
export async function markRevenuePaid(
  revenueId: string,
  method: string,
  notes?: string
): Promise<{ success: boolean; revenue: UnifiedRevenue }> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues/${revenueId}/mark-paid`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, notes }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour convertir un devis en commande
export async function convertQuoteToOrder(quoteId: string): Promise<{
  success: boolean
  order: { id: string; orderNumber: string }
  message: string
}> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/quotes/${quoteId}/convert-to-order`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
    throw new Error(error.error || `Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour changer le mode de paiement d'un revenu
export async function updateRevenuePaymentMethod(
  revenueId: string,
  method: string
): Promise<{ success: boolean; revenue: UnifiedRevenue }> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/unified-revenues/${revenueId}/payment-method`

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export interface UseUnifiedRevenuesOptions {
  filters?: UnifiedRevenuesFilters
  refreshInterval?: number
  enabled?: boolean
  includeSummary?: boolean
  /** Synchroniser automatiquement au premier chargement (défaut: true) */
  autoSync?: boolean
}

export interface UseUnifiedRevenuesResult {
  loading: boolean
  error: string | null
  data: UnifiedRevenue[]
  pagination: UnifiedRevenuesPagination | null
  summary: UnifiedRevenuesSummary | null
  lastUpdated: Date | null
  refresh: () => void
  sync: (sources?: RevenueSource[]) => Promise<void>
  setFilters: (filters: UnifiedRevenuesFilters) => void
}

export function useUnifiedRevenues(
  options: UseUnifiedRevenuesOptions = {}
): UseUnifiedRevenuesResult {
  const {
    filters: initialFilters = {},
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    enabled = true,
    includeSummary = true,
    autoSync = true,
  } = options

  // Flag pour savoir si on a déjà fait la sync initiale
  const hasSyncedRef = useRef(false)

  // Utiliser directement les filtres passés en option (plus réactif)
  // Les filtres internes ne sont utilisés que pour les modifications via setFilters
  const [internalFilters, setFiltersState] = useState<UnifiedRevenuesFilters>({})

  // Fusionner les filtres: initialFilters (props) + internalFilters (état local)
  const filters = useMemo(
    () => ({
      ...initialFilters,
      ...internalFilters,
    }),
    [
      initialFilters.source,
      initialFilters.type,
      initialFilters.isPaid,
      initialFilters.startDate,
      initialFilters.endDate,
      initialFilters.search,
      initialFilters.page,
      initialFilters.limit,
      internalFilters,
    ]
  )

  // Wrapper pour exposer setFilters qui fusionne avec l'état existant
  const setFilters = useCallback((newFilters: UnifiedRevenuesFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const [state, setState] = useState<UnifiedRevenuesState>({
    loading: true,
    error: null,
    data: [],
    pagination: null,
    summary: null,
    lastUpdated: null,
  })

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [revenuesResult, summaryResult] = await Promise.all([
        fetchRevenues(filters),
        includeSummary
          ? fetchSummary({ startDate: filters.startDate, endDate: filters.endDate })
          : Promise.resolve(null),
      ])

      setState({
        loading: false,
        error: null,
        data: revenuesResult.data,
        pagination: revenuesResult.pagination,
        summary: summaryResult,
        lastUpdated: new Date(),
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message ?? 'Erreur inconnue',
      }))
    }
  }, [enabled, filters, includeSummary])

  const sync = useCallback(
    async (sources?: RevenueSource[]) => {
      try {
        await syncRevenues(sources)
        await refresh()
      } catch (err) {
        console.error('Erreur de synchronisation:', err)
        throw err
      }
    },
    [refresh]
  )

  // Chargement initial et lors des changements de filtres
  useEffect(() => {
    if (!enabled) return

    // Charger les données directement
    refresh()

    // Synchronisation automatique en arrière-plan (non bloquante)
    if (autoSync && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      // Sync en arrière-plan - le refresh suivant (via interval) récupérera les nouvelles données
      syncRevenues(['PRINT', 'AGENCY', 'KAUI']).catch(err =>
        console.warn('Auto-sync warning:', err)
      )
    }
  }, [enabled, autoSync, refresh]) // Ajout de refresh pour réagir aux changements de filtres

  // Rafraîchissement automatique
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return

    const interval = window.setInterval(refresh, refreshInterval)
    return () => window.clearInterval(interval)
  }, [enabled, refreshInterval, refresh])

  return {
    loading: state.loading,
    error: state.error,
    data: state.data,
    pagination: state.pagination,
    summary: state.summary,
    lastUpdated: state.lastUpdated,
    refresh,
    sync,
    setFilters,
  }
}

// Hook simplifié pour juste le résumé
export function useUnifiedRevenuesSummary(
  options: { startDate?: string; endDate?: string; enabled?: boolean } = {}
) {
  const { startDate, endDate, enabled = true } = options

  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    summary: UnifiedRevenuesSummary | null
  }>({
    loading: true,
    error: null,
    summary: null,
  })

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const summary = await fetchSummary({ startDate, endDate })
      setState({ loading: false, error: null, summary })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message ?? 'Erreur inconnue',
      }))
    }
  }, [enabled, startDate, endDate])

  useEffect(() => {
    if (enabled) refresh()
  }, [enabled, refresh])

  return { ...state, refresh }
}
