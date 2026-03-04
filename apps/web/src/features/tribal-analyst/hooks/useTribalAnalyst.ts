/**
 * TRIBAL ANALYST - React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analystApi } from '../api/analystApi'

import type { StreamChunk } from '../api/analystApi'

const KEYS = {
  conversations: ['analyst', 'conversations'] as const,
  conversation: (id: string) => ['analyst', 'conversation', id] as const,
  insights: ['analyst', 'insights'] as const,
}

// ─── Conversations ───────────────────────────────────────────────────────────

export function useAnalystConversations(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: [...KEYS.conversations, params],
    queryFn: () => analystApi.listConversations(params),
  })
}

export function useAnalystConversation(id: string | null) {
  return useQuery({
    queryKey: KEYS.conversation(id || ''),
    queryFn: () => analystApi.getConversation(id!),
    enabled: !!id,
  })
}

export function useCreateAnalystConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: analystApi.createConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

export function useDeleteAnalystConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: analystApi.deleteConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

// ─── Messages (Streaming) ────────────────────────────────────────────────────

export function useStreamAnalystMessage() {
  const qc = useQueryClient()

  const streamMessage = async (
    conversationId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
    },
    signal?: AbortSignal
  ) => {
    await analystApi.streamMessage(conversationId, { content, ...options }, onChunk, signal)
    // Refresh data after stream completes
    qc.invalidateQueries({ queryKey: KEYS.conversation(conversationId) })
    qc.invalidateQueries({ queryKey: KEYS.conversations })
  }

  return { streamMessage }
}

// ─── Insights ────────────────────────────────────────────────────────────────

export function useBusinessInsights() {
  return useQuery({
    queryKey: KEYS.insights,
    queryFn: analystApi.getInsights,
    refetchInterval: 5 * 60 * 1000, // Refresh toutes les 5 minutes
  })
}

export function useRefreshAnalystCache() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: analystApi.refreshCache,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.insights })
    },
  })
}
