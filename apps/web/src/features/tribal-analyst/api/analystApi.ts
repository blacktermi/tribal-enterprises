/**
 * TRIBAL ANALYST - API Client Frontend
 * Client simplifie pour l'analyste IA business
 */

const API_BASE = '/api/analyst'

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
    throw new Error(
      (errorData as { error?: string }).error || `Erreur ${response.status}: ${response.statusText}`
    )
  }

  const data = await response.json()
  return (data as { data: T }).data ?? (data as T)
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalystConversation {
  id: string
  userId: string
  title: string | null
  model: string
  provider: string
  systemPrompt: string | null
  folderId: string | null
  isPinned: boolean
  isArchived: boolean
  totalTokens: number
  totalCost: number
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
  messages?: AnalystMessage[]
}

export interface AnalystMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model: string | null
  promptTokens: number
  completionTokens: number
  cost: number
  duration: number | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ConversationsResponse {
  conversations: AnalystConversation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StreamChunk {
  type: 'delta' | 'done' | 'error' | 'usage'
  content?: string
  error?: string
  messageId?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost: number
  }
}

export interface BusinessInsight {
  type: 'alert' | 'opportunity' | 'trend' | 'info'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  value?: string | number
  change?: number
}

// ─── Snapshot types (complete backend data) ──────────────────────────────────

export interface SnapshotOrders {
  total: number
  currentMonth: { count: number; revenue: number }
  previousMonth: { count: number; revenue: number }
  last30Days: { count: number; revenue: number }
  averageOrderValue: number
  byStatus: Record<string, number>
  byBrand: Array<{ brand: string; count: number; revenue: number }>
  topProducts: Array<{ name: string; count: number; revenue: number }>
}

export interface SnapshotAccounting {
  currentMonth: { revenue: number; expenses: number; profit: number }
  previousMonth: { revenue: number; expenses: number; profit: number }
  yearToDate: { revenue: number; expenses: number; profit: number }
  expensesByCategory: Array<{ category: string; amount: number }>
  unpaidInvoices: { count: number; totalTTC: number }
  unpaidExpenses: { count: number; totalTTC: number }
}

export interface SnapshotCustomers {
  total: number
  newThisMonth: number
  newPreviousMonth: number
  topCustomers: Array<{ name: string; email: string; totalOrders: number; totalSpent: number }>
  byCity: Array<{ city: string; count: number }>
}

export interface SnapshotProducts {
  total: number
  lowStock: number
  outOfStock: number
  lowStockItems: Array<{ name: string; stock: number; minStock: number }>
  outOfStockItems: Array<{ name: string; stock: number; minStock: number }>
  byCategory: Array<{ category: string; count: number }>
}

export interface SnapshotMarketing {
  currentMonthSpend: number
  previousMonthSpend: number
  byBrand: Array<{
    brand: string
    spend: number
    impressions: number
    clicks: number
    reach: number
    cpc: number
    ctr: number
    roas: number
  }>
  topCampaigns: Array<{
    name: string
    spend: number
    impressions: number
    clicks: number
    roas: number
  }>
}

export interface SnapshotTreasury {
  totalBalance: number
  accounts: Array<{
    name: string
    code: string
    type: string
    balance: number
    belowThreshold: boolean
    lowThreshold: number | null
  }>
  recentTransfers: Array<{
    fromAccount: string
    toAccount: string
    amount: number
    date: string
    description: string
  }>
}

export interface SnapshotDelivery {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  successRate: number
  avgDeliveryFee: number
  pendingSettlements: number
  totalOwedByDrivers: number
  totalOwedToDrivers: number
  drivers: Array<{
    name: string
    deliveries: number
    successful: number
    successRate: number
    balance: number
  }>
  byZone: Array<{ zone: string; count: number; avgCost: number }>
}

export interface SnapshotCollaborators {
  total: number
  active: number
  totalSalaryMass: number
  byType: Array<{ type: string; count: number }>
  byBrand: Array<{ brand: string; count: number }>
}

export interface BusinessSnapshot {
  period: { currentMonth: string; previousMonth: string; year: number }
  generatedAt: string
  orders: SnapshotOrders
  accounting: SnapshotAccounting
  customers: SnapshotCustomers
  products: SnapshotProducts
  marketing: SnapshotMarketing
  treasury: SnapshotTreasury
  delivery: SnapshotDelivery
  collaborators: SnapshotCollaborators
}

export interface BusinessInsightsResponse {
  snapshot: BusinessSnapshot
  insights: BusinessInsight[]
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export const analystApi = {
  // ─── Conversations ─────────────────────────────────────────────────────

  createConversation: (data?: { model?: string }): Promise<AnalystConversation> =>
    apiRequest<AnalystConversation>(`${API_BASE}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  listConversations: (params?: {
    search?: string
    page?: number
    limit?: number
  }): Promise<ConversationsResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return apiRequest<ConversationsResponse>(`${API_BASE}/conversations${qs ? `?${qs}` : ''}`)
  },

  getConversation: (id: string): Promise<AnalystConversation> =>
    apiRequest<AnalystConversation>(`${API_BASE}/conversations/${id}`),

  deleteConversation: (id: string): Promise<void> =>
    apiRequest<void>(`${API_BASE}/conversations/${id}`, { method: 'DELETE' }),

  // ─── Messages (SSE Streaming) ──────────────────────────────────────────

  streamMessage: async (
    conversationId: string,
    data: {
      content: string
      model?: string
      temperature?: number
      maxTokens?: number
    },
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        (errorData as { error?: string }).error ||
          `Erreur ${response.status}: ${response.statusText}`
      )
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Pas de body dans la reponse')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)

          if (data === '[DONE]') return

          try {
            const chunk = JSON.parse(data) as StreamChunk
            onChunk(chunk)
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },

  // ─── Insights ──────────────────────────────────────────────────────────

  getInsights: (): Promise<BusinessInsightsResponse> =>
    apiRequest<BusinessInsightsResponse>(`${API_BASE}/insights`),

  refreshCache: (): Promise<{ message: string }> =>
    apiRequest<{ message: string }>(`${API_BASE}/refresh-cache`, { method: 'POST' }),
}
