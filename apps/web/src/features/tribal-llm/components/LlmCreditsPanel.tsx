/**
 * TRIBAL LLM - Panneau Credits & Consommation
 * Affiche : solde OpenRouter, solde interne, consommation par modele, historique recharges
 * Dark-only premium theme (tribal accent)
 */

import { useState } from 'react'
import {
  X,
  Wallet,
  TrendingUp,
  Server,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  DollarSign,
  BarChart3,
  Clock,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  useOpenRouterBalance,
  useCreditsBalance,
  useTopUpHistory,
  useUsageByModel,
} from '../hooks/useTribalLlm'
import { LlmTopUpModal } from './LlmTopUpModal'

interface LlmCreditsPanelProps {
  onClose: () => void
}

export function LlmCreditsPanel({ onClose }: LlmCreditsPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'history'>('overview')
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  const { data: orBalance, isLoading: orLoading, refetch: refetchOr } = useOpenRouterBalance()
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useCreditsBalance()
  const { data: modelUsage, isLoading: modelsLoading } = useUsageByModel()
  const { data: topUpHistory, isLoading: historyLoading } = useTopUpHistory({
    page: historyPage,
    limit: 10,
  })

  const handleRefresh = () => {
    refetchOr()
    refetchCredits()
  }

  return (
    <>
      <div className="w-80 lg:w-96 border-l border-white/[0.06] bg-tribal-dark flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-tribal-accent/10 to-tribal-accent-dark/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-tribal-accent" />
            <h2 className="font-semibold text-white text-sm">Credits & Consommation</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              title="Rafraichir"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {[
            { id: 'overview' as const, label: 'Solde', icon: DollarSign },
            { id: 'models' as const, label: 'Modeles', icon: BarChart3 },
            { id: 'history' as const, label: 'Recharges', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-tribal-accent border-b-2 border-tribal-accent'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-studio">
          {activeTab === 'overview' && (
            <OverviewTab
              orBalance={orBalance}
              orLoading={orLoading}
              credits={credits}
              creditsLoading={creditsLoading}
              onTopUp={() => setShowTopUpModal(true)}
            />
          )}

          {activeTab === 'models' && (
            <ModelsTab modelUsage={modelUsage} isLoading={modelsLoading} />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              topUpHistory={topUpHistory}
              isLoading={historyLoading}
              page={historyPage}
              onPageChange={setHistoryPage}
              onTopUp={() => setShowTopUpModal(true)}
            />
          )}
        </div>
      </div>

      {/* Modal top-up */}
      {showTopUpModal && <LlmTopUpModal onClose={() => setShowTopUpModal(false)} />}
    </>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  orBalance,
  orLoading,
  credits,
  creditsLoading,
  onTopUp,
}: {
  orBalance: { usage: number; limit: number | null; isFree: boolean } | undefined
  orLoading: boolean
  credits: { totalTopUps: number; totalUsed: number; balance: number } | undefined
  creditsLoading: boolean
  onTopUp: () => void
}) {
  return (
    <div className="space-y-4">
      {/* OpenRouter Balance Card */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 bg-tribal-accent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">OpenRouter</span>
            </div>
            {orBalance?.isFree && (
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                Free Tier
              </span>
            )}
          </div>
          <div className="mt-2">
            {orLoading ? (
              <div className="h-8 w-24 bg-white/20 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-white">
                ${(orBalance?.usage || 0).toFixed(4)}
              </div>
            )}
            <div className="text-white/70 text-xs mt-0.5">
              {orBalance?.limit ? `Limite : $${orBalance.limit.toFixed(2)}` : 'Pas de limite'}
            </div>
          </div>
        </div>

        {/* Progress bar si limit */}
        {orBalance?.limit && orBalance.limit > 0 && (
          <div className="px-4 py-2 bg-white/[0.03]">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>Utilise</span>
              <span>{((orBalance.usage / orBalance.limit) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-tribal-accent rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((orBalance.usage / orBalance.limit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Internal Credits Card */}
      <div className="rounded-xl border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-tribal-accent" />
            <span className="text-sm font-medium text-white">Credits internes</span>
          </div>
          <button
            onClick={onTopUp}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Recharger
          </button>
        </div>

        {creditsLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-white/[0.06] animate-pulse rounded" />
            <div className="h-4 w-32 bg-white/[0.06] animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div
              className={cn(
                'text-2xl font-bold',
                (credits?.balance || 0) > 0 ? 'text-tribal-accent' : 'text-red-400'
              )}
            >
              ${(credits?.balance || 0).toFixed(4)}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="text-[10px] text-white/30 uppercase tracking-wide">Recharges</div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  ${(credits?.totalTopUps || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="text-[10px] text-white/30 uppercase tracking-wide">Consomme</div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  ${(credits?.totalUsed || 0).toFixed(4)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick tip */}
      <div className="rounded-lg bg-tribal-accent/[0.08] border border-tribal-accent/20 p-3">
        <div className="flex gap-2">
          <Zap className="w-4 h-4 text-tribal-accent shrink-0 mt-0.5" />
          <div className="text-xs text-tribal-accent/80">
            <span className="font-medium">Astuce :</span> Les credits internes permettent de suivre
            la consommation de l'equipe. Le solde OpenRouter montre l'usage reel sur la cle API.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Models Tab ───────────────────────────────────────────────────────────────

function ModelsTab({
  modelUsage,
  isLoading,
}: {
  modelUsage:
    | Array<{
        model: string
        messageCount: number
        promptTokens: number
        completionTokens: number
        totalTokens: number
        cost: number
      }>
    | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/[0.06] animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!modelUsage || modelUsage.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucune consommation pour le moment</p>
      </div>
    )
  }

  const maxCost = Math.max(...modelUsage.map(m => m.cost))

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/40 mb-3">
        {modelUsage.length} modele{modelUsage.length > 1 ? 's' : ''} utilise
        {modelUsage.length > 1 ? 's' : ''}
      </div>

      {modelUsage.map(m => {
        const shortName = m.model.includes('/') ? m.model.split('/').pop()! : m.model

        return (
          <div
            key={m.model}
            className="rounded-lg border border-white/[0.06] p-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-white truncate max-w-[60%]" title={m.model}>
                {shortName}
              </span>
              <span className="text-xs font-semibold text-tribal-accent">${m.cost.toFixed(4)}</span>
            </div>

            {/* Cost bar */}
            <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-tribal-accent rounded-full transition-all duration-300"
                style={{ width: maxCost > 0 ? `${(m.cost / maxCost) * 100}%` : '0%' }}
              />
            </div>

            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span>{m.messageCount} msg</span>
              <span>{formatTokens(m.totalTokens)} tokens</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  topUpHistory,
  isLoading,
  page,
  onPageChange,
  onTopUp,
}: {
  topUpHistory:
    | {
        topUps: Array<{
          id: string
          amount: number
          note: string | null
          addedBy: string
          createdAt: string
          user?: { id: string; name: string; email: string }
        }>
        total: number
        totalPages: number
      }
    | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onTopUp: () => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.06] animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/40">
          {topUpHistory?.total || 0} recharge{(topUpHistory?.total || 0) > 1 ? 's' : ''}
        </div>
        <button
          onClick={onTopUp}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-tribal-accent hover:bg-tribal-accent-light text-tribal-black text-xs font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nouvelle
        </button>
      </div>

      {!topUpHistory?.topUps?.length ? (
        <div className="text-center py-8 text-white/40">
          <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune recharge</p>
          <p className="text-xs mt-1">Cliquez sur "Nouvelle" pour ajouter une recharge</p>
        </div>
      ) : (
        <>
          {topUpHistory.topUps.map(topUp => (
            <div key={topUp.id} className="rounded-lg border border-white/[0.06] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-tribal-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-tribal-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-tribal-accent">
                      +${Number(topUp.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {topUp.user?.name || topUp.user?.email || 'Inconnu'}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-white/40">{formatDate(topUp.createdAt)}</div>
              </div>
              {topUp.note && <div className="mt-1.5 text-xs text-white/50 ml-10">{topUp.note}</div>}
            </div>
          ))}

          {/* Pagination */}
          {topUpHistory.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded disabled:opacity-30 hover:bg-white/[0.06] text-white/40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/40">
                {page} / {topUpHistory.totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= topUpHistory.totalPages}
                className="p-1 rounded disabled:opacity-30 hover:bg-white/[0.06] text-white/40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `Il y a ${diffMin}min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffD < 7) return `Il y a ${diffD}j`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
