/**
 * TRIBAL LLM - API Client Frontend
 */

const API_BASE = '/api/llm'

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

export interface LlmConversation {
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
  folder?: LlmFolder | null
  _count?: { messages: number }
  messages?: LlmMessageRecord[]
}

export interface LlmMessageRecord {
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

export interface LlmFolder {
  id: string
  userId: string
  name: string
  color: string | null
  description: string | null
  icon: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { conversations: number }
}

export interface LlmStats {
  totalConversations: number
  totalMessages: number
  totalTokens: number
  totalCost: number
}

export interface ConversationsResponse {
  conversations: LlmConversation[]
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

export interface OpenRouterBalance {
  usage: number
  limit: number | null
  isFree: boolean
  rateLimit: { requests: number; interval: string } | null
}

export interface CreditsBalance {
  totalTopUps: number
  totalUsed: number
  balance: number
}

export interface LlmTopUp {
  id: string
  amount: number
  note: string | null
  addedBy: string
  createdAt: string
  user?: { id: string; name: string; email: string }
}

export interface TopUpHistoryResponse {
  topUps: LlmTopUp[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ModelUsage {
  model: string
  messageCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
}

export interface LlmAttachment {
  url: string
  filename: string
  mimeType: string
  size: number
  type: 'image' | 'document' | 'audio'
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export const llmApi = {
  // ─── Conversations ─────────────────────────────────────────────────────

  createConversation: (data: {
    model: string
    provider?: string
    systemPrompt?: string
    folderId?: string
  }): Promise<LlmConversation> =>
    apiRequest<LlmConversation>(`${API_BASE}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listConversations: (params?: {
    folderId?: string
    isArchived?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<ConversationsResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.folderId) searchParams.set('folderId', params.folderId)
    if (params?.isArchived) searchParams.set('isArchived', 'true')
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return apiRequest<ConversationsResponse>(`${API_BASE}/conversations${qs ? `?${qs}` : ''}`)
  },

  getConversation: (id: string): Promise<LlmConversation> =>
    apiRequest<LlmConversation>(`${API_BASE}/conversations/${id}`),

  updateConversation: (
    id: string,
    data: {
      title?: string
      model?: string
      provider?: string
      systemPrompt?: string | null
      folderId?: string | null
      isPinned?: boolean
      isArchived?: boolean
    }
  ): Promise<LlmConversation> =>
    apiRequest<LlmConversation>(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteConversation: (id: string): Promise<void> =>
    apiRequest<void>(`${API_BASE}/conversations/${id}`, { method: 'DELETE' }),

  // ─── Messages ──────────────────────────────────────────────────────────

  sendMessage: (
    conversationId: string,
    data: {
      content: string
      model?: string
      temperature?: number
      maxTokens?: number
      attachments?: LlmAttachment[]
    }
  ): Promise<{ message: LlmMessageRecord; usage: unknown }> =>
    apiRequest(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Stream une reponse via SSE
   * Retourne un reader que le composant peut consommer
   */
  streamMessage: async (
    conversationId: string,
    data: {
      content: string
      model?: string
      temperature?: number
      maxTokens?: number
      attachments?: LlmAttachment[]
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

  /**
   * Editer un message user et re-streamer la reponse via SSE
   */
  editAndRestreamMessage: async (
    conversationId: string,
    messageId: string,
    data: {
      content: string
      model?: string
      temperature?: number
      maxTokens?: number
      attachments?: LlmAttachment[]
    },
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages/${messageId}/edit/stream`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal,
      }
    )

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

  // ─── Upload ─────────────────────────────────────────────────────────────

  uploadFiles: async (files: File[]): Promise<{ files: LlmAttachment[] }> => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        (errorData as { error?: string }).error ||
          `Erreur upload ${response.status}: ${response.statusText}`
      )
    }

    const data = await response.json()
    return (data as { data: { files: LlmAttachment[] } }).data
  },

  // ─── Folders ───────────────────────────────────────────────────────────

  listFolders: (): Promise<LlmFolder[]> => apiRequest<LlmFolder[]>(`${API_BASE}/folders`),

  createFolder: (data: {
    name: string
    color?: string
    description?: string
    icon?: string
  }): Promise<LlmFolder> =>
    apiRequest<LlmFolder>(`${API_BASE}/folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFolder: (
    id: string,
    data: {
      name?: string
      color?: string
      sortOrder?: number
      description?: string
      icon?: string
    }
  ): Promise<LlmFolder> =>
    apiRequest<LlmFolder>(`${API_BASE}/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteFolder: (id: string): Promise<void> =>
    apiRequest<void>(`${API_BASE}/folders/${id}`, { method: 'DELETE' }),

  // ─── Stats ─────────────────────────────────────────────────────────────

  getStats: (): Promise<LlmStats> => apiRequest<LlmStats>(`${API_BASE}/stats`),

  // ─── Credits & Balance ──────────────────────────────────────────────────

  getOpenRouterBalance: (): Promise<OpenRouterBalance> =>
    apiRequest<OpenRouterBalance>(`${API_BASE}/balance`),

  getCreditsBalance: (): Promise<CreditsBalance> =>
    apiRequest<CreditsBalance>(`${API_BASE}/credits`),

  addTopUp: (data: { amount: number; note?: string }): Promise<LlmTopUp> =>
    apiRequest<LlmTopUp>(`${API_BASE}/top-ups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTopUpHistory: (params?: { page?: number; limit?: number }): Promise<TopUpHistoryResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return apiRequest<TopUpHistoryResponse>(`${API_BASE}/top-ups${qs ? `?${qs}` : ''}`)
  },

  getUsageByModel: (allUsers?: boolean): Promise<ModelUsage[]> => {
    const qs = allUsers ? '?allUsers=true' : ''
    return apiRequest<ModelUsage[]>(`${API_BASE}/usage-by-model${qs}`)
  },
}
