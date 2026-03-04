/**
 * AI STUDIO - API Client Frontend (Multi-Provider)
 */

const API_BASE = '/api/ai-studio'

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const data = errorData as { message?: string; error?: string | { message?: string } }
    const errorMsg =
      data.message ||
      (typeof data.error === 'string' ? data.error : data.error?.message) ||
      `Erreur ${response.status}: ${response.statusText}`
    throw new Error(errorMsg)
  }

  const data = await response.json()
  return (data as { data: T }).data ?? (data as T)
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RunModelPayload {
  modelId: string
  type: string
  prompt?: string
  input: Record<string, unknown>
  inputUrls?: string[]
  /** Provider backend: 'fal' | 'openrouter' (defaut: 'fal') */
  provider?: string
}

export interface GenerationResult {
  generation: {
    id: string
    provider: string
    status: string
    outputUrls: string[]
    cost: number
    duration: number
    seed?: number
  }
  data: unknown
}

export interface FalBalance {
  balance: number
  currency: string
  totalTopUps: number
  totalSpent: number
}

export interface UserCredits {
  balance: number
}

export interface FalTopUp {
  id: string
  amount: number
  note: string | null
  addedBy: { id: string; name: string | null }
  createdAt: string
}

export interface TopUpHistoryResponse {
  topUps: FalTopUp[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AiGenerationRecord {
  id: string
  userId: string
  provider: string
  modelId: string
  type: string
  prompt: string | null
  inputUrls: string[] | null
  outputUrls: string[] | null
  cost: number
  creditsUsed: number
  parameters: Record<string, unknown> | null
  status: string
  error: string | null
  duration: number | null
  createdAt: string
}

export interface HistoryResponse {
  generations: AiGenerationRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface StatsResponse {
  totalGenerations: number
  totalCost: number
  byType: Array<{ type: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  byProvider: Array<{ provider: string; count: number }>
}

// ─── Provider Types ──────────────────────────────────────────────────────────

export interface ProviderInfo {
  name: string
  displayName: string
  configured: boolean
  enabled: boolean
  hasEnvKey: boolean
  hasDbKey: boolean
}

export interface ProviderConfig {
  provider: string
  enabled: boolean
  hasKey: boolean
  keyPreview: string
  config: Record<string, unknown> | null
}

export interface SaveProviderConfigPayload {
  apiKey: string
  enabled?: boolean
  config?: Record<string, unknown>
}

// ─── Design Types ────────────────────────────────────────────────────────────

export interface DesignRecord {
  id: string
  name: string
  width: number
  height: number
  unit: string
  thumbnail: string | null
  updatedAt: string
  createdAt: string
}

export interface DesignDetail extends DesignRecord {
  canvasJson: Record<string, unknown>
}

export interface DesignsListResponse {
  designs: DesignRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export const aiStudioApi = {
  /**
   * Executer un modele via le provider specifie
   */
  run: (payload: RunModelPayload): Promise<GenerationResult> =>
    apiRequest<GenerationResult>(`${API_BASE}/run`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Solde interne (recharges - depenses)
   */
  getBalance: (): Promise<FalBalance> => apiRequest<FalBalance>(`${API_BASE}/balance`),

  /**
   * Ajouter une recharge
   */
  addTopUp: (amount: number, note?: string): Promise<FalTopUp> =>
    apiRequest<FalTopUp>(`${API_BASE}/top-up`, {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
    }),

  /**
   * Historique des recharges
   */
  getTopUpHistory: (params?: { page?: number; limit?: number }): Promise<TopUpHistoryResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return apiRequest<TopUpHistoryResponse>(`${API_BASE}/top-ups${qs ? `?${qs}` : ''}`)
  },

  /**
   * Credits internes
   */
  getCredits: (): Promise<UserCredits> => apiRequest<UserCredits>(`${API_BASE}/credits`),

  /**
   * Historique des generations (avec filtre provider optionnel)
   */
  getHistory: (params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    provider?: string
  }): Promise<HistoryResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.provider) searchParams.set('provider', params.provider)
    const qs = searchParams.toString()
    return apiRequest<HistoryResponse>(`${API_BASE}/history${qs ? `?${qs}` : ''}`)
  },

  /**
   * Statistiques (inclut byProvider)
   */
  getStats: (): Promise<StatsResponse> => apiRequest<StatsResponse>(`${API_BASE}/stats`),

  // ─── Provider Config ─────────────────────────────────────────────────────

  /**
   * Liste des providers avec statut
   */
  getProviders: (): Promise<ProviderInfo[]> => apiRequest<ProviderInfo[]>(`${API_BASE}/providers`),

  /**
   * Config d'un provider (cle masquee)
   */
  getProviderConfig: (name: string): Promise<ProviderConfig | null> =>
    apiRequest<ProviderConfig | null>(`${API_BASE}/providers/${name}/config`),

  /**
   * Sauvegarder/MAJ la config d'un provider
   */
  saveProviderConfig: (
    name: string,
    payload: SaveProviderConfigPayload
  ): Promise<{ provider: string; enabled: boolean }> =>
    apiRequest<{ provider: string; enabled: boolean }>(`${API_BASE}/providers/${name}/config`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /**
   * Supprimer la config d'un provider
   */
  deleteProviderConfig: (name: string): Promise<void> =>
    apiRequest<void>(`${API_BASE}/providers/${name}/config`, {
      method: 'DELETE',
    }),

  // ─── Designs ──────────────────────────────────────────────────────────────

  designs: {
    create: (data: {
      name?: string
      width: number
      height: number
      unit?: string
      canvasJson: Record<string, unknown>
    }): Promise<DesignRecord> =>
      apiRequest<DesignRecord>(`${API_BASE}/designs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: { name?: string; canvasJson?: Record<string, unknown>; thumbnail?: string | null }
    ): Promise<DesignRecord> =>
      apiRequest<DesignRecord>(`${API_BASE}/designs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    list: (params?: { page?: number; limit?: number }): Promise<DesignsListResponse> => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const qs = searchParams.toString()
      return apiRequest<DesignsListResponse>(`${API_BASE}/designs${qs ? `?${qs}` : ''}`)
    },

    get: (id: string): Promise<DesignDetail> =>
      apiRequest<DesignDetail>(`${API_BASE}/designs/${id}`),

    delete: (id: string): Promise<void> =>
      apiRequest<void>(`${API_BASE}/designs/${id}`, {
        method: 'DELETE',
      }),
  },
}
