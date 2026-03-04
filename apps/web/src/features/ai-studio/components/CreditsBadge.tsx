import { useState } from 'react'
import { Wallet, Coins, Plus, TrendingDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useBalance, useCredits } from '../hooks/useAiStudio'
import { TopUpModal } from './TopUpModal'

interface CreditsBadgeProps {
  compact?: boolean
}

function getBalanceColor(amount: number): string {
  if (amount > 5) return 'text-tribal-accent'
  if (amount >= 1) return 'text-amber-400'
  return 'text-red-400'
}

export function CreditsBadge({ compact = false }: CreditsBadgeProps) {
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance()
  const { data: creditsData, isLoading: isCreditsLoading } = useCredits()
  const [showTopUp, setShowTopUp] = useState(false)

  const isLoading = isBalanceLoading || isCreditsLoading

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-8 w-20 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="h-8 w-16 rounded-lg bg-white/[0.06] animate-pulse" />
      </div>
    )
  }

  const falBalance = balanceData?.balance ?? 0
  const totalSpent = balanceData?.totalSpent ?? 0
  const internalCredits = creditsData?.balance ?? 0

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowTopUp(true)}
            className={cn(
              'inline-flex items-center gap-1 font-bold font-mono cursor-pointer hover:opacity-80 transition-opacity',
              getBalanceColor(falBalance)
            )}
            title={`Solde fal.ai: $${falBalance.toFixed(2)} (depense: $${totalSpent.toFixed(2)}) — Cliquez pour recharger`}
          >
            <Wallet className="w-3.5 h-3.5" />${falBalance.toFixed(2)}
            <Plus className="w-3 h-3 opacity-50" />
          </button>
          <span className="text-white/20">|</span>
          <span
            className="inline-flex items-center gap-1 font-bold font-mono text-tribal-accent"
            title={`Credits internes: ${internalCredits}`}
          >
            <Coins className="w-3.5 h-3.5" />
            {internalCredits}
          </span>
        </div>
        <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* fal.ai balance — cliquable pour recharger */}
        <div className="group relative">
          <button
            onClick={() => setShowTopUp(true)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer',
              'bg-white/[0.04] backdrop-blur-sm',
              'border border-white/[0.08]',
              'hover:border-tribal-accent/50',
              'hover:bg-tribal-accent/10'
            )}
          >
            <Wallet className={cn('w-3.5 h-3.5', getBalanceColor(falBalance))} />
            <span className={cn('text-xs font-bold font-mono', getBalanceColor(falBalance))}>
              ${falBalance.toFixed(2)}
            </span>
            <Plus className="w-3 h-3 text-white/40 group-hover:text-tribal-accent transition-colors" />
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-10 shadow-xl">
            <div className="text-gray-400 mb-0.5">Solde fal.ai</div>
            <div className="font-bold font-mono">${falBalance.toFixed(2)}</div>
            {totalSpent > 0 && (
              <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                <TrendingDown className="w-2.5 h-2.5" />
                Depense: ${totalSpent.toFixed(2)}
              </div>
            )}
            {falBalance < 1 && (
              <div className="mt-1 text-red-400 font-semibold">Solde faible !</div>
            )}
            <div className="mt-1 text-tribal-accent font-medium">Cliquez pour recharger</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        {/* Internal credits */}
        <div className="group relative">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all',
              'bg-tribal-accent/10 backdrop-blur-sm',
              'border border-tribal-accent/20',
              'hover:border-tribal-accent/40'
            )}
          >
            <Coins className="w-3.5 h-3.5 text-tribal-accent" />
            <span className="text-xs font-bold font-mono text-tribal-accent">{internalCredits}</span>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-10 shadow-xl">
            <div className="text-gray-400 mb-0.5">Tokens (generations restantes)</div>
            <div className="font-bold">{internalCredits} tokens</div>
            {internalCredits < 10 && (
              <div className="mt-1 text-amber-400 font-semibold">Rechargez pour continuer</div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </div>

      <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
    </>
  )
}
