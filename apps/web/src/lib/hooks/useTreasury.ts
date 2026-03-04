/**
 * Hooks React Query pour la Trésorerie
 * Gestion des comptes, virements, frais, ajustements et rapprochements
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resolveApiBase } from '../../utils/api'

// =====================================================
// TYPES
// =====================================================

export type TreasuryAccountType = 'MOBILE_MONEY' | 'BANK' | 'CASH'

export type TreasuryFeeType =
  | 'FRAIS_TENUE'
  | 'AGIOS'
  | 'FRAIS_VIREMENT'
  | 'COMMISSION'
  | 'FRAIS_RETRAIT'
  | 'OTHER'

export type TreasuryAdjustmentType =
  | 'CAPITAL_INJECTION'
  | 'ASSOCIATE_WITHDRAWAL'
  | 'LOAN_RECEIVED'
  | 'LOAN_REPAYMENT'
  | 'CORRECTION'
  | 'OTHER'

export type TreasuryReconciliationStatus = 'PENDING' | 'VALIDATED' | 'WITH_DIFFERENCE'

export interface TreasuryAccount {
  id: string
  code: string
  name: string
  type: TreasuryAccountType
  currency: string
  isActive: boolean
  initialBalance: number
  initialDate: string
  lowThreshold?: number
  color?: string
  icon?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TreasuryTransfer {
  id: string
  date: string
  fromAccountId: string
  toAccountId: string
  amount: number
  feeAmount: number
  reference?: string
  memo?: string
  isReconciled: boolean
  reconciledAt?: string
  createdAt: string
  createdBy?: string
  fromAccount?: { id: string; code: string; name: string }
  toAccount?: { id: string; code: string; name: string }
}

export interface TreasuryFee {
  id: string
  date: string
  accountId: string
  type: TreasuryFeeType
  amount: number
  reference?: string
  memo?: string
  isReconciled: boolean
  createdAt: string
  createdBy?: string
  account?: { id: string; code: string; name: string }
}

export interface TreasuryAdjustment {
  id: string
  date: string
  accountId: string
  type: TreasuryAdjustmentType
  amount: number
  associateName?: string
  reference?: string
  memo?: string
  createdAt: string
  createdBy?: string
  account?: { id: string; code: string; name: string }
}

export interface TreasuryReconciliation {
  id: string
  accountId: string
  date: string
  theoreticalBalance: number
  actualBalance: number
  difference: number
  status: TreasuryReconciliationStatus
  notes?: string
  createdAt: string
  validatedAt?: string
  validatedBy?: string
  account?: { id: string; code: string; name: string }
}

export interface TreasurySummary {
  date: string
  accounts: Array<{
    id: string
    code: string
    name: string
    type: TreasuryAccountType
    color?: string
    balance: number
    revenues?: number
    expenses?: number
    lowThreshold?: number
    isLow: boolean
  }>
  totalBalance: number
}

export interface TreasuryMovement {
  id: string
  date: string
  type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'FEE' | 'ADJUSTMENT'
  accountCode: string
  accountName: string
  description: string
  amount: number
  reference?: string
  memo?: string
}

// =====================================================
// API HELPERS
// =====================================================

const apiBase = resolveApiBase()

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}/treasury${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(error.error || 'Erreur serveur')
  }

  const result = await response.json()
  return result.data ?? result
}

// =====================================================
// HOOKS - COMPTES
// =====================================================

/**
 * Liste des comptes de trésorerie actifs
 */
