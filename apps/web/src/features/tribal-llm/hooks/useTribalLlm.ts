/**
 * TRIBAL LLM - React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { llmApi } from '../api/llmApi'

import type { StreamChunk, LlmAttachment } from '../api/llmApi'

const KEYS = {
  conversations: ['llm', 'conversations'] as const,
  conversation: (id: string) => ['llm', 'conversation', id] as const,
  folders: ['llm', 'folders'] as const,
  stats: ['llm', 'stats'] as const,
  balance: ['llm', 'balance'] as const,
  credits: ['llm', 'credits'] as const,
  topUps: ['llm', 'top-ups'] as const,
  usageByModel: ['llm', 'usage-by-model'] as const,
}

// ─── Conversations ───────────────────────────────────────────────────────────

export function useConversations(params?: {
  folderId?: string
  isArchived?: boolean
  search?: string
  page?: number
}) {
  return useQuery({
    queryKey: [...KEYS.conversations, params],
    queryFn: () => llmApi.listConversations(params),
  })
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: KEYS.conversation(id || ''),
    queryFn: () => llmApi.getConversation(id!),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llmApi.createConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

export function useUpdateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof llmApi.updateConversation>[1]) =>
      llmApi.updateConversation(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.conversations })
      qc.invalidateQueries({ queryKey: KEYS.conversation(id) })
    },
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llmApi.deleteConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      conversationId,
      ...data
    }: {
      conversationId: string
      content: string
      model?: string
      temperature?: number
      maxTokens?: number
    }) => llmApi.sendMessage(conversationId, data),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: KEYS.conversation(conversationId) })
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

/**
 * Hook pour streamer un message
 * Retourne une fonction streamMessage et un abort controller
 */
export function useStreamMessage() {
  const qc = useQueryClient()

  const streamMessage = async (
    conversationId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      attachments?: LlmAttachment[]
    },
    signal?: AbortSignal
  ) => {
    await llmApi.streamMessage(conversationId, { content, ...options }, onChunk, signal)
    // Refresh data after stream completes
    qc.invalidateQueries({ queryKey: KEYS.conversation(conversationId) })
    qc.invalidateQueries({ queryKey: KEYS.conversations })
  }

  return { streamMessage }
}

/**
 * Hook pour uploader des fichiers (images, docs, audio)
 */
export function useUploadFiles() {
  return useMutation({
    mutationFn: (files: File[]) => llmApi.uploadFiles(files),
  })
}

/**
 * Hook pour editer un message user et re-streamer la reponse
 */
export function useEditAndRestream() {
  const qc = useQueryClient()

  const editAndRestream = async (
    conversationId: string,
    messageId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      attachments?: LlmAttachment[]
    },
    signal?: AbortSignal
  ) => {
    await llmApi.editAndRestreamMessage(
      conversationId,
      messageId,
      { content, ...options },
      onChunk,
      signal
    )
    // Refresh data after edit+stream completes
    qc.invalidateQueries({ queryKey: KEYS.conversation(conversationId) })
    qc.invalidateQueries({ queryKey: KEYS.conversations })
  }

  return { editAndRestream }
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export function useFolders() {
  return useQuery({
    queryKey: KEYS.folders,
    queryFn: llmApi.listFolders,
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llmApi.createFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.folders })
    },
  })
}

export function useUpdateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      name?: string
      color?: string
      sortOrder?: number
      description?: string
      icon?: string
    }) => llmApi.updateFolder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.folders })
    },
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llmApi.deleteFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.folders })
      qc.invalidateQueries({ queryKey: KEYS.conversations })
    },
  })
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function useLlmStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: llmApi.getStats,
  })
}

// ─── Credits & Balance ────────────────────────────────────────────────────────

export function useOpenRouterBalance() {
  return useQuery({
    queryKey: KEYS.balance,
    queryFn: llmApi.getOpenRouterBalance,
    refetchInterval: 60_000, // Refresh toutes les 60s
  })
}

export function useCreditsBalance() {
  return useQuery({
    queryKey: KEYS.credits,
    queryFn: llmApi.getCreditsBalance,
  })
}

export function useAddTopUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llmApi.addTopUp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.credits })
      qc.invalidateQueries({ queryKey: KEYS.topUps })
    },
  })
}

export function useTopUpHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...KEYS.topUps, params],
    queryFn: () => llmApi.getTopUpHistory(params),
  })
}

export function useUsageByModel(allUsers?: boolean) {
  return useQuery({
    queryKey: [...KEYS.usageByModel, allUsers],
    queryFn: () => llmApi.getUsageByModel(allUsers),
  })
}
