/**
 * Hook pour récupérer les métriques SaaS (Kaui)
 * Appelle GET /api/accounting/saas-metrics
 */
import { useCallback, useEffect, useState } from 'react'
import { resolveApiBase } from '../../utils/api'

// Types
export interface SaasMetricsCurrent {
  mrr: number
  arr: number
  activeSubscriptions: number
  churnRate: number
  arpu: number
}

export interface SaasMetricsHistory {
  id: string
  date: string
  mrr: number
  arr: number
  activeSubscriptions: number
  newSubscriptions: number
  churnedSubscriptions: number
  churnRate: number
  arpu: number
}

export interface SaasMetricsTrends {
  mrrGrowth: number
  subscriptionGrowth: number
}

export interface SaasMetricsResponse {
  current: SaasMetricsCurrent
  history: SaasMetricsHistory[]
  trends: SaasMetricsTrends
}

export type SaasMetricsPeriod = '30d' | '90d' | '12m' | 'all'

interface SaasMetricsState {
  loading: boolean
  error: string | null
  data: SaasMetricsResponse | null
  lastUpdated: Date | null
}

const DEFAULT_REFRESH_INTERVAL = 60_000 // 1 minute

// Fonction pour récupérer les métriques
async function fetchSaasMetrics(
  period: SaasMetricsPeriod = '30d',
  signal?: AbortSignal
): Promise<SaasMetricsResponse> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/saas-metrics?period=${period}`

  const response = await fetch(url, { signal, credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Fonction pour calculer et sauvegarder les métriques du jour
export async function calculateSaasMetrics(): Promise<SaasMetricsHistory> {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/accounting/saas-metrics/calculate`

  const response = await fetch(url, { method: 'POST', credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export interface UseSaasMetricsOptions {
  period?: SaasMetricsPeriod
  refreshInterval?: number
  enabled?: boolean
}

export interface UseSaasMetricsResult {
  loading: boolean
  error: string | null
  data: SaasMetricsResponse | null
  current: SaasMetricsCurrent | null
  history: SaasMetricsHistory[]
  trends: SaasMetricsTrends | null
  lastUpdated: Date | null
  refresh: () => void
  calculate: () => Promise<void>
  setPeriod: (period: SaasMetricsPeriod) => void
}

export function useSaasMetrics(options: UseSaasMetricsOptions = {}): UseSaasMetricsResult {
  const {
    period: initialPeriod = '30d',
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    enabled = true,
  } = options

  const [period, setPeriod] = useState<SaasMetricsPeriod>(initialPeriod)

  const [state, setState] = useState<SaasMetricsState>({
    loading: true,
    error: null,
    data: null,
    lastUpdated: null,
  })

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchSaasMetrics(period)
      setState({
        loading: false,
        error: null,
        data,
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
  }, [enabled, period])

  const calculate = useCallback(async () => {
    try {
      await calculateSaasMetrics()
      await refresh()
    } catch (err) {
      console.error('Erreur de calcul des métriques:', err)
      throw err
    }
  }, [refresh])

  // Chargement initial et lors des changements de période
  useEffect(() => {
    if (!enabled) return
    refresh()
  }, [enabled, refresh])

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
    current: state.data?.current ?? null,
    history: state.data?.history ?? [],
    trends: state.data?.trends ?? null,
    lastUpdated: state.lastUpdated,
    refresh,
    calculate,
    setPeriod,
  }
}

// Hook simplifié pour juste les métriques courantes
export function useSaasMetricsCurrent(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    current: SaasMetricsCurrent | null
  }>({
    loading: true,
    error: null,
    current: null,
  })

  const refresh = useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchSaasMetrics('30d')
      setState({ loading: false, error: null, current: data.current })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message ?? 'Erreur inconnue',
      }))
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) refresh()
  }, [enabled, refresh])

  return { ...state, refresh }
}

// Utilitaires de formatage
export function formatMrr(mrr: number): string {
  if (mrr >= 1_000_000) {
    return `${(mrr / 1_000_000).toFixed(1)}M`
  }
  if (mrr >= 1_000) {
    return `${(mrr / 1_000).toFixed(0)}K`
  }
  return mrr.toLocaleString('fr-FR')
}

export function formatChurnRate(rate: number): string {
  return `${rate.toFixed(2)}%`
}

export function formatGrowth(growth: number): string {
  const sign = growth >= 0 ? '+' : ''
  return `${sign}${growth.toFixed(1)}%`
}