export function useTreasuryAccounts() {
  return useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => fetchApi<TreasuryAccount[]>('/accounts'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Liste de tous les comptes (actifs et inactifs)
 */
export function useTreasuryAccountsAll() {
  return useQuery({
    queryKey: ['treasury', 'accounts', 'all'],
    queryFn: () => fetchApi<TreasuryAccount[]>('/accounts/all'),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Détails d'un compte
 */
export function useTreasuryAccount(id: string) {
  return useQuery({
    queryKey: ['treasury', 'accounts', id],
    queryFn: () => fetchApi<TreasuryAccount>(`/accounts/${id}`),
    enabled: !!id,
  })
}

/**
 * Solde d'un compte à une date
 */
export function useTreasuryAccountBalance(id: string, date?: string) {
  return useQuery({
    queryKey: ['treasury', 'accounts', id, 'balance', date],
    queryFn: () =>
      fetchApi<{ accountId: string; balance: number; date: string }>(
        `/accounts/${id}/balance${date ? `?date=${date}` : ''}`
      ),
    enabled: !!id,
  })
}

/**
 * Mutations pour les comptes
 */
export function useTreasuryAccountMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data: Partial<TreasuryAccount>) =>
      fetchApi<TreasuryAccount>('/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }: Partial<TreasuryAccount> & { id: string }) =>
      fetchApi<TreasuryAccount>(`/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
    },
  })

  return { create, update }
}

// =====================================================
// HOOKS - VIREMENTS
// =====================================================

interface TransferFilters {
  startDate?: string
  endDate?: string
  accountId?: string
  isReconciled?: boolean
  limit?: number
  offset?: number
}

/**
 * Liste des virements avec filtres
 */
export function useTreasuryTransfers(filters: TransferFilters = {}) {
  const params = new URLSearchParams()
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.isReconciled !== undefined) params.set('isReconciled', String(filters.isReconciled))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery({
    queryKey: ['treasury', 'transfers', filters],
    queryFn: () =>
      fetchApi<{ data: TreasuryTransfer[]; meta: { total: number } }>(
        `/transfers?${params.toString()}`
      ).then(res => res),
  })
}

/**
 * Mutations pour les virements
 */
export function useTreasuryTransferMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data: Omit<TreasuryTransfer, 'id' | 'createdAt'>) =>
      fetchApi<TreasuryTransfer>('/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'transfers'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }: Partial<TreasuryTransfer> & { id: string }) =>
      fetchApi<TreasuryTransfer>(`/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'transfers'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => fetchApi<void>(`/transfers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'transfers'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  return { create, update, remove }
}

// =====================================================
// HOOKS - FRAIS BANCAIRES
// =====================================================

interface FeeFilters {
  startDate?: string
  endDate?: string
  accountId?: string
  type?: TreasuryFeeType
  limit?: number
  offset?: number
}

/**
 * Liste des frais bancaires
 */
export function useTreasuryFees(filters: FeeFilters = {}) {
  const params = new URLSearchParams()
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.type) params.set('type', filters.type)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery({
    queryKey: ['treasury', 'fees', filters],
    queryFn: () =>
      fetchApi<{ data: TreasuryFee[]; meta: { total: number } }>(`/fees?${params.toString()}`).then(
        res => res
      ),
  })
}

/**
 * Mutations pour les frais
 */
export function useTreasuryFeeMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data: Omit<TreasuryFee, 'id' | 'createdAt'>) =>
      fetchApi<TreasuryFee>('/fees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'fees'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => fetchApi<void>(`/fees/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'fees'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  return { create, remove }
}

// =====================================================
// HOOKS - AJUSTEMENTS
// =====================================================

interface AdjustmentFilters {
  startDate?: string
  endDate?: string
  accountId?: string
  type?: TreasuryAdjustmentType
  limit?: number
  offset?: number
}

/**
 * Liste des ajustements
 */
export function useTreasuryAdjustments(filters: AdjustmentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.type) params.set('type', filters.type)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery({
    queryKey: ['treasury', 'adjustments', filters],
    queryFn: () =>
      fetchApi<{ data: TreasuryAdjustment[]; meta: { total: number } }>(
        `/adjustments?${params.toString()}`
      ).then(res => res),
  })
}

/**
 * Mutations pour les ajustements
 */
export function useTreasuryAdjustmentMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data: Omit<TreasuryAdjustment, 'id' | 'createdAt'>) =>
      fetchApi<TreasuryAdjustment>('/adjustments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => fetchApi<void>(`/adjustments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'history'] })
    },
  })

  return { create, remove }
}

// =====================================================
// HOOKS - RAPPROCHEMENTS
// =====================================================

interface ReconciliationFilters {
  accountId?: string
  status?: TreasuryReconciliationStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * Liste des rapprochements
 */
export function useTreasuryReconciliations(filters: ReconciliationFilters = {}) {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.status) params.set('status', filters.status)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery({
    queryKey: ['treasury', 'reconciliations', filters],
    queryFn: () =>
      fetchApi<{ data: TreasuryReconciliation[]; meta: { total: number } }>(
        `/reconciliations?${params.toString()}`
      ).then(res => res),
  })
}

/**
 * Mutations pour les rapprochements
 */
export function useTreasuryReconciliationMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data: {
      accountId: string
      date: string
      theoreticalBalance: number
      actualBalance: number
      notes?: string
    }) =>
      fetchApi<TreasuryReconciliation>('/reconciliations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'reconciliations'] })
    },
  })

  const validate = useMutation({
    mutationFn: ({
      id,
      validatedBy,
      createAdjustment,
    }: {
      id: string
      validatedBy: string
      createAdjustment?: boolean
    }) =>
      fetchApi<TreasuryReconciliation>(`/reconciliations/${id}/validate`, {
        method: 'PATCH',
        body: JSON.stringify({ validatedBy, createAdjustment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['treasury', 'summary'] })
    },
  })

  return { create, validate }
}

