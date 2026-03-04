/**
 * AI STUDIO - React Query Hooks (Multi-Provider)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aiStudioApi,
  type RunModelPayload,
  type SaveProviderConfigPayload,
} from '../api/aiStudioApi'

// ─── Query Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  balance: ['ai-studio', 'balance'] as const,
  credits: ['ai-studio', 'credits'] as const,
  history: (params?: Record<string, unknown>) => ['ai-studio', 'history', params] as const,
  stats: ['ai-studio', 'stats'] as const,
  topUps: (params?: Record<string, unknown>) => ['ai-studio', 'top-ups', params] as const,
  providers: ['ai-studio', 'providers'] as const,
  providerConfig: (name: string) => ['ai-studio', 'provider-config', name] as const,
  designs: (params?: Record<string, unknown>) => ['ai-studio', 'designs', params] as const,
  designDetail: (id: string) => ['ai-studio', 'design', id] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useBalance() {
  return useQuery({
    queryKey: KEYS.balance,
    queryFn: aiStudioApi.getBalance,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useCredits() {
  return useQuery({
    queryKey: KEYS.credits,
    queryFn: aiStudioApi.getCredits,
    staleTime: 10_000,
  })
}

export function useHistory(params?: {
  page?: number
  limit?: number
  type?: string
  status?: string
  provider?: string
}) {
  return useQuery({
    queryKey: KEYS.history(params),
    queryFn: () => aiStudioApi.getHistory(params),
    staleTime: 5_000,
  })
}

export function useStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: aiStudioApi.getStats,
    staleTime: 30_000,
  })
}

export function useTopUpHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: KEYS.topUps(params),
    queryFn: () => aiStudioApi.getTopUpHistory(params),
    staleTime: 10_000,
  })
}

// ─── Provider Queries ────────────────────────────────────────────────────────

export function useProviders() {
  return useQuery({
    queryKey: KEYS.providers,
    queryFn: aiStudioApi.getProviders,
    staleTime: 30_000,
  })
}

export function useProviderConfig(name: string) {
  return useQuery({
    queryKey: KEYS.providerConfig(name),
    queryFn: () => aiStudioApi.getProviderConfig(name),
    enabled: !!name,
    staleTime: 30_000,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useRunModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RunModelPayload) => aiStudioApi.run(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'history'] })
      queryClient.invalidateQueries({ queryKey: KEYS.credits })
      queryClient.invalidateQueries({ queryKey: KEYS.balance })
      queryClient.invalidateQueries({ queryKey: KEYS.stats })
    },
  })
}

export function useAddTopUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      aiStudioApi.addTopUp(amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.balance })
      queryClient.invalidateQueries({ queryKey: KEYS.credits })
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'top-ups'] })
    },
  })
}

// ─── Provider Mutations ──────────────────────────────────────────────────────

export function useSaveProviderConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: SaveProviderConfigPayload }) =>
      aiStudioApi.saveProviderConfig(name, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.providers })
      // Invalidate all provider configs
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'provider-config'] })
    },
  })
}

export function useDeleteProviderConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => aiStudioApi.deleteProviderConfig(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.providers })
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'provider-config'] })
    },
  })
}

// ─── Design Queries & Mutations ─────────────────────────────────────────────

export function useDesigns(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: KEYS.designs(params),
    queryFn: () => aiStudioApi.designs.list(params),
    staleTime: 10_000,
  })
}

export function useDesignDetail(id: string | null) {
  return useQuery({
    queryKey: KEYS.designDetail(id || ''),
    queryFn: () => aiStudioApi.designs.get(id!),
    enabled: !!id,
    staleTime: 5_000,
  })
}

export function useCreateDesign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name?: string
      width: number
      height: number
      unit?: string
      canvasJson: Record<string, unknown>
    }) => aiStudioApi.designs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'designs'] })
    },
  })
}

export function useUpdateDesign() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; canvasJson?: Record<string, unknown>; thumbnail?: string | null }
    }) => aiStudioApi.designs.update(id, data),
  })
}

export function useDeleteDesign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => aiStudioApi.designs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-studio', 'designs'] })
    },
  })
}
