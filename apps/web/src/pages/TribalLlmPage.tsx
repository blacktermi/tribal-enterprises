/**
 * TRIBAL LLM - Page principale
 * Layout : LlmSidebar (gauche) + LlmChatView (centre) + LlmCreditsPanel (droite, optionnel)
 * Dark-only premium theme (tribal accent)
 */

import { useState, useCallback } from 'react'
import { Wallet, Menu, LayoutGrid } from 'lucide-react'
import { cn } from '../lib/utils'
import { LlmSidebar } from '../features/tribal-llm/components/LlmSidebar'
import { LlmChatView } from '../features/tribal-llm/components/LlmChatView'
import { LlmCreditsPanel } from '../features/tribal-llm/components/LlmCreditsPanel'
import { useCreditsBalance } from '../features/tribal-llm/hooks/useTribalLlm'
import { useTribalOpsStore } from '../store'

interface TribalLlmPageProps {
  standalone?: boolean
}

export default function TribalLlmPage({ standalone }: TribalLlmPageProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showCreditsPanel, setShowCreditsPanel] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const { data: credits } = useCreditsBalance()
  const setSidebarMobileOpen = useTribalOpsStore(s => s.setSidebarMobileOpen)

  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen(prev => !prev), [])
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), [])

  const walletButton = (
    <button
      onClick={() => setShowCreditsPanel(prev => !prev)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        showCreditsPanel
          ? 'bg-tribal-accent text-tribal-black shadow-md shadow-tribal-accent/20'
          : 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:border-tribal-accent/30 hover:text-tribal-accent'
      )}
      title="Credits & Consommation"
    >
      <Wallet className="w-3.5 h-3.5" />
      {credits?.balance !== undefined && <span>${credits.balance.toFixed(2)}</span>}
    </button>
  )

  // Boutons mobile : menu principal + sidebar LLM
  const sidebarToggle = (
    <div className="flex items-center gap-1 lg:hidden">
      {/* Bouton menu principal (navigation app) */}
      {!standalone && (
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
          title="Menu principal"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
      )}
      {/* Bouton sidebar LLM (historique conversations) */}
      <button
        onClick={toggleMobileSidebar}
        className="p-2 rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
        title="Historique"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  )

  return (
    <div
      className={cn(
        'flex overflow-hidden bg-tribal-black rounded-none',
        standalone ? 'h-screen' : 'h-full'
      )}
    >
      {/* Sidebar */}
      <LlmSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Chat view */}
      <div className="flex-1 min-w-0 flex flex-col">
        <LlmChatView
          conversationId={currentConversationId}
          onConversationCreated={setCurrentConversationId}
          headerRight={walletButton}
          headerLeft={sidebarToggle}
        />
      </div>

      {/* Credits panel */}
      {showCreditsPanel && <LlmCreditsPanel onClose={() => setShowCreditsPanel(false)} />}
    </div>
  )
}