// =====================================================
// HOOKS - SYNTHÈSE ET HISTORIQUE
// =====================================================

/**
 * Synthèse globale de la trésorerie
 */
export function useTreasurySummary(date?: string) {
  return useQuery({
    queryKey: ['treasury', 'summary', date],
    queryFn: () => fetchApi<TreasurySummary>(`/summary${date ? `?date=${date}` : ''}`),
    staleTime: 30 * 1000, // 30 secondes
  })
}

/**
 * Historique des mouvements
 */
export function useTreasuryHistory(
  filters: {
    accountId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  } = {}
) {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery({
    queryKey: ['treasury', 'history', filters],
    queryFn: () =>
      fetchApi<{ data: TreasuryMovement[]; meta: { total: number } }>(
        `/history?${params.toString()}`
      ).then(res => res),
  })
}

// =====================================================
// HOOK - MIGRATION DEPUIS LOCALSTORAGE
// =====================================================

interface LocalStorageData {
  initialBalances?: Record<string, number>
  internalTransfers?: Array<{
    id?: string
    date: string
    from: string
    to: string
    amount: number
    note?: string
    memo?: string
  }>
  bankFees?: Array<{
    id?: string
    date: string
    account: string
    type: string
    amount: number
    note?: string
    memo?: string
  }>
  treasuryAdjustments?: Array<{
    id?: string
    date: string
    account: string
    type: string
    amount: number
    associateName?: string
    note?: string
    memo?: string
  }>
}

interface MigrationResult {
  initialBalances: number
  transfers: number
  fees: number
  adjustments: number
  errors: string[]
}

/**
 * Hook pour migrer les données localStorage vers la DB
 */
export function useTreasuryMigration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LocalStorageData) =>
      fetchApi<MigrationResult>('/migrate-from-local', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalider tout le cache treasury
      queryClient.invalidateQueries({ queryKey: ['treasury'] })
    },
  })
}

// =====================================================
// HOOK COMBINÉ POUR LA PAGE TRÉSORERIE
// =====================================================

/**
 * Hook combiné qui fournit toutes les données nécessaires pour la page Trésorerie
 * Remplace l'ancien useTresorerie basé sur localStorage
 */
export function useTreasuryPage(
  options: {
    startDate?: string
    endDate?: string
  } = {}
) {
  const { startDate, endDate } = options

  // Données principales
  const accountsQuery = useTreasuryAccounts()
  const summaryQuery = useTreasurySummary()
  const transfersQuery = useTreasuryTransfers({ startDate, endDate, limit: 50 })
  const feesQuery = useTreasuryFees({ startDate, endDate, limit: 50 })
  const adjustmentsQuery = useTreasuryAdjustments({ startDate, endDate, limit: 50 })

  // Mutations
  const accountMutations = useTreasuryAccountMutations()
  const transferMutations = useTreasuryTransferMutations()
  const feeMutations = useTreasuryFeeMutations()
  const adjustmentMutations = useTreasuryAdjustmentMutations()

  // État de chargement global
  const isLoading = accountsQuery.isLoading || summaryQuery.isLoading || transfersQuery.isLoading

  const error = accountsQuery.error || summaryQuery.error || transfersQuery.error

  return {
    // Données
    accounts: accountsQuery.data ?? [],
    summary: summaryQuery.data,
    transfers: transfersQuery.data?.data ?? [],
    fees: feesQuery.data?.data ?? [],
    adjustments: adjustmentsQuery.data?.data ?? [],

    // État
    isLoading,
    error,

    // Mutations
    createTransfer: transferMutations.create.mutateAsync,
    deleteTransfer: transferMutations.remove.mutateAsync,
    createFee: feeMutations.create.mutateAsync,
    deleteFee: feeMutations.remove.mutateAsync,
    createAdjustment: adjustmentMutations.create.mutateAsync,
    deleteAdjustment: adjustmentMutations.remove.mutateAsync,
    updateAccount: accountMutations.update.mutateAsync,

    // Refetch
    refetch: () => {
      accountsQuery.refetch()
      summaryQuery.refetch()
      transfersQuery.refetch()
      feesQuery.refetch()
      adjustmentsQuery.refetch()
    },
  }
}
